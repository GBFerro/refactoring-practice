[🌐 English](./README.en.md)

# Replace Query with Parameter

`Chapter 11` · `Replace Query with Parameter` · `●●○` · ~30 min

## Context

The Halliday Box Office holds a handful of seats back from public sale in every
section — comps, staff, last-minute VIP requests. Whether a section "has availability"
depends on who's asking: the public booking page should stop offering a section once only
the held-back seats remain, but the internal box-office screen — where staff book those
seats directly — should still say yes. An admin dashboard needs both answers, for the same
section, at the same time.

## The smell

**Global Data.** `sectionHasAvailability` reads how many seats to hold back from a single
module-level variable, `reservedSeatCount`, and a matching `setReservedSeatCount` is the
only way to change it. Two of the three callers set the variable immediately before
reading it and trust that nothing else runs in between. The third, `sectionAvailabilitySummary`,
has to set it, read it, set it again, and read it again just to get two independent
answers — because the module's shared state is the only channel either answer travels
through, and it can only hold one value at a time.

## The target

**Replace Query with Parameter**: give `sectionHasAvailability` a `reservedSeatCount`
parameter instead of a variable to reach for, and delete the module-level state along with
the setter that mutated it. Every caller now states the reserve it wants directly, and
`sectionAvailabilitySummary` computes both halves of its answer as two ordinary calls, with
nothing shared between them.

## Done when

- `sectionHasAvailability` never reads a module-level variable — the reserve is a required
  parameter on every call.
- `setReservedSeatCount` is gone from `src/`, not merely unused.
- `sectionAvailabilitySummary` computes its two halves with no shared state and no
  dependency on the order the two calls happen in.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/11-apis/06-replace-query-with-parameter/src`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. `tests/callers.spec.ts` imports only the three
callers — `publicSectionHasAvailability`, `staffSectionHasAvailability`,
`sectionAvailabilitySummary` — and never the availability check by name, because
reshaping its signature is the entire point.

## Hints

<details>
<summary>Where do I start?</summary>

Give `sectionHasAvailability` a third parameter with a default that falls back to reading
the module variable, rather than requiring it right away. Every existing caller still
compiles unchanged at this step — you've only given callers a way to opt in, not forced
anyone to.
</details>

<details>
<summary>Which caller do I move first?</summary>

Any of the three — unlike some splits in this module, moving one caller onto the explicit
parameter can't change what any other caller sees. Move them one at a time anyway, one
commit each, so a failure points at exactly one diff. Save deleting the module variable and
its setter for last, once nothing calls them.
</details>

<details>
<summary>Isn't reaching into shared state sometimes fine?</summary>

Yes — this drill's `WALKTHROUGH.md` names a case where it is. The question worth asking
isn't "is this global," it's whether every caller that reads the value actually wants the
same answer. This module's two audiences don't; that's what makes the parameter the right
call here.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 11, *Replace Query with Parameter*; chapter 3,
*Global Data*.
