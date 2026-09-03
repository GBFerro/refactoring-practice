# Walkthrough — two named results instead of one reused variable

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: the test that tells the two apart

`tripCostCents` has two `let`-reassignments in it before you touch anything: the loop's
running total, and the single reassignment of `amount` to the deposit refund. Only one of
them is the smell, and the difference is not "is it reassigned" — both are. The difference
is what question each reassignment answers.

**Does the second assignment answer the same question as the first?**

The loop's accumulator is reassigned once per tier, and every single time the question is
still "how much has this trip been metered for so far." Fifteen reassignments of that kind
are one variable doing one job fifteen times. That is what an accumulator *is* — a loop
total, a string builder, anything whose reassignments are steps toward one answer rather
than answers to different questions.

`amount = trip.dockConfirmed ? tariff.depositCents : 0;` fails the test outright. The
question up to that line was "what does the meter say"; the question after it is "how much
deposit comes back." Nothing about the second value builds on the first — it doesn't add to
it, adjust it, or refine it. It just discards it and starts over under the same name. That
is the whole definition of the smell this refactoring exists to fix, and it is also the
whole test for recognizing it: an accumulator's history explains its final value; this
reassignment's history is irrelevant to its final value.

Answer that question *before* touching any code. It is what step 1 mechanically encodes.

## Why this order

Split before you rename. If you rename `amount` to `meteredFareCents` while it still holds
the deposit refund for the second half of the function, you have not fixed anything — you
have written a name that lies for half the function's body instead of a name that never
had one to begin with. The split has to land first so that every subsequent rename is
renaming something that only ever meant one thing.

## Step 1 — split the deposit refund off

```ts
// before
amount = trip.dockConfirmed ? tariff.depositCents : 0;

return {
  meteredFareCents,
  depositRefundCents: amount,
  totalDueCents: Math.max(meteredFareCents - amount, 0),
};

// after
const depositRefundCents = trip.dockConfirmed ? tariff.depositCents : 0;

return {
  meteredFareCents,
  depositRefundCents,
  totalDueCents: Math.max(meteredFareCents - depositRefundCents, 0),
};
```

This is the core move, and it is smaller than it looks: the right-hand side of the
assignment does not change at all. Only the left-hand side does — a fresh `const` instead
of a second write into a name someone else already claimed. Behaviour is identical, because
`amount`'s first value was already captured into `meteredFareCents` on the line before this
one; nothing here was reading `amount` for its first meaning after this point.

**On the name.** `depositRefundCents`, not `refund` and not `deposit`. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — is what rules out
`deposit`: this value is not the deposit, it is what comes *back* of it, and those differ
whenever `dockConfirmed` is false. `refund` alone fails question 2: a trip-cost module
could plausibly refund several different things later (a cancellation, an overcharge), and
`refund` would not tell you which. Matching the repository's own convention for unit-bearing
numbers — `paceSecondsPerKm`, not `pace`, per `NAMING.md`'s conventions table — the name
also carries `Cents`, the same way `meteredFareCents` and `totalDueCents` already do.

## Step 2 — rename the survivor

```ts
// before
let amount = 0;
for (const tier of tariff.tiers) {
  amount += minutesInTier(trip.durationMinutes, tier) * tier.centsPerMinute;
}
const meteredFareCents = amount;

// after
let meteredFareCents = 0;
for (const tier of tariff.tiers) {
  meteredFareCents += minutesInTier(trip.durationMinutes, tier) * tier.centsPerMinute;
}
```

Once step 1 lands, `amount` only ever means one thing for the rest of the function's life,
which is exactly the precondition Rename Variable wants: a name change is safe to reason
about only when every use of the old name means the same thing. Renaming it here is
mechanical — every site that reads or writes `amount` is reading or writing the metered
fare, full stop.

**On the name.** `meteredFareCents`, not `total` and not `fareCents`. Question 3 — does it
read at the call site? — is what decides between the last two: at the return statement,
`meteredFareCents` tells you which of the function's two numbers you're looking at without
having to remember which one `fareCents` was short for. `total` fails question 2 outright:
`totalDueCents` is sitting three lines below it in the same object literal, and `total`
could plausibly be either one. Two names in one function that could each mean "the total"
is precisely the trap question 2 exists to catch.

## Step 3 — delete the alias

```ts
// before
let meteredFareCents = 0;
for (const tier of tariff.tiers) {
  meteredFareCents += minutesInTier(trip.durationMinutes, tier) * tier.centsPerMinute;
}
const meteredFareCents = amount; // ← now a compile error: duplicate declaration

// after
let meteredFareCents = 0;
for (const tier of tariff.tiers) {
  meteredFareCents += minutesInTier(trip.durationMinutes, tier) * tier.centsPerMinute;
}
```

Once step 2 renames the loop's own accumulator, the old capture line
(`const meteredFareCents = amount;`) is not just redundant, it is a duplicate declaration
of the same identifier — TypeScript refuses to compile it, which is as strong a signal to
delete a line as this repository ever gets. This is the one step in the whole route where
the compiler does the reviewing for you instead of a reader.

**On the name.** No new name is introduced here, but a decision is made: I did not keep
`meteredFareCents` as a `let` initialised once and never reassigned after the loop, the way
`depositRefundCents` is a `const`. I considered it, briefly, on the theory that consistency
with `depositRefundCents` would make the two look more alike. I rejected it — question 4
again: `let` here is *true*. The accumulator really is reassigned, tier by tier, and a
reader scanning for `let` versus `const` should be able to trust that signal. Forcing it to
`const` after the fact — computing the sum with `reduce` instead of a loop, say — would
have been a legitimate second refactoring (closer to *Replace Loop with Pipeline*, chapter
8), but folding it into this one would mean two refactorings landing in one commit with one
name for the reader to make sense of both.

## What it cost

The honest part. Two things:

- **The function reads less like a single calculation now and more like two calculations
  glued together at the return statement.** Before this refactoring, `amount` gave the
  impression — wrongly — that everything in the function was building toward one number.
  After it, the shape of the code admits what was always true: this function computes two
  independent things and combines them at the end. That admission is the entire point, but
  it does mean the function is three lines longer for a computation that a determined
  reader could have reconstructed from the smelly version anyway, just at higher risk.
- **I am not fully sure `totalDueCents` belongs in this function at all.** It is a query
  computed from the other two fields on every call, never stored, so it is not a variable
  with two jobs — but a reviewer could reasonably argue it is a third *concern* riding
  along with two that this drill is supposed to keep separate, and that
  `tripCostCents` should return just `{ meteredFareCents, depositRefundCents }` and let a
  caller compute `totalDueCents` if it needs it. I kept it because every caller of a
  trip-cost function needs "what do I actually charge" more often than the two components
  that produce it, and duplicating `Math.max(a - b, 0)` at every call site felt worse than
  one extra field here. I would not be surprised to be argued out of this.

## If you took a different route

- **Renaming `amount` to `meteredFareCents` in the same commit as the split**, rather than
  two commits. Defensible for a change this small — nothing here is genuinely risky either
  way. I kept them separate mostly to make the point that they are two different
  refactorings (Split Variable, then Rename Variable) that happen to arrive back to back,
  the same way `drill-06-01`'s walkthrough notes that *Replace Temp with Query* shows up
  uninvited inside an *Extract Function* drill. Refactorings come in flocks; this drill
  just has a small one.
- **Computing `meteredFareCents` with `reduce` instead of a `for` loop.** Also fine, and
  arguably more idiomatic once the accumulator has a real name. I left the loop as a loop
  because introducing `reduce` here would be a second, unrelated refactoring riding on top
  of this one, and this drill has exactly one dominant smell to fix.

What is *not* a matter of taste: leaving a single variable to carry both the metered fare
and the deposit refund past the point where their values diverge, or renaming it before
splitting it. The first is the smell this drill exists to remove; the second just moves the
lie to a new name.

## Where TypeScript makes this different from the book

Fowler's *Split Variable* is written against JavaScript, where `let amount` reassigned from
a `number` to a `number` is invisible to any tool — nothing in the language distinguishes
"still answering the same question" from "now answering a different one," because both
reassignments type-check identically. TypeScript does not close that gap here either, and
it is worth being explicit about why: the compiler only objects to a reused variable when
the two roles disagree on *type*. If the deposit refund had been a `string` — a formatted
amount, say — reassigning `amount` to hold it would have been a type error the moment you
tried, and the smell would have been impossible to write in the first place. It is
precisely because both roles here are honestly `number` that the compiler has nothing to
say, and this is also why the smell is common in real code: money, counts, and durations
collide on the same primitive type constantly, so the type checker's silence is the normal
case here, not an edge case. Catching this one is a reading exercise in TypeScript exactly
as much as it is in JavaScript — `tsc --noEmit` passes on the smelly version without a
single complaint.
