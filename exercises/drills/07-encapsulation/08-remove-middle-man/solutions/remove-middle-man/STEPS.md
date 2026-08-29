# Steps — branch.manager, not six forwards

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when every public method on a class does nothing but forward to
one field, and the object that field points at is not some incidental implementation
detail — every caller of the forwarding methods already knows, or would happily know, that
the field exists. `Branch` passes both tests: six methods, six one-line forwards, and every
caller is branch-operations code that has no trouble thinking in terms of "the branch's
manager."

**What it costs:** every `branch-ops.ts` function now names `Manager`'s shape at its call
site, not just `Branch`'s. Before this refactoring, a caller could read `branch-ops.ts`
without knowing `Manager` existed at all; after, six call sites say so directly. See
[`drill-07-07`](../../../07-hide-delegate/README.en.md), which keeps that exact knowledge
out of its call sites for a delegate that earns it — read both before deciding this is
always the right call.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-08     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Make `Branch.manager` a public field (was `#manager`); forwarding methods still present, still used | `refactor: expose Branch.manager` |
| 2 | Update all six `branch-ops.ts` call sites to read `branch.manager.<method>()` directly | `refactor: read manager.<method>() directly at every call site` |
| 3 | Confirm nothing still calls `Branch`'s six forwarding methods; delete them | `refactor: remove Branch's forwarding methods` |

Steps 1 and 2 are separate because step 1 alone changes nothing observable — the forwards
are still what every caller uses — and step 3 is only safe once step 2 has actually moved
every caller off them.

---

Where it lands:

```ts
export class Branch {
  readonly manager: Manager;
  // id, location, constructor — unchanged
}

// branch-ops.ts, all six functions
branch.manager.name();
branch.manager.isCertifiedForRareBooks();
// ...and so on
```

No forwarding method left on `Branch` for a reader to wonder whether it does anything more
than its one line says.
