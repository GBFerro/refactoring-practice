# Steps — one shared total, computed once

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when the same statements sit in front of every call to a function,
computing something the function itself could compute from what it was already given. The
tell here is stronger than usual: those statements are supposed to be identical across
every call site — this refactoring's precondition — so before moving anything, line the
call sites up and check that they actually are.

**What it costs:** `renderReceipt` now owns a decision — floor the total at zero — that
used to live at each call site. A caller that legitimately needed a different total would
have nowhere to ask for it except a new parameter or a branch. See
`drill-08-04` for the shape that
produces, and for what to do about it.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-08-03     # 6 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Fix `reprintReceipt`'s copy of the total math so it floors at zero like the other two | `fix: floor the reprinted total at zero, matching the other two callers` |
| 2 | Move the subtotal/total computation into `renderReceipt`; delete the now-redundant copy from all three callers; drop `renderReceipt`'s `totalCents` parameter | `refactor: move the total computation into renderReceipt` |

Step 2 lands as one commit, not three, because `renderReceipt`'s signature changes as part
of it — every caller has to update in the same commit or the build does not compile in
between. That is different from a drill like Extract Class, where each caller could move
independently. See "Why this order" in `WALKTHROUGH.md` for the technique that keeps this
safe anyway, and for what you'd do differently with more than three callers.

---

Where it lands:

```ts
export function renderReceipt(order: WholesaleOrder): string[] {
  const totalCents = Math.max(0, subtotal(order.items) - order.creditCents);
  return [ /* header, item lines, total */ ];
}

export function completeRouteStop(order: WholesaleOrder): string[] {
  return [...renderReceipt(order), "Signed for at the door."];
}
```

Three one-line callers, a function that no longer needs anyone to hand it a total it could
work out itself, and one fewer place a future edit to the credit rule could be applied
inconsistently.
