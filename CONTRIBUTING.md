# Contributing

The design notes in [`docs/DESIGN.md`](./docs/DESIGN.md) are the reference; this file is
the short version you need to add an exercise.

## Write in this order

**Domain → clean code → tests → un-refactor into the challenge → `STEPS.md`.**

The order is not a style preference. Writing the smelly version first produces *artificial*
mess — the kind nobody meets in production. Dirtying clean code, by undoing a real
refactoring one step at a time, produces exactly the kind of mess the book describes, and
`STEPS.md` falls out almost for free: read your own commits backwards.

```bash
./rp new --type drill --chapter 10 --title "Decompose Conditional" \
         --refactoring "Decompose Conditional" --smell "Long Function"
```

Then:

1. Write the **clean** implementation in `solutions/<slug>/`.
2. Write the tests in `tests/`, importing from `@exercise`. They must be green.
3. Copy the clean code to `src/` and **un-refactor it**, step by step, running the suite
   after each step. Every step you undo is a step the reader will redo.
4. Write `STEPS.md` from your undo log, reversed — terse, one line per move.
5. Write `WALKTHROUGH.md` — the commentary. Why each move, why in that order, what each
   name had to earn, what it cost, and which alternatives are equally defensible.
6. `./rp index && ./rp validate`.

### On the tests

Write **one test per behaviour a plausible refactoring of this file could silently
change** — not one per line, and not to a coverage number. The reference drill reached 100%
line coverage with half its final suite; coverage tells you which code ran, never which
promises are pinned.

The usual suspects, all of which a well-meaning extraction can break: ordering and sort
stability, ties, the empty and single-element cases, boundary values in any rounding or
formatting, and layout behaviour like overflow versus truncation. Name the move you are
guarding against in a comment above each test.

## The rules the validator enforces

- **`README.en.md` is mandatory**; `README.pt.md` is optional and warned about, never
  blocking. English is the repository's default because the book and the audience are.
- **Refactoring and smell names must be canonical** — the second-edition names from
  `docs/catalog-names.json` and `docs/smell-names.json`. "Extract Method" is the first
  edition and will fail.
- **A drill has exactly one solution.** Mechanics has one right move; if your drill has
  two real answers, it is a kata and belongs in `exercises/katas/`.
- **A kata should have two or more.** One is a warning, not an error, but it means the
  exercise is a large drill.
- **Every solution declares its trade-off.** A variant that cannot name what it costs is
  not ready.
- **Every solution has both `STEPS.md` and `WALKTHROUGH.md`.** The first is the route, the
  second is the reasoning. A route without commentary teaches the moves and not the
  judgement.
- **An exercise without tests must declare `coverageTargets`** — the files whose branches
  the reader's safety net has to pin at 100%.

## Naming

Function names are not in the book's catalog as a skill, only as moves (*Rename Variable*,
*Mysterious Name*). They are treated as first-class here anyway, because Extract Function
is a naming exercise wearing a mechanical costume. Every `WALKTHROUGH.md` says which of the
four questions in [`docs/NAMING.md`](./docs/NAMING.md) decided a name and which candidate
was rejected. `./rp names <id>` catches the vague ones; it cannot catch the untrue ones.

## What counts as a second solution

A different **design decision**, with a nameable cost: polymorphism versus a strategy
table, a guard clause versus a special-case object. Different names, different formatting
and a different order of extraction are **not** variants — they are the same solution
written twice, and each copy doubles the maintenance cost of the exercise while teaching
nothing.

Variants cross-reference each other. Each `STEPS.md` opens with *When to choose this* and
*What it costs*, and the second section points at its sibling.

## Never in this repository

The book's code and prose are not ours to redistribute. This is a hard rule for every PR:

- **No transcribed code from the book** — including the chapter 1 `statement`/`plays`
  example, which is the one everybody copies. Invent your own domain.
- **No quoting beyond a short sentence**, and always with attribution.
- **Reading references are pointers**, never content: "chapter 10, *Introduce Special
  Case*".
- Both READMEs state that this is unofficial material and that the book is a prerequisite.

## Before you open the PR

```bash
npm run check
```

That is the same set CI runs: validate, generated files, lint, format, types, the baseline
suites and the solution suites.
