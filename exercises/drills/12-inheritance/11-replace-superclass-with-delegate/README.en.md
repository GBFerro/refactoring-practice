[🌐 English](./README.en.md)

# Replace Superclass with Delegate

`Chapter 12` · `Replace Superclass with Delegate` · `●●●` · ~35 min

## Context

Beckworth Music School keeps a live `LessonRoster` for each term's schedule — lessons get
booked, rebooked, cancelled, and reslotted onto a different day right up until they happen.
Once a lesson is over, it moves into a `LessonArchive`: a permanent record of what actually
took place, in what order, for billing history and end-of-term reports.

## The smell

**Refused Bequest.** `LessonArchive extends LessonRoster`, inheriting six methods built for
a schedule that is still being edited. Two of them — `insertAt` and `removeAt` — get
overridden to throw, because an archive is append-only by design. A third,
`replaceAt`, was never overridden at all: it type-checks fine, inherited unchanged, and
silently accepts a call that swaps out an already-archived lesson. `LessonArchive` inherits
an interface it mostly does not want, and refusing it piecemeal means it only takes one
forgotten override for the refusal to have a hole in it.

## The target

**Replace Superclass with Delegate.** `LessonArchive` stops extending `LessonRoster` and
holds one privately instead, forwarding only the three operations an archive actually
performs — adding an entry, reading them back, counting them. The two throwing overrides
disappear along with the inheritance relationship, and so does the one nobody got around
to writing: there is nothing left to forget, because there is nothing left to inherit.

## Done when

- `LessonArchive` no longer `extends LessonRoster`, anywhere in the solution.
- `LessonArchive` declares no method that only exists to throw — `insertAt`, `removeAt`,
  and `replaceAt` are all simply absent from its public surface, not present-and-refused.
- `add`, `entries`, and `count` behave exactly as before, for every caller outside the
  class.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/11-replace-superclass-with-delegate/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Count first, the way the neighbouring encapsulation drills do before touching anything.
List every method `LessonRoster` declares, and mark each one "wanted as-is," "refused," or
"neither refused nor wanted, just never addressed." That third category is the one worth
finding before you start moving code — it's easy to miss precisely because nothing about
it currently looks broken.
</details>

<details>
<summary>Do I remove `extends LessonRoster` first, or last?</summary>

Last. Give `LessonArchive` its own private `LessonRoster` field and three forwarding
methods first, while it still extends `LessonRoster` — that step changes nothing
observable, because every existing caller still goes through the inherited path. Only once
you've confirmed nothing reaches past those three methods does dropping the `extends`
become a step that removes dead code instead of a step that might break a caller you
missed.
</details>

<details>
<summary>How do I prove the forgotten method is actually gone, not just harder to reach?</summary>

Try to call it and see what TypeScript says. Once `LessonArchive` no longer extends
`LessonRoster`, a call to a method it never forwards is a compile error, not a method that
exists and happens not to be used. `tests-fixed/` in this exercise checks exactly that,
against the solution only — read it once you've finished, not before.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Replace Superclass with Delegate*; chapter 3,
*Refused Bequest*.
