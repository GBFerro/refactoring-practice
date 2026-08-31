[🌐 English](./README.en.md)

# Move Function

`Chapter 8` · `Move Function` · `●○○` · ~20 min

## Context

Ashgrove Bakery Co-op takes wholesale orders from cafes and grocers around town and
delivers them each morning, grouped into routes a driver runs stop by stop. Every order
needs a delivery distance for the invoice — how far the driver had to go to reach that
customer — and the co-op has calculated it the same way since the first route sheet was
drawn up by hand.

## The smell

**Feature Envy.** `deliveryDistanceKm` lives in `order.ts`, but it takes an order almost
as an afterthought: it reads one field off `order` (`customerId`, just to find the right
stop) and three fields off `route` (`stops`, `returnLegKm`, `loopsBackToDepot`) to do the
actual work. It even forces `order.ts` to `import type { Route }` just to describe its own
function's second parameter. A function that reaches across a module boundary this much
for its data is telling you which module it actually belongs to.

## The target

**Move Function**, once: `deliveryDistanceKm` moves into `route.ts`, next to the `Route`
and `Stop` types it is actually built from. `index.ts` — the public boundary — keeps
exporting the same name with the same signature; nothing that imports `@exercise` changes.
This is the first drill in the repository where the refactoring moves code between files,
not around inside one.

## Done when

- `deliveryDistanceKm` is defined in `route.ts`, not `order.ts`.
- `order.ts` no longer imports `Route`, in any form.
- `index.ts` still exports `deliveryDistanceKm(order: Order, route: Route): number` under
  the same name — nothing in `tests/` changed.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/08-moving-features/01-move-function/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Count what the function touches before you move anything. List every field of `Order` it
reads, then every field of `Route`. The lopsided list tells you which module it belongs in
— and it will tell you before you write a line of the move.
</details>

<details>
<summary>How do I move it without a moment where nothing works?</summary>

Copy it into `route.ts` first, unchanged, before touching `order.ts` at all. Then turn
`order.ts`'s original into a one-line delegation to the copy. Only once that is green do
you touch the one file that decides where callers actually go.
</details>

<details>
<summary>Which file decides where callers actually go?</summary>

`index.ts`. Every test in this exercise imports from `@exercise`, which resolves to
`index.ts` and nothing else — the tests have never heard of `order.ts` or `route.ts`. If
you find yourself wanting to edit `tests/`, you have moved something the tests weren't
asking you to move.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Move Function*; chapter 3, *Feature Envy*.
