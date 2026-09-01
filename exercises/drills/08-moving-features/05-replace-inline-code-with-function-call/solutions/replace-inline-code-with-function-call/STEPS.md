# Steps — one predicate, called from both features

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and how equivalence was
actually established, not just assumed — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever you recognize that a hand-rolled block computes the same
thing an existing, named function already computes. Not whenever two blocks merely *look*
alike — see `WALKTHROUGH.md` for how "looks alike" and "is provably the same" differ here.

**What it costs:** `order-safety.ts` now depends on `menu.ts`'s definition of "safe."
A change to that definition — made for the browsing feature, with the browsing feature's
tests in mind — now silently changes what production flags too.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-08-05     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Replace the accumulator flag with `mustAvoidAllergens.some(...)`, same iteration angle | `refactor: replace accumulator with some() in the conflict check` |
| 2 | Flip the iteration: check `item.product.allergens` against the avoid-list, not the reverse | `refactor: check the product's own allergens against the avoid-list` |
| 3 | Replace the inline predicate with a call to `productIsSafeFor` from `menu.ts` | `refactor: replace inline code with productIsSafeFor` |

Steps 1 and 2 don't touch `menu.ts` at all — they only change the *shape* of the inline
code, without changing what it computes. Step 3 is the one this drill is named for, and by
the time you reach it, the inline code and `productIsSafeFor`'s body should read as the
same three lines twice. If they don't, stop: that's the signal to go find where they
diverge before step 3, not after.

---

Where it lands:

```ts
// order-safety.ts
import { productIsSafeFor } from "./menu";

export function itemsWithAllergenConflict(order: Order): OrderItem[] {
  const flagged: OrderItem[] = [];
  for (const item of order.items) {
    if (!productIsSafeFor(item.product, order.mustAvoidAllergens)) {
      flagged.push(item);
    }
  }
  return flagged;
}
```

The outer loop is untouched throughout — this drill is about the duplicated *check*, not
about the loop it lives inside. Converting that loop to a pipeline is a different
refactoring, for a different day (see `drill-08-08`).
