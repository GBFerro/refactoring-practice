[🌐 English](./README.en.md)

# Pull Up Method

`Chapter 12` · `Pull Up Method` · `●●○` · ~30 min

## Context

Beckworth Music School bills for two kinds of booked lesson: a `PrivateLesson`, one tutor
with one student, and a `GroupLesson`, one tutor with however many students turn up. Both
have carried their own billing logic since the day the second lesson type was added, and
both have been edited a few times since by whoever was fixing that week's invoice.

## The smell

**Duplicated Code.** `PrivateLesson.billingAmountCents()` and
`GroupLesson.billingAmountCents()` compute the exact same thing - tuition for the minutes
booked, plus a flat fee, rounded to the cent - and neither one calls the other or shares a
line with it. Change the rounding rule and you have to remember there are two places to
change it, and remembering is not a strategy.

They are not, however, *identical* text. `PrivateLesson` reads a field called
`#materialsFeeCents`; `GroupLesson` reads a field called `#suppliesFeeCents`. Same value,
same job, different name, because whoever wrote `GroupLesson` did not go back and check what
the other class called it. That is worth finding before you start pulling anything up.

## The target

**Pull Up Method**: one `billingAmountCents()`, living on `Lesson`, that both subclasses
inherit unchanged. Getting there needs the field it reads to live on `Lesson` too - Pull Up
Field, in service of the method, not as a goal of its own - and needs the two subclasses to
agree on a name for that field before either move is safe.

## Done when

- `Lesson` declares one concrete `billingAmountCents()`; neither `PrivateLesson` nor
  `GroupLesson` declares its own.
- `PrivateLesson.billingAmountCents()` and `GroupLesson.billingAmountCents()` return the same
  values they did before, for the same inputs.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters -
  `npm run lint:strict -- exercises/drills/12-inheritance/01-pull-up-method/solutions` is the
  check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not with the method. Put the two `billingAmountCents()` bodies side by side first and find
every place they differ, even a difference as small as a private field's name. Pulling up a
method that is not yet textually identical on both sides does not merge two behaviours into
one - it just picks one and silently discards the other, which is a behaviour change wearing
a refactoring's name.
</details>

<details>
<summary>The two fields aren't called the same thing. Do I rename first, or pull up first?</summary>

Rename first, and rename only the field - `GroupLesson`'s private field, not its public
constructor property. The two classes already accept the same prop name from their callers;
only the private, internal name drifted. Once both bodies read `this.#materialsFeeCents`,
the method bodies are identical and the move stops being a judgement call.
</details>

<details>
<summary>Does the field have to move to <code>Lesson</code> before the method can?</summary>

Yes. `#materialsFeeCents` is a true private field - `Lesson` cannot read a private field
declared inside a subclass, no matter what it is named. Pull Up Field first, storing it as a
`protected` field set from `Lesson`'s constructor, and only then does `Lesson` have anything
to compute `billingAmountCents()` from.
</details>

## Reading

*Refactoring*, 2nd edition - chapter 12, *Pull Up Method* and *Pull Up Field*; chapter 3,
*Duplicated Code*.
