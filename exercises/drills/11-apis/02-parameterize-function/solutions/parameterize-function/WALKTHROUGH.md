# Walkthrough — one rise, a lookup table for the tier

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what each name had to earn, and the one step
that is not in the route at all because it is a decision *not* to act.

---

## Why `apiFrozen: false`

`tests/callers.spec.ts` imports `raiseStandardBand`, `raiseRestrictedViewBand`, and
`raisePriceBands` — the three functions the box office's sales system actually calls when a
performance's remaining capacity crosses a demand threshold. It says nothing about
`raiseByFive`, `raiseByTen`, `raiseByTwenty`, or the dispatcher between them: those are
private to the module, so collapsing three functions into one cannot break anything outside
`src/`.

That is the whole reason this drill can exist as a drill. Parameterize Function replaces N
functions with one taking a value — there is no way to do that and keep every one of the N
original names callable. A drill built around it either freezes the boundary the callers
actually use and tests through that, or it has nothing left to pin.

## Step 0 — the move nowhere in the table

Before touching anything, read all four raise functions side by side:

```ts
function raiseByFive(band: PriceBand): PriceBand {
  return { ...band, pricePounds: band.pricePounds + 5 };
}
function raiseByTen(band: PriceBand): PriceBand {
  return { ...band, pricePounds: band.pricePounds + 10 };
}
function raiseByTwenty(band: PriceBand): PriceBand {
  return { ...band, pricePounds: band.pricePounds + 20 };
}

export function raiseRestrictedViewBand(band: PriceBand, tier: DemandTier): PriceBand {
  const raised = raiseByTier(band, tier);
  return raised.pricePounds > RESTRICTED_VIEW_CAP_POUNDS
    ? { ...raised, pricePounds: RESTRICTED_VIEW_CAP_POUNDS }
    : raised;
}
```

The tempting read is "four near-identical raise functions, differing only by a number —
merge all four." Look closer and the fourth is not differing by a number at all. Its tier
amounts are exactly the same three literals as the other three; the thing that makes it
different is the two lines after `raiseByTier` runs, the ones that were never duplicated
anywhere because they only exist here.

This is the test the book's *Parameterize Function* mechanics do not spell out, because the
book's examples are constructed so the answer is already yes: **do these functions differ
only in a value, or do they differ in what the value is allowed to mean?** For the standard
band, "5, 10, or 20" is the whole story — a flat rise, full stop. For the restricted-view
band, "5, 10, or 20, but never past 45" is the whole story, and the "never past 45" is not a
detail you can recover later. It comes from the venue's letting agreement, not from the
demand tier, and no amount parameter can carry two independent facts through one number.

Fold `raiseRestrictedViewBand` into the merge and the mechanical result still compiles and
the naive obvious tests still pass — right up until a performance sells out, hits `"high"`,
and a restricted-view seat that should have stopped at £45 lists at £80 instead, because the
one function that knew about the ceiling no longer exists. **Finding this function and
leaving it alone is the actual exercise.** The merge itself, once you know which three
functions it applies to, is the easy half.

## Why this order otherwise

Once the fourth function is set aside, the remaining three — `raiseByFive`, `raiseByTen`,
`raiseByTwenty` — really do differ only in a literal, called from one place
(`raiseByTier`'s `if`/`else`). The book's mechanics for Parameterize Function are explicit:
introduce the general function beside the specific ones, migrate one caller at a time, then
delete what's now dead. That order — additive before subtractive — is what steps 1 through
5 are. Nothing is ever unreachable or broken mid-route.

## Step 1 — `raisePrice`, introduced unused

```ts
function raisePrice(band: PriceBand, risePounds: number): PriceBand {
  return { ...band, pricePounds: band.pricePounds + risePounds };
}
```

Nothing calls it yet. This is the step people are tempted to skip straight past — write the
general function *and* rewire every caller in one commit — but doing it in one step means
the one commit that could be wrong is also the one commit doing everything, and a single
red test tells you nothing about which part broke.

**On the name — the function itself.** `raisePrice`, not `raise`. `raise` was my first
draft, and it survives question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — it says *what*, not *how*, and nothing
about the mechanism leaks into it. It fails question 2: this module is about price bands
for a box office that also does refunds and holds elsewhere in the same codebase, and
"raise" alone could plausibly be a pay rise, a raised hold, an appeal escalated to a
supervisor — a name that fits a dozen things identifies none of them. `raisePrice` costs
one extra word and buys back the second question.

## Steps 2 to 4 — migrating one tier at a time

```ts
// before
function raiseByTier(band: PriceBand, tier: DemandTier): PriceBand {
  if (tier === "low") return raiseByFive(band);
  if (tier === "medium") return raiseByTen(band);
  return raiseByTwenty(band);
}

// after step 2 only
function raiseByTier(band: PriceBand, tier: DemandTier): PriceBand {
  if (tier === "low") return raisePrice(band, 5);
  if (tier === "medium") return raiseByTen(band);
  return raiseByTwenty(band);
}
```

Three commits, one branch each, exactly mirroring how the reference drill splits duplicate
removal into "extract" and "replace the second copy" — the same reasoning applies three
times over instead of twice. If the `"high"` branch's `20` had actually been `25` somewhere
— a stale price rise nobody updated — the commit that migrates the high branch is the one
that would have to change the literal, and it would be the only one, so it would be obvious
in review. Migrating all three in one commit hides that kind of drift inside a mechanical
diff that looks like it isn't changing behavior.

## Step 5 — deleting the dead functions

Once step 4 lands, `raiseByFive`, `raiseByTen`, and `raiseByTwenty` have no callers. Delete
them. This is the step with no judgment call in it at all — dead code is dead code — but
skipping it is how a codebase ends up with a `raiseByTen` that nothing calls, sitting next
to `raisePrice(band, 10)`, both true, only one of them read.

## Step 6 — the table, and where the parameter name gets decided

```ts
// before
function raiseByTier(band: PriceBand, tier: DemandTier): PriceBand {
  if (tier === "low") return raisePrice(band, 5);
  if (tier === "medium") return raisePrice(band, 10);
  return raisePrice(band, 20);
}
export function raiseStandardBand(band: PriceBand, tier: DemandTier): PriceBand {
  return raiseByTier(band, tier);
}

// after
const TIER_RISE_POUNDS: Record<DemandTier, number> = { low: 5, medium: 10, high: 20 };
export function raiseStandardBand(band: PriceBand, tier: DemandTier): PriceBand {
  return raisePrice(band, TIER_RISE_POUNDS[tier]);
}
```

`raiseByTier` was already nothing but an `if`/`else` that picked a literal by tier — once
the three branches all call the same function with a different number, that is a lookup
table wearing a conditional's clothes. `Record<DemandTier, number>` says so directly and
removes a function whose entire job was "select a number" once the three numbers live
somewhere a subscript can find them. `raiseRestrictedViewBand` moves onto the same table in
this step — same source of amounts as before — but keeps calling `raisePrice` and keeps its
own clamp; it is never routed through `raiseStandardBand`.

### The parameter name, properly

This is the step the exercise is really about, more than the table is. `raisePrice(band,
risePounds)` needs a second argument, and every name I tried first was wrong in a specific,
checkable way. Going through them against
[`NAMING.md`](../../../../../../docs/NAMING.md)'s four questions, in the order it says to
ask them:

- **`amount`.** Fails question 2 immediately — could it be the name of something else in
  this file? This is a box office; `amount` could be a refund amount, a booking total, a
  fee. At the call site, `raisePrice(band, amount)` tells you there is a number and nothing
  else. This was my actual first draft, straight out of muscle memory from writing generic
  helpers, and it is exactly the name the brief for this exercise warns against by name.
- **`value`.** Same failure, worse — it does not even suggest money.
- **`delta`.** Passes question 2 (it is not the name of five other things here) but fails
  question 1: it describes *how* the number is used — as a difference added to something —
  not *what* it represents in this domain. `delta` is the vocabulary of the implementation,
  not of a box office. It also reads as though it could be negative, which a price rise
  never is here.
- **`pounds`.** Carries a unit, which is progress, but fails question 4 — is it true? A
  reader meeting `raisePrice(band, pounds)` cold has no reason to think `pounds` is an
  *increase* rather than the band's new total price. The name is not false exactly, but it
  is not the whole truth, and the missing half is the half that matters.
- **`risePounds`.** Accepted. It is the pattern this repository's own naming conventions
  table asks for — a unit-bearing number, the same shape as `paceSecondsPerKm` in the
  Extract Function drill: not just a quantity, but a quantity that says what it is a
  quantity *of*. `raisePrice(band, risePounds)` reads correctly at the definition, and
  `TIER_RISE_POUNDS[tier]` at the call site carries the same word, so the constant and the
  parameter it feeds visibly agree with each other.

None of these were tried and discarded in five minutes. `delta` in particular felt done
until I tried to write the doc comment for it and the comment turned into a paragraph
explaining what `delta` meant — which, per `NAMING.md`, is the tell that the function needs
a different word, not a longer comment.

## What it cost

Two things worth being honest about:

- **A parameter that used to be three names is now one number**, and TypeScript cannot
  check that the number you pass is one of the three the domain actually uses.
  `raiseStandardBand(band, "high")` still can't typo its way to a bad tier — `DemandTier`
  is a union and the compiler rejects anything else — but if a future change needed a rise
  that is not one of the three standard tiers, nothing stops a caller writing
  `raisePrice(band, 17)` directly and inventing a rise the rest of the system has never
  heard of. The three named functions could not be misused that way; they could only be
  called correctly or not called. This is the real trade in `meta.json`'s tradeoff line,
  and it is not free.
- **I do not love that `raisePrice` is not exported.** `raiseStandardBand` and
  `raiseRestrictedViewBand` both wrap it, and both wraps are one line. A reviewer could
  reasonably ask why `raisePrice` isn't just the public function, with tier-to-amount
  lookup left to the caller. I kept it private because the callers this module actually has
  are tier-shaped, not amount-shaped — nothing outside this file has ever wanted to say "go
  up by 17 pounds" — and exporting a more general capability than any caller needs is a
  door left open on the chance someone walks through it. I am not fully certain that is
  right; it is a judgment call, not a rule.

## Where TypeScript makes this different from the book

Fowler's `raise` example is JavaScript with an untyped `factor`. Here, `DemandTier` is a
string-literal union (`"low" | "medium" | "high"`), so `TIER_RISE_POUNDS` is typed as
`Record<DemandTier, number>` — the compiler rejects the table if a tier is missing an entry
or if a key is spelled wrong, which is exactly the failure mode a plain object literal
allows in JavaScript. That safety net is what let step 6 collapse the `if`/`else` with
confidence: in JavaScript, replacing an exhaustive conditional with a lookup object is a
readability improvement that a typo can silently break; in TypeScript with `Record`, the
same typo is a compile error instead of a bug found at a demand-tier boundary in
production.

## If you took a different route

Some real alternatives, roughly in order of how defensible they are:

- **A `switch` instead of the `Record` in step 6.** Fully defensible, and arguably more
  familiar to a reader coming from the book's own examples, which favor conditionals. I
  used the table because `DemandTier` is a small closed union and TypeScript can check a
  `Record` against it exhaustively, which a `switch` only does with a `default: assertNever`
  pattern that is more machinery than three tiers need.
- **Exporting `raisePrice` directly instead of the two tier-shaped wrappers.** Discussed
  above under "what it cost." Reasonable; I would not push back hard on it in review.
- **Doing steps 2 through 4 as one commit instead of three.** Faster, and for a function
  this small the risk is low. I kept them separate because the habit is the point of the
  drill more than the three lines are.

What is *not* a matter of taste: merging `raiseRestrictedViewBand` into the parameterized
function, in any form — as a fourth table entry, as a `capped: boolean` flag, or as a
special-cased tier. (A `capped` flag is worth naming specifically: it would compile, the
happy-path tests would still pass, and it is precisely the shape chapter 11's own *Remove
Flag Argument* exists to warn you away from — arriving at the smell backwards, by inventing
it during a different refactoring instead of removing an existing one.) Naming the merged
parameter `amount` or `value` is the other one. Both are the two things this exercise
exists to catch.
