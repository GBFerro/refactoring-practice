[🌐 English](./README.en.md)

# Preserve Whole Object

`Chapter 11` · `Preserve Whole Object` · `●●○` · ~30 min

## Context

The Halliday Box Office periodically scans what's left to offer as a surprise upgrade -
seats closer to the stage and more centered score higher, and a restricted view halves the
score. The same closeness-and-centering math also ranks standing-room spots for a
general-admission show, which aren't seats at all.

## The smell

**Data Clumps.** `seatScore` takes `distanceFromStageMeters`, `offsetFromCenterMeters`, and
`hasRestrictedView` as three separate parameters, but its only caller,
`bestUpgradeCandidate`, never has these values apart from each other - they arrive
attached to the same `Seat`, every time. Worse, that caller has to pull all three out
*twice* per comparison, once for the seat it's looking at and once for the best one seen
so far, because `seatScore` never had a whole `Seat` in its hands to read them from
directly.

## The target

**Preserve Whole Object**: give `seatScore` the `Seat` it's always scoring and let it read
what it needs. Mechanically that's most of the exercise - but not all of it. The lower-level
`positionScore` underneath does the same closeness-and-centering arithmetic on two plain
numbers, and it is called from two different places for two different kinds of record.
Deciding whether it deserves the same treatment `seatScore` gets is the second half of the
drill, and the honest answer for at least one function here is no.

## Done when

- `seatScore` takes one `Seat`, not three loose values.
- `bestUpgradeCandidate` no longer pulls the same seat's fields apart twice to compare two
  seats.
- `positionScore` still takes two plain numbers, not a `Seat` or a `StandingSpot` - see
  `WALKTHROUGH.md` for why folding it in would be the wrong move, not merely an unfinished
  one.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters -
  `npm run lint:strict -- exercises/drills/11-apis/04-preserve-whole-object/src`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. The two functions the box office actually calls -
`bestUpgradeCandidate` and `bestStandingSpot` - keep their signatures; the suite in
`tests/callers.spec.ts` only pins those two. Everything below that boundary, including
`seatScore`'s own parameter list, is yours to redesign.

## Hints

<details>
<summary>Where do I start?</summary>

`seatScore` has exactly one caller, unlike drill-11-01's three - so there's no safe way to
add the new shape without also touching that caller in the same step; a half-migrated
state wouldn't compile. Add a temporary second name next to `seatScore` that takes a `Seat`
and delegates to the old one, move the caller onto it, then delete the old function and
rename. Slower than doing it in one commit, but each step still answers exactly one
question.
</details>

<details>
<summary>Should `positionScore` take a `Seat` too, now that `seatScore` does?</summary>

Check who else calls it. `bestStandingSpot` calls `positionScore` directly, with a
`StandingSpot`'s fields - and a `StandingSpot` has no `hasRestrictedView`, so it isn't a
`Seat` and can't stand in for one. If `positionScore` took a `Seat`, `bestStandingSpot`
would have nothing valid to pass it. This is the book's own counter-argument to Preserve
Whole Object: sometimes the callee genuinely should not know about the caller's type, and
that's a reason to keep the parameters apart, not a sign the refactoring is unfinished.
</details>

<details>
<summary>Isn't this the same move as drill-06-08?</summary>

Both replace loose parameters with one object. The difference is where the object comes
from. Drill-06-08's `DateRange` didn't exist before that drill - two strings that always
traveled together earned a new type, which is Introduce Parameter Object's job. Here,
`Seat` already existed, already had these three fields, and already was what every caller
had in hand. Nothing is being invented; something that already existed is being stopped
from being taken apart.
</details>

## Reading

*Refactoring*, 2nd edition - chapter 11, *Preserve Whole Object*; chapter 3, *Data Clumps*.
