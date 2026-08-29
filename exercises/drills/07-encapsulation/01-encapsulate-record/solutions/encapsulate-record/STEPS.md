# Steps — a class with three getters, not a public interface

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a record's fields are readable *and writable* from more
than one file with nothing standing between the field and the assignment. A raw, widely
shared, mutable record has one correct first move, which is why this is a drill.

**What it costs:** four fields still have no public getter, because no caller in this
exercise needs one. The class is smaller than the record it replaced — which is the point,
not an oversight — but it means the next caller that wants to read a fifth field has to add
the getter itself rather than finding it already there.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-01     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Turn `Loan` from an interface plus an object-literal factory into a class with a constructor; every field stays public and mutable, so nothing outside `loan.ts` has to change yet | `refactor: turn the loan record into a class` |
| 2 | Add `markReturned(returnedOn)` to the class; replace the raw `loan.returnedOn = ...` assignment in `returns.ts` with a call | `refactor: extract markReturned onto Loan` |
| 3 | Add `renew(today)` to the class, moving `MAX_RENEWALS` in with it; replace the guard-and-mutate block in `renewals.ts` with a call | `refactor: extract renew onto Loan` |
| 4 | Turn `dueOn`, `returnedOn`, and `renewalCount` into private `#`-fields with read-only getters of the same names | `refactor: make dueOn, returnedOn, and renewalCount private` |

Step 1 is deliberately inert — no caller changes and no field becomes private. It exists so
that steps 2–4, which each remove one way of touching a field from outside the class, can
be reviewed and reverted independently of each other.

---

Where it lands:

```ts
export class Loan {
  readonly id: string;
  readonly memberId: string;
  readonly itemId: string;
  readonly checkedOutOn: string;
  #dueOn: string;
  #returnedOn: string | null;
  #renewalCount: number;

  get dueOn(): string { return this.#dueOn; }
  get returnedOn(): string | null { return this.#returnedOn; }
  get renewalCount(): number { return this.#renewalCount; }

  renew(today: string): RenewalOutcome { /* ... */ }
  markReturned(returnedOn: string): void { /* ... */ }
}
```

`renewals.ts`, `returns.ts`, `status.ts`, and `overdue.ts` still import `Loan` and still
read `loan.dueOn` — reading was never the problem. What changed is that none of them can
write to it any more; try `loan.dueOn = "2026-01-01"` from any of those files and TypeScript
refuses to compile it.
