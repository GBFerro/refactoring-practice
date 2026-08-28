# Walkthrough — five named factors, one function

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what each name had to earn, and the one
decision I am not fully sure about. Read it after you have your own version, not before.

---

## Why this order (and why order barely matters here)

Extract Function has a real dependency order — leaves before branches, or you drag half a
function's mess into your new one. Extract Variable does not, and that difference is worth
noticing on its own. Each of the five sub-expressions in `calculateEntryFee` reads its
inputs from `entry` and `race` directly; none of them reads a value another extraction
produces, except `discountedBase`, which reads the three factors *after* they exist. Do
that one last (or first, and build the factors as you go) and the other four can happen in
any order you like. I did them left to right through the expression, top to bottom, purely
because it made the diff easy to review — not because the code demanded it.

That is itself the thing to notice: **when the order doesn't matter, that is evidence the
extractions are independent, which is evidence you are doing Extract Variable and not a
disguised Extract Function.** If reordering the steps had broken anything, that would have
meant one "variable" was secretly doing work that belonged in a function of its own.

## Step 1 — `memberFactor`

```ts
// before
race.baseFeeCents * (entry.isMember ? MEMBER_DISCOUNT : 1) * ...

// after
const memberFactor = entry.isMember ? MEMBER_DISCOUNT : 1;
race.baseFeeCents * memberFactor * ...
```

The mechanical part is one line. The naming part is the whole exercise.

**On the name.** Not `memberDiscount`. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — kills that name immediately:
when `entry.isMember` is `false`, the value is `1`, and `1` is not a discount, it is the
absence of one. `memberFactor` is true in both branches, because a factor of `1` is still
honestly a factor. This is the naming decision the other two discount extractions copy, so
getting it right here mattered more than it looks.

## Step 2 — `earlyBirdFactor`

Same shape, same reasoning: `isEarlyBird(entry, race) ? EARLY_BIRD_DISCOUNT : 1`. The only
new thing worth flagging is that this factor is the one built from a function call rather
than a field comparison — `isEarlyBird` already existed, unchanged, before this drill
started. Extracting the variable does not touch it; the naming work here is entirely about
the ternary that wraps the call, not the call itself.

## Step 3 — `nonHostSurcharge`, and the direction problem

```ts
const nonHostSurcharge = entry.club === race.hostClub ? 1 : NON_HOST_SURCHARGE;
```

This is the one I rewrote twice. My first attempt was `hostDiscount`, matching the shape of
the other two names — `X ? somethingSpecial : 1`. It is wrong, and it took writing out the
truth table to see why: for a runner from the host club, the value is `1`, not a number
below `1`. There is no discount anywhere in this expression; there is a *surcharge* for
runners who are not local, and no adjustment at all for runners who are. `hostDiscount`
would have been question 4's failure mode exactly — a name that is true in one branch and
false in the other, which is the kind of "slightly wrong" name that is worse than an
honest `x1` or `x2` because it actively misleads.

**On the name.** `nonHostSurcharge`, naming the branch that actually does something,
mirrors the domain: there is one real cost here (the surcharge), and the `1` is its
absence, not a second thing needing its own name. Question 1 — does it survive a rewrite of
the body? If the surcharge changed from a flat multiplier to a fixed extra fee, the name
`nonHostSurcharge` would still be true; `hostDiscount` would have been false from the start
and stayed false.

## Step 4 — `discountedBase`, and the name I am not certain about

```ts
const discountedBase =
  race.baseFeeCents * memberFactor * earlyBirdFactor * nonHostSurcharge;
```

I combined all three factors into the base fee in one extraction rather than building it up
across three, because by this point the three factors already exist and multiplying them
together is one idea: "the base fee, adjusted by everything that scales it." That is
question 3 — read it at the call site, inside `Math.round(discountedBase + ...)` — and
`discountedBase` reads as one clause there, where `race.baseFeeCents * memberFactor *
earlyBirdFactor * nonHostSurcharge` inlined again would not have gained anything over the
original expression.

Here is what I am not certain about. `discountedBase` is not always a discount — a runner
from another club with no other qualifying discount gets `nonHostSurcharge` applied and
pays *more* than `race.baseFeeCents`, not less. Strictly by question 4, this name is false
in that branch. My defence is that "discounted base fee" is close to how the club's own
paperwork would describe this figure regardless of which way any individual factor moves
it, and `adjustedBase` — the honest alternative — is vaguer in exchange for being exactly
true. I went with the domain phrase. A reviewer preferring `adjustedBase` would not be
wrong, and this is the one call in the file I would not fight over.

## Step 5 — `ageAdjustment`

```ts
const ageAdjustment = ageAdjustmentCents(entry.ageCategory);
return Math.round(discountedBase + ageAdjustment + AFFILIATION_FEE_CENTS);
```

`ageAdjustmentCents` already existed and already had a defensible name; this step only
extracts the *result* of calling it. Worth asking anyway: why `ageAdjustment` here and not
`ageDiscount`, when every current age category produces a value `<= 0`? Because unlike
`memberFactor` and `earlyBirdFactor`, which are true by construction (a factor of `1` is
always a no-op factor), "every category so far has been a discount" is an empirical fact
about today's three categories, not a property of the name. Add a fourth category with a
surcharge — a bank-holiday loading, say — and `ageDiscount` would go from true to false
without a single line of this function changing. `ageAdjustment` was true on day one and
stays true no matter what `ageAdjustmentCents` grows into.

## What this cost

- **Six lines instead of one.** The `return` statement was replaced by five `const`s and a
  shorter `return`. Nothing about what the function *computes* is different; the trade is
  purely readability for length, which is the entire premise of Extract Variable and worth
  saying plainly rather than pretending it is free.
- **`discountedBase`**, discussed above, is the name most likely to earn a comment in
  review. I kept it; I would not be surprised to lose that argument.
- **A latent gap `ageAdjustmentCents` already had, now more visible.** It handles
  `"junior"` and `"senior"` explicitly and falls through to `0` for everything else,
  including `"adult"` — which is correct today, but also correct for a *mistyped* category
  the type system did not catch, since the fallthrough swallows both. This was true before
  this drill and Extract Variable does not fix it; naming `ageAdjustment` just put it one
  line closer to where a reader would notice.

## If you took a different route

- **One variable for all three multiplicative factors, extracted together, instead of
  three separate ones.** Defensible, and mentioned in the README's hints. You lose the
  ability to see which discount is which without expanding the variable again; you gain a
  shorter function. I extracted them separately because the whole point here was making
  each factor legible on its own, but "the whole point" is my framing, not a rule.
- **`adjustedBase` instead of `discountedBase`.** Covered above. Equally defensible; I
  would call this the more conservative choice.
- **Extracting `Math.round(...)`'s entire argument into one variable, then returning
  `Math.round(total)`.** Also fine — a matter of whether you consider "round the total" or
  "compute the total" the last idea in the function. I left `Math.round` wrapping the
  expression directly because the function's whole job is captured in that one line once
  the pieces have names, and a `total` variable used exactly once would not have paid for
  itself.

What is *not* a matter of taste: turning any of these five extractions into a separate
*function*. `isEarlyBird` and `ageAdjustmentCents` already existed as functions before this
drill and stayed exactly as they were; nothing new was added to that list. A version of
this exercise that ends with `calculateMemberFactor`, `calculateEarlyBirdFactor`, and so on
has quietly turned an Extract Variable drill into an Extract Function one, and the person
who did that has not practiced the thing this exercise is for.

## Where TypeScript makes this different from the book

Fowler's examples read these five factors out of loosely-typed arguments; there is nothing
stopping a caller from passing an `ageCategory` that is not one of the three the switch
expects. Here, `AgeCategory` is a string literal union — `"junior" | "adult" | "senior"` —
so `ageAdjustmentCents` cannot be called with a value the compiler doesn't already know
about, and TypeScript would reject a fourth category at every call site until
`AgeCategory` itself was widened. That protects the *shape* of the input. It does not
protect the *inside* of `ageAdjustmentCents`, which is worth noticing precisely because it
looks like it should: the function's own `if`/`if`/`return 0` chain is not written as an
exhaustive `switch`, so adding `"veteran"` to the union would compile cleanly and silently
fall through to `0` inside the function that is supposed to know about it. TypeScript's
type system caught the caller's mistake and missed the implementer's — a distinction the
book, without a type system to lean on, never gets to draw at all.
