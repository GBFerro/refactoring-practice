[🌐 English](./README.en.md)

# Introduce Assertion

`Chapter 10` · `Introduce Assertion` · `●●○` · ~20 min

## Context

Fernbank Clinic's dosage calculator turns a patient's weight and a drug's formulary entry
into two numbers: how much medication to give, in milligrams, and how much liquid to draw
up to deliver it, in millilitres. The weight comes from whatever a nurse just entered on the
chart. The formulary entry — the drug's dose-per-kilogram rate and its concentration — comes
from the clinic's own records, maintained by the people who built this software, not typed
in at the point of care.

## The smell

**Primitive Obsession.** A formulary entry's concentration is a bare `number`, and the rule
that governs it — it must be positive, or dividing by it produces nonsense — lives nowhere
in the code. `volumeMl` divides a dose by that concentration and trusts, silently, that
whoever wrote the formulary entry got it right. Nothing states the assumption, nothing
checks it, and nothing distinguishes it from `weightKg` three lines above — a value that
*does* need checking, because a clinician, not a developer, controls it.

## The target

**Introduce Assertion**: make the concentration assumption explicit, and enforce it, right
where it's used — a thrown, unmissable failure the moment a formulary entry is wrong,
instead of a silently useless `Infinity` handed back to whoever called `volumeMl` next. The
weight check three lines away is left exactly as it is: it's validation, not an assumption,
and this refactoring is precise about the difference.

## Done when

- `volumeMl` states, in code, that a drug's concentration must be positive, and throws
  immediately — naming the drug — the moment that's false.
- `checkedWeightKg` is untouched: same thrown `Error`, same message shape, in `src/` and the
  solution alike. This refactoring adds one guard; it does not convert an existing one.
- No test in `tests/` constructs a formulary entry with a non-positive concentration —
  `WALKTHROUGH.md` explains why that absence is deliberate.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/10-conditional-logic/06-introduce-assertion/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Write `assert.ts` first, on its own, before touching `dosage.ts` at all. It has no
dependency on the dosage code, so writing it first means the only later step where
behaviour can change is the one line in `volumeMl` that calls it.
</details>

<details>
<summary>Why not assert on weightKg too, while I'm in there?</summary>

Try it against real input first: call `doseMg(-4, someProfile)` and read the message
`checkedWeightKg` already gives back. A nurse can absolutely type a negative weight; it is
routine, expected input, not a sign the program itself is broken. An assertion documents a
promise between programmers, not a defence against a person using the software normally —
see `WALKTHROUGH.md` for what happens to that promise the moment a production build strips
it out.
</details>

<details>
<summary>How do I know if something belongs behind an assertion or a check?</summary>

Ask whether a caller, using the function entirely correctly through its normal inputs,
could ever cause the bad value. If yes, it's validation — a value like `weightKg`, which
this exercise deliberately leaves alone. If the only path to the bad value is a defect in
code nobody using the function correctly could have written — a typo in a formulary entry,
say — it's an assumption, and that's what an assertion is for.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 10, *Introduce Assertion*; chapter 3, *Primitive
Obsession*.
