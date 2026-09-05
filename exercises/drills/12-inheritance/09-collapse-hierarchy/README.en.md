[🌐 English](./README.en.md)

# Collapse Hierarchy

`Chapter 12` · `Collapse Hierarchy` · `●○○` · ~15 min

## Context

Beckworth Music School books practice rooms for individual and small-group practice.
`Room` used to sit above two kinds of bookable space — practice rooms, and for a while the
shared rehearsal hall, which billed by a different rule. The hall was retired years ago.
Nothing since has needed a second kind of room.

## The smell

**Lazy Element.** `PracticeRoom` is a subclass of `Room` that overrides nothing, adds no
field, and declares no method of its own — `export class PracticeRoom extends Room {}` is
the entire class body. The hierarchy is not doing any work; it is a name difference wearing
the shape of a type difference.

## The target

**Collapse Hierarchy**: fold `Room`'s members into `PracticeRoom` and delete `Room`, ending
with one class. Which class's *name* survives the merge is not automatic here — see the
walkthrough for why the usual "keep the superclass's name" default does not apply.

## Done when

- `Room` no longer exists anywhere in the solution.
- `PracticeRoom` declares every member `Room` used to, with no `extends` clause.
- `renderPracticeSchedule`'s output — every line, the total, the empty-schedule message —
  is unchanged, byte for byte, from before the collapse.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/09-collapse-hierarchy/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Grep the exercise for every place `Room` and `PracticeRoom` are each used. If nothing ever
constructs a `Room` directly, and nothing distinguishes the two beyond which one appears in
a type annotation, there is no real hierarchy left to preserve — only a copy step and a
deletion.
</details>

<details>
<summary>Which name should the merged class keep?</summary>

Check which name is actually exported and imported elsewhere in the module - not which
class currently sits higher in the `extends` chain. A collapse that renames the class every
caller already uses, just to honour "the superclass's name wins," trades zero benefit for
real churn.
</details>

<details>
<summary>`protected` fields — do they need to change too?</summary>

`protected` grants subclass access that a private field would deny. Once the merge removes
the only subclass or the only superclass, whichever side had `protected` for the other's
benefit no longer needs it.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Collapse Hierarchy*; chapter 3, *Lazy Element*.
