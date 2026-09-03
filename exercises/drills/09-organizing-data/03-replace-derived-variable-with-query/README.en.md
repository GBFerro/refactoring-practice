[🌐 English](./README.en.md)

# Replace Derived Variable with Query

`Chapter 9` · `Replace Derived Variable with Query` · `●●○` · ~20 min

## Context

Riverline Bike Share issues every rider an account: their name, and every trip they have
taken since they signed up. Trips are docked and undocked at stations across town, each one
carrying a fare. A bike returned after its free period gets a late-return fee added to that
trip's fare hours later, once the dock reports how late it came back - well after the ride
itself was recorded. The account keeps a running total of what the rider has been charged,
shown on their statement and checked against the monthly spending cap.

## The smell

**Mutable Data.** `RiderAccount` stores `totalFareCentsCache` alongside its trips - a
number that is entirely computable from those trips, kept correct by hand at every place
that changes a fare. `recordTrip` remembers to update it. `applyLateReturnFee`, which
changes an existing trip's fare well after the fact, does not. Nothing in the type system
says the two are supposed to move together, so nothing stops them from drifting apart.

## The target

**Replace Derived Variable with Query**: delete `totalFareCentsCache` entirely, and have
`totalFareCents` compute its answer from `account.trips` on every call. This is not just a
readability improvement - it removes the entire category of bug a manually-synced cache
invites, rather than patching the one call site that forgot. `WALKTHROUGH.md` is explicit
about that distinction, and about when recomputing on every call stops being free.

## Done when

- `RiderAccount` no longer declares `totalFareCentsCache`, or any field like it.
- `totalFareCents` computes its result from `account.trips` every time it is called - there
  is no stored number for a future mutation to forget to update.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters -
  `npm run lint:strict -- exercises/drills/09-organizing-data/03-replace-derived-variable-with-query/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Change what `totalFareCents` reads before you touch anything else. Swap its body from
reading the cached field to summing `account.trips` directly, and leave the cache field and
its maintenance in `recordTrip` sitting there, unused, for now. The suite stays green, and
this is the one commit where behaviour can actually change for a caller - isolating it means
every later step is a pure deletion of code nothing reads any more.
</details>

<details>
<summary>I don't see any test that fails on the buggy version. Is the bug real?</summary>

It's real - try it yourself: record a trip, apply a late-return fee to it, then compare
`totalFareCents(account)` against `account.trips.reduce((s, t) => s + t.fareCents, 0)`.
They disagree. The shipped tests can't assert on that disagreement, because the same spec
file has to pass against both the buggy version and your fixed one, and no single expected
number does both. `WALKTHROUGH.md` explains why that absence is the point, not a gap.
</details>

<details>
<summary>Isn't recomputing the sum on every call wasteful?</summary>

For one rider's trip list, checked occasionally, no - and `drill-07-04` makes the identical
argument for a different kind of derived data. What's different here is the failure mode a
cache invites: a temp inside one function call can never disagree with its source, but a
field on a long-lived object can, at every future mutation site someone adds. `WALKTHROUGH.md`
lays out what you'd need to observe before caching this, and what shape a cache would have
to take to not reintroduce the exact bug you just removed.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 9, *Replace Derived Variable with Query*; chapter 3,
*Mutable Data*.
