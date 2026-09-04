[🌐 English](./README.en.md)

# Replace Conditional with Polymorphism

`Chapter 10` · `Replace Conditional with Polymorphism` · `●●●` · ~45 min

## Context

Fernbank Clinic books three kinds of appointment - a routine checkup, a vaccination, a
blood draw - and three different parts of the booking system need to know what each one
means: the calendar needs a slot length, billing needs a fee, and reception needs to know
what to tell the patient to do beforehand.

## The smell

**Repeated Switches.** `appointmentDurationMinutes`, `appointmentFeeCents`, and
`appointmentPrepInstructions` each open with the same `switch (type)` over the same three
`AppointmentType` values, in three different files. No individual switch is long or
complicated - none of them trips a single lint rule in this repository's profile - and that
is exactly why this smell survives so long in real code: nothing mechanical is watching for
it. What gives it away is a question a linter can't ask: if a fourth appointment type
arrives, how many places have to change together, and what happens the day someone finds
two of the three?

One switch on its own is not this smell. Three switches on the same type code, in three
places that all have to be found and updated in lockstep, is.

## The target

**Replace Conditional with Polymorphism**: one class per appointment type, each answering
`durationMinutes()`, `feeCents(insured)`, and `prepInstructions()` for itself. The three
public functions keep their exact signatures - `Member`'s frozen API in `drill-07-05` is
the same idea - they just ask a freshly built appointment object instead of switching
directly. Exactly one switch survives, in the factory that builds that object; the book's
own account of this refactoring expects that one to stay.

## Done when

- `appointmentDurationMinutes`, `appointmentFeeCents`, and `appointmentPrepInstructions`
  keep their exact signatures and no longer contain a `switch`.
- There is exactly one `switch` on `AppointmentType` left in the whole solution.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/10-conditional-logic/04-replace-conditional-with-polymorphism/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Build the shape before you fill it in: an abstract `Appointment` class with three method
stubs, three empty subclasses, and a factory function that switches on `AppointmentType` to
build one - none of it wired to a caller yet. Only once that scaffolding compiles should you
start moving a switch's `case` bodies onto the classes, one function at a time.
</details>

<details>
<summary>Which switch do I move first?</summary>

Doesn't matter - the three are independent of each other. Pick whichever return type feels
simplest to get right (a `number` is easier to double-check than a parameterized `boolean`
branch), move all three of its `case`s onto the classes, and collapse the original function
into a one-line call through the factory before touching the next switch.
</details>

<details>
<summary>Is three switches always worth this?</summary>

No, and that's the judgement this drill is actually testing. One switch on its own doesn't
justify a class hierarchy - it justifies leaving it alone, or at most a lookup table. What
makes the cost worth paying here is specifically that the *same* type code drives three
independent decisions in three independent places. Count the switches before you commit to
the classes.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 10, *Replace Conditional with Polymorphism*;
chapter 3, *Repeated Switches*.
