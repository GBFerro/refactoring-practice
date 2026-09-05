# Walkthrough — one class, kept under the name callers already use

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, which name survives and why, and where I am
still not certain. Read it after you have your own version, not before.

---

## Before anything: read what `PracticeRoom` actually adds

```ts
export class PracticeRoom extends Room {}
```

Nothing. No field, no overridden method, no new method. `Room`'s doc comment explains why:
it used to sit above two kinds of room — practice rooms and, for a while, the shared
rehearsal hall, which billed differently. The hall was retired years ago. Since then, every
method any caller has ever needed lives on `Room`, and `PracticeRoom` is an empty
declaration whose only job is to have a different name than its superclass.

That is **Lazy Element** at the level of an entire hierarchy rung, not just one method. The
check is almost mechanical: an empty subclass body is either genuinely temporary — a
placeholder for behaviour that is about to be added — or it is load-bearing air. Grep the
exercise for anywhere `Room` and `PracticeRoom` are used differently (a type check, a
different set of imports, anything at all), and if you find nothing, the second case holds.

## Why this order: merge, then delete, then rewire

The tempting shortcut is to delete `room.ts` and `extends Room` in one step and let the
compiler show you what needs `Room`'s members. That collapses two questions into one diff
again, the same trap as the previous drill: *did I copy every member correctly*, and *is
anything still reaching for `Room` directly*. Copying first, with both classes still
present and `PracticeRoom` still empty on top of a full `Room`, means step 1 cannot change
behaviour — `PracticeRoom` inherits the copy either way — so the suite passing after step 1
tells you the copy was faithful, before you remove anything a mistake could hide behind.

## Step 1 — the copy, and the one real decision inside it

```ts
// Room, before
export class Room {
  protected readonly props: RoomProps;
  constructor(props: RoomProps) { this.props = props; }
  // ...
}

// PracticeRoom, after step 1
export class PracticeRoom extends Room {
  readonly #props: RoomProps;
  constructor(props: RoomProps) {
    super(props);
    this.#props = props;
  }
  name(): string { return this.#props.name; }
  // ...
}
```

I did not just paste `Room`'s body in verbatim — I changed `protected props` to a private
`#props` on the way past, since step 3 is about to delete the only thing `protected` was
ever for. That means step 1 briefly has the field stored twice (once on `Room`, once on
`PracticeRoom`), which is wasteful but not wrong: nothing reads `Room`'s copy once
`PracticeRoom` overrides every method, and the duplication is gone two steps later. I
considered keeping `protected props` through this step and tightening it separately, the
way `drill-12-07` splits its equivalent visibility change into its own commit — I chose to
fold it in here instead, because unlike that drill's step 5, there is no separate
"structure" change to keep clean of it: steps 1 and "tighten visibility" are the same file,
the same members, at the same time, and splitting them would have meant writing `#props`
and then immediately deleting the line that made it necessary to write `props` in the first
place.

**On the name.** `#props`, not `#roomProps`. Question 2 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — could this be the name of something else
in this file — is trivially "no": `PracticeRoom` has exactly one thing worth calling its
props, so the shorter name loses nothing a reader needs, the same reasoning
`06-inline-class`'s `#key` used for the same kind of single-purpose private field.

## Step 2 — the import that has to move first

```ts
// schedule.ts, before
import type { PracticeRoom } from "./practice-room";
// RoomProps is never imported here directly — it only appears via PracticeRoom's methods

// booking.ts callers of RoomProps directly (if any) — before
import type { RoomProps } from "./room";
// after
import type { RoomProps } from "./practice-room";
```

In this exercise, only `index.ts` imports `RoomProps` by name (`schedule.ts` only ever
touches it through `PracticeRoom`'s methods), so this step is small — one import path
changed in one file. I still call it out as its own step rather than folding it into step
4's deletion, because it is the one place outside `room.ts` and `practice-room.ts` that has
to know the type moved, and a reader diffing "delete `room.ts`" alone should not also have
to notice an unrelated file's import silently started resolving somewhere else.

## Step 3 — dropping `extends Room`

```ts
// before
export class PracticeRoom extends Room {
  readonly #props: RoomProps;
  // ...
}
// after
export class PracticeRoom {
  readonly #props: RoomProps;
  // ...
}
```

One keyword removed. This is the step that turns "duplicated but inert" into "the only
copy" — `Room`'s version of every method becomes unreachable the moment `PracticeRoom` no
longer inherits from it, which is exactly what makes step 4 safe.

## Step 4 — deleting `room.ts`

Nothing imports `Room` any more. Delete the file. Same shape as `drill-12-07`'s step 4:
preparation work makes this the one line of the diff that actually removes something.

## Which name survives, and why that is not just convention

**On the name — the one this whole drill turns on.** The instinct is that the superclass's name survives a collapse — `Room` sounds like the
more general, more permanent name, and `PracticeRoom` sounds like the specific case. I did
not do that here, and I want to be precise about why, because "keep the parent's name" is a
default, not a rule.

`Room` was never exported from this module. Look at `src/index.ts`: it exports
`PracticeRoom`, `RoomProps`, and the schedule functions — never `Room`. Every test in
`tests/`, every function in `schedule.ts`, and (by construction, since this drill is
`apiFrozen`) every caller anywhere else, already writes `PracticeRoom`. Renaming the merged
class to `Room` would not just be a style choice against convention — it would break the
frozen public surface this exercise has to preserve, for a class that has exactly one
caller-visible name today and always has. Keeping `PracticeRoom` costs nothing. Keeping
`Room` would cost a rename across every file that touches this module, in exchange for a
name nothing outside `room.ts` itself has ever used.

The general version of the rule, then, is not "the superclass name wins." It is: **keep the
name more code already depends on**, and check that by grepping, not by which class
happens to sit higher in the `extends` chain. Most of the time those coincide, because
superclasses accumulate more callers precisely by being more general — polymorphic code
tends to hold a reference typed as the supertype. This is the case where they came apart:
`Room` was general in intent but had zero callers of its own, because the only thing ever
constructed was the leaf.

**On the name, again.** `RoomProps` kept its name too, even though "Room" is no longer a
class in this file. I considered `PracticeRoomProps` for symmetry and rejected it — question
4, is it true: `RoomProps` describes what the object *is* (the props for a bookable room),
not which class currently consumes it, and that stays true regardless of whether `Room` the
class exists. If Beckworth ever adds a second bookable space with different props, deciding
whether it also uses `RoomProps` is a question for that day, not a reason to rename the type
now for a hypothetical it may never need.

## What it cost

The genuine loss is optionality, not correctness: with `Room` gone, the next kind of
bookable space Beckworth adds — a rehearsal hall again, an ensemble room with a different
pricing shape — starts from a single concrete class with no extension point, rather than
from a superclass already carrying the shared 80%. That is a real cost, and I do not think
it is a large one: extracting a superclass back out, when a second subclass actually shows
up with actually-different behaviour, is a small and well-understood move (`Extract
Superclass`, `drill-12-08` in this same module) done once, with a real second case in hand
to design against. Rebuilding a superclass on demand, from two concrete classes that have
each earned their differences honestly, tends to produce a better cut than the one drawn in
advance and never revisited. I am fairly confident about this trade for a two-year-old
codebase with one room kind; I would be less confident making it for a hierarchy less than
a month old, where "we might need a second kind soon" is a plan, not a guess.

## If you took a different route

- **Keeping the `Room` name and renaming every caller to match.** Not wrong, exactly, but
  it pays a real cost (every file in this module, plus this drill's own tests, would need
  the rename) for no benefit this codebase can name today. If Beckworth's domain vocabulary
  genuinely preferred "Room" as the word front-desk staff use, that preference would be a
  real argument on the other side — it is not one this exercise's `RoomProps` doc comment or
  its schedule output gives any evidence for, so I did not manufacture one.
- **Leaving `PracticeRoom` as a re-exported alias of `Room`** (`export { Room as
  PracticeRoom }`) instead of merging the classes. Avoids touching `Room`'s internals at
  all, but it does not remove the Lazy Element — it hides it behind an alias, and the next
  reader who opens `room.ts` still finds an empty hierarchy waiting to be collapsed. Worse
  than doing nothing, arguably, since it looks finished.

What is *not* a matter of taste: `bookingCostCents`'s rounding and `renderPracticeSchedule`'s
exact output — the dash-separated line format, the empty-schedule message, the total's
formatting — all pinned by the shared suite. Collapsing two classes into one must not change
any of it, and if a "cleaner" merged class produces a different string anywhere, the
cleanup went too far.

## Where TypeScript changes this from the book

Fowler's Collapse Hierarchy mechanics are agnostic to which language you're in, but
TypeScript's `protected` versus private-field (`#`) distinction gives this specific exercise
a check the book's JavaScript cannot: once step 3 removes `extends Room`, a `protected`
member left behind would still compile, silently promising subclass access to a hierarchy
that no longer exists. Choosing the private `#props` field in step 1, rather than leaving
`protected` in place until "later," means the compiler has already committed to "no
subclass is coming" before step 4 even runs — the field's own declaration says so, not just
the fact that `room.ts` happens to be deleted.

## The question this drill and its inverse both have to answer

This module also has [`drill-12-07`](../../../07-remove-subclass/README.en.md), Remove
Subclass, and it is worth being exact about what separates them, because both fix a Lazy
Element and both make a hierarchy shorter.

**Remove Subclass turns a subclass back into a field on its parent**, because the thing
distinguishing the subclass was never really a different *kind* of object — it was one
value (there, a boolean: is this enrolment a trial) that had been given a whole class to
live in. Collapsing it removes a type that should not have been a type: `TrialStudent`
disappears, `Student` gains a branch, and the parent survives essentially unchanged in
shape, just slightly fuller.

**Collapse Hierarchy merges two classes that have become the same class**, in either
direction — here, the child absorbs the parent, because nothing distinguished them left at
all, not even a value. There is no leftover field to check, because there is no leftover
*difference*; `PracticeRoom` and `Room` were not two kinds of thing with one axis of
variation between them, they were one kind of thing wearing two names, one of them (the
superclass) doing no work. The question Remove Subclass asks is "does this type deserve to
exist, given what actually varies?" The question Collapse Hierarchy asks is "do these two
types deserve to be two, given that nothing separates them any more?" A field surviving the
merge is the signature of the first; no field surviving because there was nothing left to
carry is the signature of the second.
