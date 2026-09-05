[🌐 English](./README.en.md)

# Remove Subclass

`Chapter 12` · `Remove Subclass` · `●○○` · ~20 min

## Context

Beckworth Music School lets a new student sign up for a one-term trial before committing
to ongoing lessons. Trial enrolments used to work differently in several ways — no
instrument rental, a shorter notice period to leave, priority re-booking the following
term. Those extra rules have all been retired or folded back into how every student is
treated, one policy change at a time, over a couple of years.

## The smell

**Lazy Element.** `TrialStudent` still exists as its own subclass of `Student`, but it now
overrides exactly two methods, and both overrides do nothing except return a different
fixed value depending on one already-existing boolean. The class is not wrong, and it is
not badly named — it simply stopped earning a class's worth of structure some time before
this exercise starts, and nobody came back to notice.

## The target

**Remove Subclass**: fold `TrialStudent`'s two overrides into `Student` as a single field
read in two places, and delete the subclass. `enrolStudent`'s signature, and every method a
caller calls on the `Student` it returns, stay exactly as they are from the outside.

## Done when

- `TrialStudent` no longer exists anywhere in the solution.
- `Student` decides its fee and its label by reading one field, not by which class it is.
- `enrolStudent(input)` and every method on the `Student` it returns —
  `name()`, `instrument()`, `termFeeCents()`, `kindLabel()` — are unchanged from the
  outside.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/07-remove-subclass/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Read `TrialStudent` in full and ask, for each override: does this branch on anything the
object doesn't already have sitting in `EnrolmentInput`? If the answer is no for every
override, the subclass is just a hand-rolled way of checking one field, and everything it
does can move into `Student` as a plain conditional.
</details>

<details>
<summary>How do I make the field-reading step safe?</summary>

Write the field-checking version of each method on `Student` first, while `enrolStudent`
still constructs `TrialStudent` for trial input. The new code is unreachable, so it cannot
change any test's result yet — which means you can compare it against `TrialStudent`'s
original body at your leisure before the step that actually routes through it.
</details>

<details>
<summary>Once `enrolStudent` always builds `Student`, is there anything left to clean up?</summary>

Check `Student`'s field that used to need `protected` for the subclass to reach into. With
no subclass left, does anything still need that visibility, or can it tighten to a private
field?
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Remove Subclass*; chapter 3, *Lazy Element*.
