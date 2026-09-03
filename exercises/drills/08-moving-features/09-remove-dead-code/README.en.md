[🌐 English](./README.en.md)

# Remove Dead Code

`Chapter 8` · `Remove Dead Code` · `●●○` · ~30 min

## Context

Ashgrove Bakery Co-op has been running wholesale promo codes for as long as anyone on staff
can remember: signup incentives for the first cafes, a walk-in sample program at the old
storefront, a one-weekend discount for a fair the co-op sponsored once. Each of these got a
branch in the pricing code when it launched. Almost none of them got a branch removed when
they ended.

## The smell

**Speculative Generality.** `promoDiscountCents` is built to handle any promo code that
might ever show up — which sounded reasonable when it was written, and now means it also
handles every promo code that used to show up. Most of the branches inside it have no
caller left anywhere in this codebase. They cost nothing to run and everything to read: a
new hire opens this file and cannot tell, from the code alone, which branches are load-
bearing and which are archaeology. That question has to be answered before anything else in
this file can be trusted, refactored, or safely extended.

## The target

**Remove Dead Code.** Every branch that cannot be reached by any real caller comes out. The
mechanical part is one line per branch: delete it. Getting there is the exercise — you have
to establish, for each branch, that nothing in this codebase can ever make it run. "Done"
looks like a `promoDiscountCents` where every surviving line has a caller you can point to,
and nothing more.

## Done when

- `promoDiscountCents` contains no branch you cannot point to a real caller for.
- `sampleCrateWaiver` is gone entirely — the function, not just the branch that called it —
  once you've confirmed nothing else calls it either.
- The founder-rate branch is **still there**, and still reachable — by something other than
  a literal argument.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/08-moving-features/09-remove-dead-code/solutions`
  is the check.
- `npm test` was green after every single deletion along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Grep this exercise — `src/`, `tests/`, all of it — for each promo code string
`promoDiscountCents` compares against. A string that never appears as an argument anywhere
is a strong lead, but it is not proof by itself: a value can reach a comparison without ever
being written as a literal at the place that supplies it. Keep reading before you delete.
</details>

<details>
<summary>One of the branches calls a helper function. Does deleting the branch finish the job?</summary>

No. Check whether that helper is called from anywhere else once its one caller is gone. A
function with zero remaining callers is exactly as dead as the branch that used to reach it
— it just takes one more step to see.
</details>

<details>
<summary>The suite stayed green after I deleted three branches. Am I done?</summary>

Maybe not. A green suite after a deletion tells you the tests don't reach the branch you
removed — it does not tell you nothing else in the file does. Before you touch the fourth
branch, ask where each promo code string could come from besides an argument someone typed.
One of them has a second source.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Remove Dead Code*; chapter 3, *Speculative
Generality*.
