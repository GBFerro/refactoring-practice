# Steps — one `TermPricing`, a plan object standing in for the subclass

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a class hierarchy already spends its one inheritance axis on
one kind of variation (here, term length), and a second, independent kind of variation
(here, student category) needs expressing too, and the only way to do that through
subclassing is to duplicate logic in every existing subclass or multiply the subclass count
by the second axis. See [`drill-12-11`](../../../11-replace-superclass-with-delegate/README.en.md)
for the sibling move — a delegate replacing a superclass instead of a subclass, for a
different reason. Read both before deciding either is the default answer.

**What it costs:** `TermPricing` takes a plan object as a constructor argument instead of
the term length being spelled out in a type name. A caller can no longer tell a standard
term from an intensive one by asking what class an object is — reading the plan's numbers,
or a label the code did not used to need, is now the only way.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-10     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Pull `categoryDiscountCents`'s switch up onto `TermPricing`, deleting both subclass overrides | `refactor: pull up categoryDiscountCents, one switch instead of two` |
| 2 | Introduce `TermLengthPlan` and the two plan constants, unused so far | `refactor: introduce TermLengthPlan value objects` |
| 3 | Give `TermPricing` a `plan` field via its constructor; make `sessionsPerTerm`/`ratePerSessionCents` concrete, reading the field | `refactor: TermPricing reads its numbers from a plan field` |
| 4 | Point each subclass's constructor at its matching plan constant; delete their now-redundant method overrides | `refactor: bind each subclass to a plan constant` |
| 5 | Inline both subclasses at their one call site in `pricing.ts`; delete the two subclass files; drop `abstract` from `TermPricing` | `refactor: replace the subclasses with plan constants at the call site` |

Step 1 is not the target refactoring — it is Pull Up Method, done first because a switch
duplicated in two places is a hazard the delegate move does not need to carry along with
it. Steps 3 and 4 are separate because step 3 alone changes nothing observable (the
subclasses still declare the same overrides, just now redundant); step 4 is the one where a
mismatched plan constant would actually change a price.

---

Where it lands:

```ts
export class TermPricing {
  constructor(
    private readonly plan: TermLengthPlan,
    private readonly category: StudentCategory,
  ) {}

  sessionsPerTerm(): number {
    return this.plan.sessionsPerTerm;
  }

  termFeeCents(): number {
    const grossCents = this.plan.sessionsPerTerm * this.plan.ratePerSessionCents;
    return grossCents - categoryDiscountCents(this.category, grossCents);
  }
}

export function priceTerm(request: TermPricingRequest): TermPricing {
  return new TermPricing(termLengthPlan(request.length), request.category);
}
```

One class, one switch, a constant standing in for what used to be a type name.
