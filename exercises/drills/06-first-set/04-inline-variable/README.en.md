[🌐 English](./README.en.md)

# Inline Variable

`Chapter 6` · `Inline Variable` · `●○○` · ~15 min

## Context

Silverbrook Athletics Club prints a splits sheet after every race: a leg per timing mat,
each with its elapsed time, its own duration, and pace, followed by a short summary. The
race director asked for it after the club's first fell race, where "how did I pace the
climb" mattered more than the finish time.

## The smell

**Lazy Element**, in its most common shape: a local variable that only aliases a field or
restates the expression that produced it, and is read exactly once, right after it is
declared. `const label = segment.label.padEnd(LABEL_WIDTH);` earns nothing by existing —
the name repeats what the expression already says, and the reader now has to hold two
things in mind (the variable and what it stands for) instead of one.

It is not that naming is bad. It is that naming *this* — a value used once, one line below
its declaration, in a context where the expression itself already reads clearly — is
ceremony. The file is not hard to read because it lacks names; it is hard to read because
it has too many of them, scattered across variables that do not carry their weight.

## The target

**Inline Variable**: replace each such variable with the expression it stood for, at its
one call site, and delete the declaration. Not every variable goes. A few genuinely earn
their line — because they are read more than once, because inlining them would silently
change *how often* an expensive or side-effecting expression runs, or because the
refactoring's own precondition rules them out before you even ask the question. Telling
those apart is the exercise.

## Done when

- Every variable that only aliases a field or restates an expression used once has been
  inlined.
- The variables that remain each have a one-sentence reason, and no two of them share the
  same reason.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/06-first-set/04-inline-variable/src` is the
  check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Anywhere the variable is used exactly once, one line after it is declared, and the
expression it holds is already short enough to read at the call site. `paceSecondsPerKm`
and `averagePaceSecondsPerKm` are the smallest, safest first moves — pure arithmetic on
values already in scope, nothing conditional, nothing reused.
</details>

<details>
<summary>Two of these look identical but are not.</summary>

`fastestSegment` builds a running accumulator with `let fastest` — reassigned across
iterations, never a single-assignment alias, so Inline Variable does not apply to it at
all. `renderSummary` holds a `fastest` too, assigned once and read three times — a
different variable, a different question, and the answer is the opposite one. Reading the
name is not enough; check how many times the variable is actually used, and whether it is
ever reassigned.
</details>

<details>
<summary>`average` in `hasEvenPacing` looks like a one-off. It is not.</summary>

Count the *textual* occurrences of `average` and you find one, inside the callback passed
to `segments.every`. Count the *calls* to that callback and you find one per segment.
Inlining `average` would replace a single division with one division per segment — same
result, different cost, and a change a reviewer skimming the diff would not notice. When a
variable is captured by a callback, ask how many times the callback runs, not how many
times the variable's name appears in the source.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Inline Variable*; chapter 3, *Lazy Element*.
