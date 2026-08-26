[🌐 English](./README.en.md) · [🇧🇷 Português](./README.pt.md)

# Extract Function

`Chapter 6` · `Extract Function` · `●○○` · ~25 min

## Context

A running club prints a plain-text results sheet after every race: the finishers ranked
by chip time, the runners who did not finish, and a short summary at the bottom. The
program works, the club has used it for three seasons, and nobody wants to touch it.

## The smell

**Long Function**, with **Comments** as the tell. `renderRaceReport` is one procedure
seventy lines deep, and every few lines there is a comment announcing what the next block
does — `// pace as m:ss per kilometre`. A comment that explains a block is a function name
waiting to be born.

There is **Duplicated Code** hiding in there too. Find it before you start; it is the most
satisfying extraction in the exercise.

## The target

**Extract Function**, over and over, until the top-level function reads as a table of
contents for the report rather than as the procedure that builds it.

You will need **Extract Variable** in a couple of places to give an expression a name
before you can lift it out. That is normal — the catalog entries are moves, not chapters.

## Done when

- `renderRaceReport` fits on one screen and contains no comments explaining blocks.
- The chip-time formatting exists in exactly one place.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters — `npm run lint:strict -- exercises/drills/06-first-set/01-extract-function/src`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

At the bottom, with the smallest thing. `formatDuration` is used twice and depends on
nothing but its input — extracting it is safe, quick, and immediately removes the
duplication. Working outside-in on a long function means every step touches the whole
thing; working from the leaves means each step is small.
</details>

<details>
<summary>The loop is doing three things at once.</summary>

It ranks, it formats, and it accumulates a running total for the average pace. The total
is the awkward one: it is computed inside the loop but used far below it. Extract the
formatting first and leave the accumulator alone; once the loop body is one line, ask
whether the total needs to be accumulated at all or can simply be computed from the
finishers when the summary needs it.
</details>

<details>
<summary>`entry.seconds` is `number | null` and it is fighting me.</summary>

Every `?? 0` in the challenge code is the type system telling you the filter and the
formatting are tangled. A predicate that narrows the type —
`function isFinisher(entry: Entry): entry is Finisher` — lets you extract a function that
takes a runner who definitely has a time. That is a real extraction, not a trick.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Extract Function*; chapter 3, *Long Function*
and *Comments*.
