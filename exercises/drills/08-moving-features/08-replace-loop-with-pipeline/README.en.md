[🌐 English](./README.en.md)

# Replace Loop with Pipeline

`Chapter 8` · `Replace Loop with Pipeline` · `●●○` · ~25 min

## Context

Ashgrove Bakery Co-op takes in a weekly truckload from its flour, dairy, and produce
suppliers. Every delivery is checked at the dock — weighed, and passed or failed on
quality — before the truck that dropped it off collects empties for the return run. The
office prints a report after each truck: what got accepted, what got rejected and why, and
whether the load ever came close to the truck's weight limit on the way in.

## The smell

**Loops.** `acceptedDeliveries` and `rejectedDeliveries` each build their result by hand:
declare an empty array, walk every delivery, push the ones that match, return the array.
`renderAcceptedSection` and `renderRejectedSection` do the same thing again to turn
deliveries into report lines, and `acceptedTotalCents` does it a third time to add up
costs. Five loops, each one a small manual reimplementation of `filter`, `map`, or
`reduce` — and each one makes the reader simulate the loop to find out what it computes,
instead of reading a name that already says so.

## The target

**Replace Loop with Pipeline**: turn each accumulate-and-filter loop into the collection
operation it was already imitating. Done looks like `report.ts` reading as a short chain
of named steps — `filter`, `map`, `reduce` — for every place a loop was standing in for
one of them.

Not every loop in this file qualifies, and the exercise is honest about that: one loop
stays exactly as it is. Deciding which is which is as much the point as the mechanics.

## Done when

- `acceptedDeliveries`, `rejectedDeliveries`, `renderAcceptedSection`,
  `renderRejectedSection`, and `acceptedTotalCents` are each a single pipeline expression —
  no local array declared and pushed into by hand.
- `findCapacityBreach` is unchanged, and still returns as soon as it finds the first
  breach.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than 3
  parameters —
  `npm run lint:strict -- exercises/drills/08-moving-features/08-replace-loop-with-pipeline/src`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

`acceptedDeliveries` and `rejectedDeliveries` both test the same field, one negated. Give
the test itself a name first — a small `isAccepted` predicate — before you touch either
loop. Both conversions get easier once there is a name to hand to `filter`.
</details>

<details>
<summary>Do I have to touch `findCapacityBreach` too?</summary>

Try it and see what happens to the early exit. A loop that returns from inside the loop
body the moment it knows the answer is doing something a `reduce()` callback cannot do
without help — `reduce` always runs to the end of the array. Read the comment already
sitting above that function once you've tried; it names the actual reason, not just "it's
different."
</details>

<details>
<summary>`rejectedDeliveries` — do I need a second predicate?</summary>

You could write an `isRejected` next to `isAccepted`, testing `!delivery.qualityPassed`.
Or you could write `rejectedDeliveries` as `deliveries.filter((d) => !isAccepted(d))` and
have exactly one place that defines what "accepted" means. Try both and decide which one
you would want to be the one maintaining six months from now.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Replace Loop with Pipeline*; chapter 3, *Loops*.
