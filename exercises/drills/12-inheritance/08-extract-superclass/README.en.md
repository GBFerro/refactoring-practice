[🌐 English](./README.en.md)

# Extract Superclass

`Chapter 12` · `Extract Superclass` · `●●○` · ~30 min

## Context

Beckworth Music School lets out two kinds of thing besides lesson time: an `InstrumentRental`
— a violin or cello a student takes home for a few days — and a `RoomBooking` — a practice
room reserved by the hour. The two classes were written months apart by different people, and
neither one has ever heard of the other.

## The smell

**Duplicated Code**, spread across two classes with no common ancestor. Both charge a rate
for a period and round the result the same way; both build a one-line description for a
receipt. The fields doing the work are even named differently on each side —
`instrumentName`/`rentalDays`/`dailyRateCents` on one, `roomName`/`bookedHours`/
`hourlyRateCents` on the other — which is exactly the kind of duplication that survives a
"find duplicate code" tool, because nothing about it looks textually identical yet.

Before reaching for the fix, ask the question this drill is really about: is a rented
instrument and a booked room actually one *kind* of thing — an is-a — or do they merely each
*have* a billing rate they could delegate to instead? The README's target section, and the
walkthrough at length, say why the answer here is the first one.

## The target

**Extract Superclass**: a `Bookable` class holding what genuinely is identical — the shared
fields, the cost formula — with each subclass keeping the one method that only looks shared.
Pulling a single field or method up, once `Bookable` exists, is the same mechanical move as
[`drill-12-01`](../01-pull-up-method/README.en.md); this drill's job is deciding what belongs
up there at all, and — just as important — what does not.

## Done when

- `Bookable` exists, and both `InstrumentRental` and `RoomBooking` extend it.
- `Bookable` declares the identity fields and `costCents()` concretely, and
  `bookingDescription()` abstractly; neither subclass declares its own `costCents()`.
- `lateFeeCents` is still declared separately on each subclass, with its own formula.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/08-extract-superclass/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not by looking for identical text — there isn't any yet. List every field and method on both
classes side by side and ask, for each pair with a matching *job* (not matching spelling):
would a caller ever need to tell these two apart? If not, it is a Pull Up candidate once the
names agree. If a pair already has matching names and signatures, do not treat that as a
head start — check the bodies before you trust the resemblance.
</details>

<details>
<summary>The two fields aren't called the same thing. Do I rename first, or extract the superclass first?</summary>

Extract the empty superclass first — it changes nothing observable, so it can't hide a
mistake. Only after both classes extend `Bookable` do you have somewhere to put a shared
name, and only then does renaming become "move this field to the base," not "guess which
class's spelling should win."
</details>

<details>
<summary>Two methods match in name and signature. Isn't that the strongest case for pulling one up?</summary>

It's the strongest case for reading both bodies carefully before you decide. A matching
signature tells you two functions could be substituted for each other as far as the type
checker is concerned — it says nothing about whether they were written to answer the same
question. One of the two matching methods in this exercise answers a different question on
each class, wearing the same name by coincidence.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Extract Superclass* and *Pull Up Method*; chapter
7, *Extract Class*; chapter 3, *Duplicated Code*.
