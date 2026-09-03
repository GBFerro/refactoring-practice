[🌐 English](./README.en.md)

# Split Loop

`Chapter 8` · `Split Loop` · `●○○` · ~15 min

## Context

Every evening, Ashgrove Bakery Co-op closes out the day's customer orders. Two people care
about the totals for two different reasons: the volunteer treasurer reconciles the till
total against the cash box, and whoever preps dough at 5 a.m. tomorrow needs to know how
much flour the day's orders drew down, so the right amount gets milled overnight.

## The smell

**Loops.** `dayTotals` walks the day's orders once and accumulates two running totals in
the same pass — `revenueCents` for the till, `flourGramsUsed` for the mixer. Nothing about
computing one number depends on computing the other; they only share a loop because both
happen to be sums over the same array. That coupling is the problem: change how flour is
tallied and you're editing a function whose name and body are also about revenue.

## The target

**Split Loop**: turn the one loop that does two unrelated jobs into two loops, each doing
one. Done looks like `dayTotals` reading as a composition of two named, single-purpose
sums instead of one loop with two accumulators racing each other.

## Done when

- `dayTotals` no longer contains a loop with more than one accumulator.
- `revenueCents` and `flourGramsUsed` are each computed independently, and neither can
  affect the other's result.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than 3
  parameters —
  `npm run lint:strict -- exercises/drills/08-moving-features/07-split-loop/src`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Don't edit the loop in place. Copy it — the whole thing, accumulators and all — so there
are two identical loops doing the same redundant work. Only once both copies exist do you
start deleting lines from each. Editing in place feels faster and is the version most
likely to leave you debugging which of your two changes broke the suite.
</details>

<details>
<summary>I stripped both copies and the tests still fail.</summary>

Check which field each loop reads, not which loop it is. Both loops iterate
`for (const order of orders)`; the only difference between "the revenue loop" and "the
flour loop" is one field name, `totalCents` versus `flourGrams`. It is easy to strip the
wrong line out of the wrong copy and end up with two loops that both compute the same
total under two different names.
</details>

<details>
<summary>Isn't walking the array twice slower?</summary>

Yes, technically — and for a day's worth of orders it will never be a cost worth noticing
next to everything else the function already does. If you genuinely suspect it matters for
your real workload, measure it before you decide, rather than deciding first. The
walkthrough spells out what to do if the loop really were hot.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Split Loop*; chapter 3, *Loops*.
