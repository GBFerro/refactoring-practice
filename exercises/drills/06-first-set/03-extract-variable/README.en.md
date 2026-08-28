[🌐 English](./README.en.md)

# Extract Variable

`Chapter 6` · `Extract Variable` · `●○○` · ~15 min

## Context

Silverbrook Athletics Club charges an entry fee that depends on five things at once:
whether the runner is a club member, how early they registered, whether they belong to
the race's host club, their age category, and a flat governing-body fee added on top.
`calculateEntryFee` computes all five in a single expression and returns it.

## The smell

**Mysterious Name.** Not the function's name — `calculateEntryFee` is fine — but every
piece of arithmetic *inside* it. Nothing there has a name: not the member discount, not
the early-bird factor, not the surcharge, not the age adjustment. The only way to know
what the expression means is to read the operator precedence yourself and reconstruct the
intent the author already had and did not write down.

## The target

**Extract Variable**, five times, without touching anything else about the function. It
takes one parameter list, does one job, and will still take one parameter list and do one
job when you are done — this is not an invitation to split it into smaller functions. Give
each sub-expression a name; leave the shape of the calculation alone.

## Done when

- Every sub-expression inside `calculateEntryFee`'s `return` has a name, and the `return`
  line reads as a short sentence about how those named pieces combine.
- `calculateEntryFee` is still exactly one function.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/06-first-set/03-extract-variable/src` is the
  check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Anywhere — each extraction is independent of the others, which is exactly what makes
Extract Variable low-risk. A safe order is outside-in: start with the three factors being
multiplied together, since they are the most tangled together visually, then peel off the
age adjustment and the flat fee at the end.
</details>

<details>
<summary>Should the three discount factors get one variable each, or one variable for
all three multiplied together?</summary>

Try both and read the `return` line after each. One name per factor lets you see which
discount is which; one combined name hides that but shortens the line. Neither is wrong —
this exercise has a genuine judgment call in it, and the walkthrough spends a paragraph on
which one this solution picked and why.
</details>

<details>
<summary>I extracted everything and the function is longer than the original. Did I do
something wrong?</summary>

No. Extract Variable trades line count for readability — five named `const`s plus a short
`return` is more lines than one dense expression, and that is expected. If the strict lint
profile is unhappy, it is more likely nesting or parameter count than length; check those
first.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Extract Variable*; chapter 3, *Mysterious Name*.
