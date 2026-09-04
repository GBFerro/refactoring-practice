[🌐 English](./README.en.md)

# Decompose Conditional

`Chapter 10` · `Decompose Conditional` · `●○○` · ~20 min

## Context

Fernbank Clinic bills every appointment against a base fee, and that fee is marked up
whenever the visit falls outside normal opening hours — an early morning, a weekend, a
public holiday, or a booking that simply runs past closing time. `appointmentChargeCents`
is the one place that decides which rate applies and does the arithmetic.

## The smell

**Mysterious Name.** Not a missing name — every value here has one, `rawCents`,
`appt`, `tariff`. The problem is that the condition and both branches don't. The `if` is
four clauses long, two of them comparing an appointment's start time against `480` and
`1080` — numbers that mean nothing until you've done the arithmetic to recover "opens at
8, closes at 6." Each branch mixes a multiplier and a flat surcharge with no explanation of
which is which or why. None of it is complicated code. All of it makes the reader do work
a name would have done for them.

## The target

**Decompose Conditional**: extract the condition into a function that answers a yes/no
question, and extract each branch into a function that computes one clearly-named outcome.
Mechanically this is `drill-06-01`'s Extract Function, applied to the three parts of an
`if`/`else` — if you've done that drill, the moves here are not new. What's new is
recognising that a compact `if` can still be worth decomposing; length isn't the tell,
readability is.

"Done" looks like the same `if`/`else` shape, but every part of it — the test, the
out-of-hours charge, the standard charge — reads as a sentence at its call site instead of
an expression you have to evaluate by hand.

## Done when

- The condition inside `appointmentChargeCents` is a single named function call, not an
  inline boolean expression.
- Both branches call a named function; no branch is a bare arithmetic expression.
- No magic numbers remain where the opening and closing times are compared.
- `npm run lint:strict -- exercises/drills/10-conditional-logic/01-decompose-conditional/src`
  is clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

With the two numbers inside the condition, before you extract anything. Give `480` and
`1080` names first. Extracting `isOutOfHours` while they're still bare numbers just moves
the mystery one level down instead of removing it.
</details>

<details>
<summary>Do I need to extract both branches, or just the complicated one?</summary>

Look at what each branch is answering. If both are answers to the same question — "what
does this appointment cost" — under two different conditions, treating them asymmetrically
means a reader has to notice that the asymmetry means nothing before they can trust it.
That's an argument for extracting both, even the short one. It's a real judgement call, not
a rule; see the walkthrough for the case against it too.
</details>

<details>
<summary>How is this different from what I already did in `drill-06-01`?</summary>

It isn't, mechanically. Extract Function doesn't care whether the block you're pulling out
is a loop body or a branch of an `if`. What's different here is the trigger: you're not
looking for a long function this time, you're looking for a condition or branch that makes
you do arithmetic in your head before you can say what it means.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 10, *Decompose Conditional*; chapter 3, *Mysterious
Name*.
