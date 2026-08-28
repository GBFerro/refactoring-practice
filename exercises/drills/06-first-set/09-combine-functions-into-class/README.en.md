[🌐 English](./README.en.md)

# Combine Functions into Class

`Chapter 6` · `Combine Functions into Class` · `●●○` · ~30 min

## Context

Silverbrook Athletics Club hands every runner a training plan: a named block of weeks
building toward a race, each week scaled off that runner's own easy weekly mileage and
threshold pace rather than written as absolute numbers, so the same plan works for a
runner doing 30 km a week and one doing 90. Printing a runner's sheet for the week means
asking the same two records - the runner, and the plan - the same handful of questions
over and over: what should this week's distance be, what pace, is it a recovery week.

## The smell

**Data Clumps**. `runnerName`, `raceName`, `totalWeeks`, `totalDistanceKm`, `weekLabel`,
`targetDistanceKm`, `targetPaceSecondsPerKm`, and `isRecoveryWeek` all live in
`training-block.ts`, and every one of them takes the same `(runner, plan)` pair - even the
ones that only ever read one half of it. That last part is the tell: `raceName` never
looks at `runner`, `runnerName` never looks at `plan`, and both still carry the parameter,
because that is simply what a function in this file looks like. A group of data that
travels everywhere together, whether or not each traveller needs the whole group, is
exactly what chapter 3 calls a data clump - and the fix it points to is to give the group
a name and a home of its own.

## The target

**Combine Functions into Class**: one `TrainingBlock`, constructed once from a `runner`
and a `plan`, whose methods ask for nothing because the clump is already sitting in its
fields. Every value these free functions used to compute becomes a method or a getter, and
every derived value stays computed on demand from the two records the block holds, so it
cannot drift out of date while a caller is still holding it.

## Done when

- `training-block.ts` exports one class, `TrainingBlock`, and no free function still takes
  a `(runner, plan)` pair.
- Every derived value moved onto the class - not only the ones that were easy to move.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters -
  `npm run lint:strict -- exercises/drills/06-first-set/09-combine-functions-into-class/src`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not with the class. First look for the one piece of logic every per-week function calls -
finding the week itself, and checking it is in range - and give that its own function.
Once that exists, the class you build next is mostly a shell around functions that already
work; you are just changing where they live.
</details>

<details>
<summary>Which functions go first?</summary>

Move the ones that only need one half of the pair before the ones that need both.
`runnerName` and `raceName` are single-field lookups wearing a two-parameter signature for
no reason - moving them costs nothing and proves the shape of every move that follows.
Save `totalDistanceKm` for last: it is the only one that calls another derived value
rather than reading a field, so it can only become a one-liner once that other value
already lives on the class.
</details>

<details>
<summary>Should the class store the derived values, or compute them each time?</summary>

Compute them. Storing `totalDistanceKm` as a field means deciding when to recompute it if
the runner's mileage or the plan's weeks ever change after the block is built - and this
codebase gives you no reason to think they don't. A getter that reads `this.runner` and
`this.plan` fresh on every call has no staleness question to answer, at the cost of
redoing the arithmetic each time someone asks. For eight fields on a training plan, that
cost is not worth avoiding.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Combine Functions into Class*; chapter 3,
*Data Clumps*.
