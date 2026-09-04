# Walkthrough — score the seat, not its fields

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost,
and why one function in this file is not on the route at all.

---

## What `bestUpgradeCandidate` is actually paying for

```ts
export function bestUpgradeCandidate(seats: readonly Seat[]): Seat | null {
  return seats.reduce<Seat | null>((best, seat) => {
    const score = seatScore(
      seat.distanceFromStageMeters,
      seat.offsetFromCenterMeters,
      seat.hasRestrictedView,
    );
    if (best === null) {
      return seat;
    }
    const bestScore = seatScore(
      best.distanceFromStageMeters,
      best.offsetFromCenterMeters,
      best.hasRestrictedView,
    );
    return score > bestScore ? seat : best;
  }, null);
}
```

Read this and count how many times the same three fields get named: six, across two
identical three-argument calls. Not because the caller has two different kinds of thing to
score - `seat` and `best` are both `Seat`s, always - but because `seatScore` never had a
whole `Seat` to read from, so every caller has to hand it the pieces, every time, for every
`Seat` it wants scored. That is the data clump: `distanceFromStageMeters`,
`offsetFromCenterMeters`, and `hasRestrictedView` travel together at both call sites and
nowhere is that fact written down.

## Why this order, given there's only one caller

Drill-11-01's version of this mechanic - add the new shape next to the old one, migrate
callers one at a time, delete the old shape - earns its keep there because three separate
callers each get their own commit and their own chance to go wrong independently. Here
there is exactly one caller. Splitting "add `seatScoreOf`" from "move
`bestUpgradeCandidate` onto it" doesn't insulate one caller's mistake from another's,
because there's only one caller to make a mistake in.

I kept the two steps separate anyway, and it's worth saying why rather than pretending it's
obviously right. Step 1, adding `seatScoreOf(seat)` as a thin delegate to the untouched
`seatScore`, is a change I can verify compiles and runs without also verifying I updated
`bestUpgradeCandidate` correctly - it's additive, nothing new is exercised, the suite stays
green because nothing observable has moved. Step 2 is then only about the call site: did I
pass the right thing to the right function, twice. Merging them would still be one commit
that's easy to get right in one pass for a caller this small - I'm including the split for
consistency with the rest of this module's mechanic and because it's cheap, not because I
believe it caught anything a single combined commit would have missed here. That is a
weaker justification than drill-11-01's, and I'd rather say so than imply otherwise.

## Steps 1–2 — a whole-object seatScore, called through a temporary name

```ts
// step 1 - purely additive
function seatScoreOf(seat: Seat): number {
  return seatScore(
    seat.distanceFromStageMeters,
    seat.offsetFromCenterMeters,
    seat.hasRestrictedView,
  );
}
```

**On the name.** `seatScoreOf`, not `seatScore2` or `newSeatScore`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md) - what, not how - rules out `seatScore2`:
it describes the function's place in an edit history, which is true for exactly as long as
the history is being made and false the moment step 3 deletes the original. `newSeatScore`
fails the same way one commit sooner. `seatScoreOf(seat)` reads correctly at both its call
site and its eventual one - it survives the rename in step 3 with no change in meaning,
which is the actual test: a transitional name should still make sense after the transition,
not just during it.

Step 2 moves both of `bestUpgradeCandidate`'s calls onto `seatScoreOf`. Nothing about the
comparison logic changes yet - the reduce still computes `score` and `bestScore`
separately, it just gets each one from a one-argument call instead of a three-argument one.

## Step 3 — inlining and reclaiming the name

```ts
// after step 3
export function seatScore(seat: Seat): number {
  const base = positionScore(seat.distanceFromStageMeters, seat.offsetFromCenterMeters);
  return seat.hasRestrictedView ? Math.round(base / 2) : base;
}
```

Once `bestUpgradeCandidate` calls only `seatScoreOf`, the original three-parameter
`seatScore` has exactly one caller: `seatScoreOf` itself. Inline it - a small Inline
Function in the middle of a larger refactoring, the same way drill-06-01's walkthrough
notes that Replace Temp with Query showed up uninvited inside an Extract Function drill.
Refactorings arrive in flocks; the catalog is organized for reading, not for the order they
actually happen in. Delete the now-empty three-parameter version, rename `seatScoreOf` back
to `seatScore`. The public name lands exactly where it started, now attached to a
different, better signature.

**On the name.** `seat`, not `s` or `candidate`, as the parameter. Question 3 - does it
read at the call site? `seatScore(seat)` says what's being scored twice in five characters;
`seatScore(s)` reads fine here but fails the moment this function is read next to
`positionScore(distanceFromStageMeters, offsetFromCenterMeters)`, whose parameters spell
out exactly what they are. A single-letter parameter would be the odd one out in this file,
not a shorthand everyone already expects the way `pad2`'s brevity was in drill-06-01 -
that one earned its short name from four call sites in one screen; this one has a type
worth naming plainly instead.

## Step 4 — the comparison gets to read as one line

```ts
export function bestUpgradeCandidate(seats: readonly Seat[]): Seat | null {
  return seats.reduce<Seat | null>(
    (best, seat) => (best === null || seatScore(seat) > seatScore(best) ? seat : best),
    null,
  );
}
```

This step is not required by Preserve Whole Object - you could stop at step 3 and leave the
explicit `if (best === null)` branch and the two named temporaries. I collapsed it because
once `seatScore` takes one argument, the two calls read as a direct comparison
(`seatScore(seat) > seatScore(best)`) instead of two setup lines before a comparison three
lines later, and the shape now matches `bestStandingSpot`'s reduce below it, which was
already written this way because it never had the data clump to begin with. Consistency
between the two ranking functions in this file is a real reason to do this, not a required
one - if you kept the longer form, nothing here would count it wrong.

## `positionScore`: the function this drill does not touch

`positionScore` takes two plain numbers, is called from `seatScore` with a `Seat`'s fields
and from `bestStandingSpot`'s private `scoreOf` with a `StandingSpot`'s fields, and stays
exactly as it is for the whole of this drill. That's deliberate, and it's the second half
of the exercise: Preserve Whole Object's own chapter names the case where the move should
be refused, and this is it.

The reasoning isn't "the parameter list is only two, so it's fine" - two is exactly the
size Preserve Whole Object usually targets. It's dependency direction. `Seat` has a
`hasRestrictedView` field that a `StandingSpot` does not and should not have - a standing
spot has no seat to have a restricted view of. If `positionScore` took a `Seat`, it would
either need `bestStandingSpot` to fabricate a fake `Seat` around a `StandingSpot`'s two
numbers just to call it, or it would need a second overload that defeats the entire point
of unifying the parameter list. Both are worse than the two numbers this function already
takes. The book's own framing is the right one here: a function two levels of abstraction
lower than either of its callers' record types should not import either of those types,
because doing so makes the *lower*-level function depend on a *higher*-level shape - the
dependency runs the wrong way. `positionScore` is infrastructure shared by two unrelated
features; `seatScore` is a seat-scoring function used by exactly one seat-scoring feature.
Only one of those descriptions is a reason to accept a wider type.

**How you can tell, in general:** ask who else calls the function today, or would need to
tomorrow, if it existed for a slightly different purpose. `seatScore` had one caller, and
that caller only ever had a `Seat`. `positionScore` had two callers with two different
record types that share no supertype - taking either type would strand the other. Preserve
Whole Object earns its keep when the object is not just present at the call site but is
the *only* kind of object that will ever be present. Where that's not true, the flag isn't
"was this refactoring done correctly," it's "was this the right function to apply it to."

## Not to be confused with Introduce Parameter Object (drill-06-08)

Both refactorings replace loose parameters with one object, and it's easy to see this
drill's `seatScore(seat)` and think it's the same move as drill-06-08's `DateRange`. The
book keeps them separate for a reason that isn't about mechanics, and drill-06-08's
`DateRange` and this drill's `Seat` sit on opposite sides of it.

`DateRange` did not exist before drill-06-08 touched the season report. `from` and `to`
were two strings that happened to always travel together, and the refactoring's job was to
notice that and give the pairing a name and a home it didn't have - a type invented for the
occasion, which then earned its own behavior (`includes`, `days`, `weeks`) once it existed.
That's Introduce Parameter Object: the values came first, the type came second, created
specifically to hold them.

`Seat` already existed here, complete with `distanceFromStageMeters`,
`offsetFromCenterMeters`, and `hasRestrictedView`, before `seatScore` was written. Nothing
about this drill invents a type - the type was already the natural home of these three
values, and `seatScore` simply never received it, taking the fields apart at the door
instead. Preserve Whole Object's job is narrower than Introduce Parameter Object's: stop
disassembling something that was already assembled, rather than assemble something that
never was. If I'd found no `Seat` type at all - just three loose values passed around
several functions with no record in sight - inventing one to hold them would have been
drill-06-08's refactoring wearing this drill's domain, not this one.

## What it cost

`seatScore` now imports `Seat` and reads three of its fields by name. That's a real cost:
this function can never again be handed a `StandingSpot`, a hypothetical future
`AccessibleSeat`, or a plain object shaped like `{ distanceFromStageMeters, ... }` that
isn't actually a `Seat`. Before this refactoring it could score anything with the right
three primitives, whatever record they happened to live in. Testing it also changed shape -
it's a real cost that got no easier: you now construct a whole `Seat` to test the scoring
math, including a `section` field the math never touches, instead of calling three numbers
and a boolean directly. That's a small tax, paid once, in exchange for the caller-side
duplication going away.

I am not fully confident `hasRestrictedView`'s halving belongs inside `seatScore` rather
than as a separate, composable modifier applied after a plain `positionScore` call - a
design where `seatScore` didn't exist at all, and `bestUpgradeCandidate` called
`applyRestrictedViewPenalty(positionScore(seat.distanceFromStageMeters,
seat.offsetFromCenterMeters), seat.hasRestrictedView)` directly. That would keep the
"restricted view" business rule out of the same function as the "how do I read a `Seat`"
concern. I kept them together because there is, today, exactly one reason to compute a
seat's score, and splitting a rule from its only use in anticipation of a second one that
doesn't exist yet risks Speculative Generality more than it buys clarity - but a reviewer
who split them would have a real argument, not merely a different taste.

## If you took a different route

- **Skipping the temporary `seatScoreOf` name and changing `seatScore`'s signature and its
  one call site in a single commit.** Given there is exactly one caller, this is defensible
  - see "why this order" above for the case against it, which is honestly closer to a
  preference than a rule at this scale.
- **A TypeScript overload signature** - keeping the name `seatScore` throughout, with two
  call signatures during the transition, one of which delegates to the other - instead of a
  temporary second name. Workable, and it avoids inventing a name you'll delete. I found a
  distinct name during the transition easier to grep for when checking that every call site
  had actually moved; an overload's two signatures are harder to tell apart in a diff.
- **Extracting a `RankableByPosition` interface** - `{ distanceFromStageMeters: number;
  offsetFromCenterMeters: number }` - and having `positionScore` take that instead of two
  numbers, so `Seat` and `StandingSpot` could satisfy it structurally without either
  knowing about the other. TypeScript's structural typing makes this free - neither type
  would need to declare that it implements anything. I didn't take it because it names a
  type for a function with exactly two current callers; a third caller wanting the same
  shape is when I'd reach for this instead of a third hand-rolled two-number call site.

What is *not* a matter of taste: leaving `bestUpgradeCandidate` pulling the same seat's
three fields apart twice per comparison, or changing `positionScore` to take a `Seat` and
thereby stranding `bestStandingSpot`. The first is the duplication this drill exists to
remove; the second breaks a caller that has nothing to do with seats at all.

## Where TypeScript makes this different from the book

Fowler's own motivating example threads three numbers - a low, a high, and a plan's
withdrawal amount - through a function that could just as easily take the range object
that already held two of them; in JavaScript, nothing stops the caller from passing those
three numbers in the wrong order, and nothing would catch it. The same risk exists here
before this refactoring: `seatScore(distanceFromStageMeters, offsetFromCenterMeters,
hasRestrictedView)` and a hypothetical typo'd call
`seatScore(seat.offsetFromCenterMeters, seat.distanceFromStageMeters, seat.hasRestrictedView)`
both type-check, because the first two parameters are both `number` and TypeScript's
structural typing has nothing to say about which `number` means what. That's exactly the
gap Preserve Whole Object closes here that the type system alone does not: once the
signature is `seatScore(seat: Seat)`, there is only one argument to pass, and every field
read inside the function is reached by name (`seat.distanceFromStageMeters`), not by
position. The compiler was never going to catch the transposed pair; collapsing the
parameter list is what does.

The flip side showed up in the dependency-direction argument above, and it's worth making
explicit: if `positionScore` *had* been changed to take a `Seat`, TypeScript's structural
typing would have caught the mistake immediately at `bestStandingSpot`'s call site, because
`StandingSpot` is missing `hasRestrictedView` and does not structurally satisfy `Seat` - a
compile error, not a runtime surprise. In Fowler's JavaScript, the equivalent mistake would
only surface once something tried to read `.hasRestrictedView` off a plain object and got
`undefined`, quite possibly nowhere near the line that introduced the bug. Here, the wrong
move would have been caught before the tests even ran.
