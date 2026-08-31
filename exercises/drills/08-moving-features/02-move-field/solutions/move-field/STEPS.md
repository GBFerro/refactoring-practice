# Steps — a delegating getter, not a second copy

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the dead ends — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a field is duplicated onto a record that already holds a
reference to the object the field actually belongs to, and nothing but a manual resync
keeps the copies from drifting apart. If the target object were not already reachable by
reference, this would be a bigger job than a drill.

**What it costs:** the fix depends on `Customer.plan` always being the *same* `ContractPlan`
instance for every customer on that plan, not a separate object that merely shares an id. A
customer built from a freshly constructed plan with a matching id but a different object
identity would silently stop agreeing with its siblings again — the same failure mode this
drill exists to remove, reintroduced one level up, and nothing in these types would catch
it.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-08-02     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Turn `Customer` from an interface plus an object-literal factory into a class; `discountRate` becomes a private `#discountRate` field with a getter *and* setter that just delegate to it — no behaviour change. Same move as drill-07-01, applied to one field. | `refactor: encapsulate discountRate on Customer` |
| 2 | Redirect the getter only, to `return this.plan.discountRate`. Leave the private field and the setter in place — they still compile, they are just unread now. | `refactor: read discountRate from the plan` |
| 3 | Delete the now-write-only `#discountRate` field and its setter, and delete the loop in `renegotiatePlanRate` that was their only caller — it collapses to the single `plan.renegotiate(newRate)` call already sitting next to it. | `refactor: remove the customer's own copy of discountRate` |

Steps 2 and 3 are separate on purpose: step 2 changes what a *read* means; step 3 removes
the ability to *write* the field a second way. Splitting them means a broken test after
step 2 points at the read path, not at both at once.

---

Where it lands:

```ts
export class Customer {
  readonly id: string;
  readonly name: string;
  readonly plan: ContractPlan;

  constructor(id: string, name: string, plan: ContractPlan) {
    this.id = id;
    this.name = name;
    this.plan = plan;
  }

  get discountRate(): number {
    return this.plan.discountRate;
  }
}
```

```ts
export function renegotiatePlanRate(
  customers: readonly Customer[],
  planId: string,
  newRate: number,
): void {
  const plan = customers.find((customer) => customer.plan.id === planId)?.plan;
  plan?.renegotiate(newRate);
}
```

`invoice.ts` — the one file that reads `customer.discountRate` for a living — is byte-for-
byte identical before and after this whole drill. That is the point: the field moved, the
call site did not.
