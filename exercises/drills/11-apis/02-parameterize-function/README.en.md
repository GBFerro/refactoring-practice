[🌐 English](./README.en.md)

# Parameterize Function

`Chapter 11` · `Parameterize Function` · `●●○` · ~30 min

## Context

Halliday Box Office nudges its price bands upward as a performance sells down. Every time
a performance crosses a demand threshold, the sales system tells this module which tier it
has reached — low, medium, or high — and the module raises the affected price bands by a
flat amount.

## The smell

**Duplicated Code**. `raiseByFive`, `raiseByTen`, and `raiseByTwenty` are the same
function three times over: same parameter, same shape, same line, differing only in the
literal added to `pricePounds`. A fourth demand tier would mean a fourth near-copy, and a
change to how a rise is applied — rounding it, logging it, capping it — would mean finding
and fixing all three, or three and forgetting one.

There is a fourth raise function in the same file. Read it before you start reaching for
the merge.

## The target

**Parameterize Function**: collapse the three near-identical functions into one that takes
the varying literal as a parameter. Mechanically that is most of the exercise. What it does
not tell you is which functions actually qualify — a function that differs from the other
three only by *value* belongs in the merge; a function whose number happens to match one of
theirs but carries an extra rule the others don't have does not, and folding it in erases
that rule silently.

## Done when

- `raiseByFive`, `raiseByTen`, and `raiseByTwenty` no longer exist as three separate
  functions anywhere in `src/`; one function takes the rise as a parameter.
- The function that does not belong in that merge is still standing on its own, with its
  extra rule intact.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/11-apis/02-parameterize-function/src`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. The three functions the sales system actually
calls — `raiseStandardBand`, `raiseRestrictedViewBand`, `raisePriceBands` — keep their
signatures; the suite in `tests/callers.spec.ts` only pins those three. Everything below
that boundary — how many functions do the raising, and what they are called — is yours to
redesign.

## Hints

<details>
<summary>Where do I start?</summary>

Read all four raise functions before writing anything. Three of them are exactly the same
shape with a different number. The fourth has the same numbers as the other three at some
point in its body, and also has two lines that never appear anywhere else in the file. Ask
what those two lines are protecting before you decide whether the fourth belongs with the
first three.
</details>

<details>
<summary>I've merged three functions into one. What do I call the parameter?</summary>

Not `amount`, not `value` — check them against question 3 in
[`docs/NAMING.md`](../../../../docs/NAMING.md): does the name read at the call site, or
only at the definition? A parameter that is a number *and* has a unit reads better than one
that is a number alone. This repository's naming conventions table has an example of the
pattern you're looking for.
</details>

<details>
<summary>Should the fourth function share the new parameterized one internally?</summary>

It's fine for it to call the same low-level helper the merged function calls, as long as
that helper only does the flat-rise arithmetic — the part all four functions genuinely
share. What it must not do is lose the extra rule by being routed through
`raiseStandardBand`, or by growing a boolean flag that turns the rule on and off. Chapter 11
has a name for what a flag like that would create; it isn't this refactoring's name.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 11, *Parameterize Function*; chapter 3, *Duplicated
Code*.
