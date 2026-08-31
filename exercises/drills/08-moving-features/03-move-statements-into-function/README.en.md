[🌐 English](./README.en.md)

# Move Statements into Function

`Chapter 8` · `Move Statements into Function` · `●●○` · ~25 min

## Context

Ashgrove Bakery Co-op bakes for wholesale: cafés and shops place standing orders, and a
route driver delivers them, receipt in hand. The same order can also generate a receipt
away from the truck — the office reprints one when a customer says theirs went missing —
so more than one part of the system needs to turn an order into the slip a customer reads.

## The smell

**Duplicated Code.** Three places build a receipt for an order, and all three start by
computing the same total from the same order — sum the items, subtract the account credit.
Two of the three copies floor that total at zero; the third does not. That is not a
stylistic inconsistency. It is duplicated logic that has already drifted once, silently,
and nothing stops it from drifting again the next time someone edits one copy and not the
others.

## The target

**Move Statements into Function**, once, for the total computation: `renderReceipt` should
compute its own total from the order it is already given, instead of trusting each caller
to hand one in. Done looks like three call sites that each do one thing — build the
receipt, add their own trailing line — and a `renderReceipt` that no longer needs a
`totalCents` parameter at all.

## Done when

- `completeRouteStop`, `closeStandingOrder`, and `reprintReceipt` no longer compute a
  subtotal or a total themselves.
- `renderReceipt` takes only the order and computes the total — the floor at zero included
  — from it.
- Every caller's own trailing line (`"Signed for at the door."` and so on) is unchanged.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/08-moving-features/03-move-statements-into-function/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not with `renderReceipt`. Start by lining up the two lines that precede each of the three
calls to it, side by side. Before you move anything, confirm they really are doing the same
thing — this refactoring only preserves behaviour if they are.
</details>

<details>
<summary>What if they're not all doing the same thing?</summary>

Then look closely at what would have to be true for the difference to matter — what input
would actually produce two different outputs from the two versions? If none of the tests
exercise that input, that does not mean the difference is safe to ignore; it means the
suite isn't the tool that will catch it for you here.
</details>

<details>
<summary>What happens to `renderReceipt`'s parameter list?</summary>

Once the total is computed inside the function instead of handed to it, the parameter that
used to carry it in has nothing left to do. Losing it is not a side quest — it is the same
signal Change Function Declaration gives you: a parameter nobody needs any more.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Move Statements into Function*; chapter 3,
*Duplicated Code*.
