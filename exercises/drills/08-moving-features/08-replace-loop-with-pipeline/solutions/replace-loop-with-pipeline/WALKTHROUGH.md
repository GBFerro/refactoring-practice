# Walkthrough — named pipeline steps, one loop left alone

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what a name had to earn, and why one of the
six loops in this file is not on the route at all.

---

## Before anything: which loops are actually pipelines in disguise

`report.ts` has six loops. Read them before converting anything, and sort them into two
piles.

**Five of them** declare an empty array or a running total, walk a collection once, and
either push something in or add something to the total. Nothing else happens inside the
loop body — no early return, no state that survives past the collection, no decision that
depends on more than the current element. That shape has a name: it is `filter`, `map`, or
`reduce`, spelled out by hand.

**One of them**, `findCapacityBreach`, returns from inside the loop the moment it finds
what it is looking for, and the thing it accumulates — a running weight — has to stop being
trustworthy the instant the loop is about to exit. That is a different shape, and the rest
of this file explains why it stays exactly as it is.

Sorting the loops first is the whole point of this exercise. **Replace Loop with Pipeline**
is not "loops are bad, delete them" — it is "a loop that is already imitating a named
collection operation should say so." A loop that is not imitating one should stay a loop.
Converting on autopilot, without doing this sort first, is how you end up with a `reduce`
that also carries a `found` flag around just to fake an early exit — a pipeline wearing a
loop's clothes, which is worse than either one honestly written.

## Step 1 — `isAccepted`, before touching either filter

```ts
function isAccepted(delivery: Delivery): boolean {
  return delivery.qualityPassed;
}
```

`acceptedDeliveries` and `rejectedDeliveries` both test `delivery.qualityPassed` — one
directly, one negated. Naming that test once, before converting either loop, means both
conversions can hand `filter` a predicate instead of an inline arrow, and it means there is
exactly one place that defines what "accepted" means for the rest of the file to agree on.

**On the name.** `isAccepted`, not `passesQuality` or `qualityOk`. This is question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md): is it true, at the level the caller
cares about? `qualityPassed` is the field — the fact recorded at the dock. `isAccepted` is
the decision the report is actually built around: which pile a delivery lands in. Today
those two things happen to be the same boolean, and `isAccepted` is a one-line pass-through
because of it. That is a real cost, not a free win — see "What it cost" below — but the
name earns its keep the day acceptance stops being *only* a quality check (a capacity cap,
say) and every caller of `isAccepted` keeps working without having learned a new fact about
the domain.

I considered not extracting a predicate at all and inlining
`deliveries.filter((d) => d.qualityPassed)` at each call site. Rejected: it is the same
seven characters typed twice, and question 2 — could this be the name of something else? —
already flags `qualityPassed` read directly at two call sites as the kind of small
duplication this chapter exists to remove, even at the cost of a function that is presently
one line long.

## Steps 2 and 3 — the two filters

```ts
// before
function acceptedDeliveries(deliveries: readonly Delivery[]): Delivery[] {
  const accepted: Delivery[] = [];
  for (const delivery of deliveries) {
    if (delivery.qualityPassed) {
      accepted.push(delivery);
    }
  }
  return accepted;
}

// after
function acceptedDeliveries(deliveries: readonly Delivery[]): Delivery[] {
  return deliveries.filter(isAccepted);
}
```

Mechanical, once step 1 exists. `rejectedDeliveries` is the more interesting of the two:

```ts
function rejectedDeliveries(deliveries: readonly Delivery[]): Delivery[] {
  return deliveries.filter((delivery) => !isAccepted(delivery));
}
```

**On the name — or rather, on the name I did not write.** I considered a matching
`isRejected` predicate, symmetrical with `isAccepted` and arguably more readable at its own
call site (`filter(isRejected)` needs no arrow). I rejected it. `isRejected` would test
`!delivery.qualityPassed` independently, which means "accepted" would be defined in two
places that happen to agree today. `filter((delivery) => !isAccepted(delivery))` can't
drift, because there is only one definition of acceptance to drift from. This is question 4
again, at the level of the *pair* of functions rather than one name: a name that is true by
construction beats a name that is merely true right now. The cost is a three-token arrow
function instead of a bare reference at the one call site that wants it — small, and I'd
make the same trade again.

## Steps 4 and 5 — the two `map`s

```ts
// before
function renderAcceptedSection(deliveries: readonly Delivery[]): string[] {
  const accepted = acceptedDeliveries(deliveries);
  const lines: string[] = [];
  for (const delivery of accepted) {
    lines.push(renderAcceptedLine(delivery));
  }
  return lines.length > 0 ? lines : ["  (none)"];
}

// after
function renderAcceptedSection(deliveries: readonly Delivery[]): string[] {
  const accepted = acceptedDeliveries(deliveries);
  return accepted.length > 0 ? accepted.map(renderAcceptedLine) : ["  (none)"];
}
```

`renderAcceptedLine` already existed and already had the right shape — one delivery in, one
line out — so this step is `.map(renderAcceptedLine)` and nothing more. No arrow function
needed: question 3 from `NAMING.md` (does it read at the call site?) is why. Passing the
function by reference reads as "map every accepted delivery through the thing that renders
one," which is what the loop was doing all along, just slower to read. `renderRejectedSection`
is the same move against `renderRejectedLine`.

The `lines.length > 0 ? lines : ["  (none)"]` fallback survives unchanged in both — it
moves from testing the loop's output array to testing the mapped array, but the guard
itself was never part of the loop, so there was nothing to convert there.

## Step 6 — `reduce`, and the case for stopping there

```ts
// before
function acceptedTotalCents(accepted: readonly Delivery[]): number {
  let total = 0;
  for (const delivery of accepted) {
    total += delivery.costCents;
  }
  return total;
}

// after
function acceptedTotalCents(accepted: readonly Delivery[]): number {
  return accepted.reduce((sum, delivery) => sum + delivery.costCents, 0);
}
```

The least controversial step in the file — a running total with no branch inside the loop
is the textbook `reduce`. The only decision worth a sentence is the accumulator's name:
`sum`, not `total` or `acc`. `total` is already the name the *function* promises
(`acceptedTotalCents`); reusing it for the parameter would have two different things called
`total` seven characters apart, and `acc` describes the mechanism (an accumulator) rather
than what it is accumulating — the same objection `NAMING.md` raises against
`calculatePaceByDividingSecondsByKm` in the chapter 6 drill, in miniature.

## Why `findCapacityBreach` does not move

```ts
function findCapacityBreach(
  deliveries: readonly Delivery[],
  capacityKg: number,
): CapacityBreach | undefined {
  let runningWeightKg = 0;
  for (const [index, delivery] of deliveries.entries()) {
    runningWeightKg += delivery.weightKg;
    if (runningWeightKg <= capacityKg) continue;
    return { position: index + 1, supplierName: delivery.supplierName };
  }
  return undefined;
}
```

This is the loop the exercise is really testing you on, and it is worth trying to convert
before believing the comment above it. Two shapes look tempting:

**`reduce` over the whole array, carrying `{ runningWeightKg, breach }`.** It compiles, and
it passes the tests, because `reduce` will happily keep folding weight into the total long
after the breach is already known — the accumulator has to remember "have I already found
it?" and refuse to overwrite the answer once it has one. That extra flag is a loop's control
flow smuggled into a pipeline's clothing. You have not removed the imperative logic; you
have hidden it inside a callback where it is harder to see, and you have made the function
do strictly more work than it needs to on every delivery after the breach.

**`findIndex` with a running total computed some other way.** This needs the running total
*before* you can test each index, which means precomputing an array of running weights — a
`map` with hidden state (each element depends on the one before it), which is exactly the
kind of "step" that is not a named transformation at all. You would be writing a second
loop to avoid admitting the first one was fine.

The honest reason this loop stays a loop: **its job is to stop early, and reporting where
it stopped is the answer.** `reduce` cannot stop; it always visits every element. A plain
`for...of` with a `continue` and a `return` says "keep going until you know, then say what
you found" in exactly as many words as the problem needs. Forcing it into a pipeline
would not make it more readable — it would make it a pipeline that lies about doing
one thing when it is quietly doing two: accumulating and remembering whether to stop
accumulating.

This is the trade-off worth stating plainly, and the one the rest of the module can lean
on: **a pipeline reads well when each step is a named transformation over the whole
collection, and it reads worse than a loop the moment a step needs to see state carried
over from earlier elements, or needs to stop before the end.** Five loops in this file had
no such need. This one does.

## Where TypeScript changes the picture

Every parameter in this file is `readonly Delivery[]`, which the book's JavaScript
examples have no equivalent for. Two effects worth naming:

- **The readonly-ness is what makes the loop-to-`filter` conversion feel inevitable rather
  than optional.** A hand-rolled loop that pushes into a *new* local array was never
  mutating the parameter — but the type signature already advertises "I only read this,"
  and `.filter()`/`.map()`/`.reduce()` are the vocabulary that keeps the promise visible at
  the call site instead of only in the parameter type three lines up.
- **`.filter()` on a `readonly Delivery[]` returns `Delivery[]`, not
  `readonly Delivery[]`.** That is why `acceptedDeliveries`'s return type did not need to
  change even though its parameter is readonly — worth knowing before you go looking for a
  type error that was never going to appear.

One near-miss: writing `accepted.reduce((sum, delivery) => sum + delivery.costCents)`
*without* the `0` looks almost identical and type-checks differently — TypeScript infers
the accumulator's type from the array's element type when there is no seed, so `sum` would
be inferred as `Delivery`, and `sum + delivery.costCents` fails to compile. In the book's
JavaScript the equivalent mistake would run, return `NaN` on an empty array, and only show
up in a test (or not, if nobody tested the empty case). Here it never compiles. That is a
genuine case of the type system catching a mistake this chapter is prone to, before the
suite even runs.

## What it cost

Two things I am not fully settled on:

- **`isAccepted` is a one-line wrapper around a single field read**, which is close to the
  shape the *Lazy Element* smell warns against — a function too thin to be worth the
  indirection. I extracted it anyway because it is read from two places that both need to
  agree, and named "what is true" beats named "what is read," but a reviewer who thinks
  `deliveries.filter((d) => d.qualityPassed)` twice is more honest than a predicate that
  might imply more nuance than a boolean field actually has would not be wrong.
- **Five short pipeline expressions replaced five loops that were, if anything, easier to
  step through in a debugger** — a breakpoint on `accepted.push(delivery)` tells you exactly
  which iteration you are on; a breakpoint inside a `.filter()` callback tells you the same
  thing with an extra stack frame. For a file this size the readability win at the call
  site is worth that, but it would not obviously be worth it in a hot loop processing
  hundreds of thousands of deliveries a night — a case this exercise does not have to make,
  and a reviewer should ask whether yours does.

## If you took a different route

Defensible alternatives:

- **Extracting `isRejected` instead of negating `isAccepted`.** Discussed above under step
  3 — I think it is the weaker choice, not an unreasonable one.
- **Combining `acceptedDeliveries` and `rejectedDeliveries` into one function that returns
  both lists from a single pass**, the mirror image of what `Split Loop` (the previous
  drill in this module) argues *against* combining. It would save one pass over a short
  array and cost a two-field return type every caller has to destructure. For four
  deliveries a night, not worth it; say so if you disagree and the numbers in your version
  of this exercise are different.
- **Converting `findCapacityBreach` anyway, with a comment explaining the extra flag.**
  Some reviewers will prefer a codebase where *every* collection walk is a pipeline, on the
  theory that consistency has its own value. I think that trades a real cost (an early exit
  that only works by accident of `reduce` never actually terminating early) for a
  stylistic one, and picked consistency's opposite. This is the one place in the exercise
  where I would not call the other answer wrong — only more expensive than it looks.

What is *not* a matter of taste: leaving any of the five accumulate-loops un-converted
while claiming the smell is fixed, or converting `findCapacityBreach` in a way that scans
past the first breach to find it (the test `names the first delivery that pushes the
running weight over capacity, not the heaviest one` exists specifically to catch that).
