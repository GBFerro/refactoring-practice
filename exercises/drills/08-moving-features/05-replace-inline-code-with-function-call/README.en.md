[🌐 English](./README.en.md)

# Replace Inline Code with Function Call

`Chapter 8` · `Replace Inline Code with Function Call` · `●●○` · ~25 min

## Context

Ashgrove Bakery Co-op takes special orders from customers who need certain allergens kept
out of what they're baking for — a cafe placing an order on behalf of a regular with a nut
allergy, a customer baking for a child's classroom. Before an order goes to production, the
system checks every item against the allergens the order asked to avoid, so a baker can
swap an ingredient or double-check with the customer first.

## The smell

**Duplicated Code**, the kind that's easy to miss because it doesn't look duplicated.
`order-safety.ts` hand-rolls a loop that decides whether a product conflicts with a
customer's avoid-list — but the online ordering page already answers this exact question,
in `menu.ts`, for its own "hide anything I'm allergic to" filter. Different loop shape,
different list walked first, a flag that accumulates instead of a predicate that returns —
the two blocks don't look like copies of each other. They are.

## The target

**Replace Inline Code with Function Call**: delete the hand-written check, call the
function that already exists. The interesting part isn't deleting the loop — it's
recognizing, with something more solid than a glance, that the loop and the function
compute the same thing before you trust the swap.

## Done when

- `order-safety.ts` calls `productIsSafeFor` from `menu.ts` instead of re-checking
  allergens itself.
- No hand-written allergen comparison remains in `itemsWithAllergenConflict`.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/08-moving-features/05-replace-inline-code-with-function-call/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I even start looking?</summary>

`order-safety.ts` isn't the only file in this exercise. Read `menu.ts` too — it exists for
a different feature (the online menu's allergy filter), which is exactly why it's easy to
miss as "the same code." Duplicate logic in a real codebase rarely sits next to its twin.
</details>

<details>
<summary>The two blocks don't look alike. How do I know they're the same?</summary>

Don't trust a glance, and don't trust "the tests still pass" either — that only proves
agreement on the inputs the tests happen to cover. Rewrite the inline code in small,
tested steps until its shape matches the existing function's shape. Once the two are
close enough to compare line by line, the question "are these the same?" gets much easier
to answer honestly.
</details>

<details>
<summary>The inline loop walks one list; the existing function walks the other.</summary>

"Does some element of A appear in B" and "does some element of B appear in A" are the same
question, asked from two ends — both are asking whether A and B share anything at all.
Which list you iterate over doesn't change that answer. That's the fact that makes this
refactoring safe, not a coincidence about this particular codebase.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Replace Inline Code with Function Call*;
chapter 3, *Duplicated Code*.
