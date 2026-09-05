# Steps — buyoutCreditsCents lives on LeaseToOwnRental only

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and why it does not split
further — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a field on a shared superclass is null, zero, or simply never
read for every subclass but one, and that one subclass is the only place any of its
behaviour lives. `buyoutCreditsCents` is `null` for every `TrialRental` that has ever
existed or ever will — a trial has no purchase option — and `InstrumentRental` cannot
explain why it is carrying the field at all.

**What it costs:** the two functions that used to read `buyoutCreditsCents` off any
`InstrumentRental` with a one-line `?? 0` now narrow to `LeaseToOwnRental` first — a filter
step neither old one-liner needed — in exchange for a type that can no longer represent a
trial rental with a buyout balance. See
[`drill-12-02`](../../../02-pull-up-field/README.en.md), where a field moves the other way
because two subclasses turn out to use it identically — read both before deciding this is
always the right call.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-05     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Introduce `isLeaseToOwnRental`, a type predicate; rewrite `rentalLine` and `totalBuyoutCreditsCents` to narrow with it before reading `buyoutCreditsCents` — the field stays on `InstrumentRental`, still `number \| null`, for now | `refactor: narrow to LeaseToOwnRental before reading buyoutCreditsCents` |
| 2 | Move `buyoutCreditsCents` off `InstrumentRental` and its props, onto `LeaseToOwnRental` and its props, typed as a plain `number`; drop the `?? 0` in `remainingBuyoutCents`, now provably unreachable | `refactor: push buyoutCreditsCents down to LeaseToOwnRental` |

Step 1 is the one that could, in a larger codebase, be split further — one commit per call
site narrowed. Two call sites here did not earn separate commits. Step 2 is the one that
actually changes the type: it is safe only because step 1 already moved every reader behind
the same narrowing, so nothing is left reading the field off the base type for step 2 to
break.

---

Where it lands:

```ts
export class LeaseToOwnRental extends InstrumentRental {
  readonly purchasePriceCents: number;
  readonly buyoutCreditsCents: number;
  // ...
  remainingBuyoutCents(): number {
    return Math.max(0, this.purchasePriceCents - this.buyoutCreditsCents);
  }
}
```

```ts
function isLeaseToOwnRental(rental: InstrumentRental): rental is LeaseToOwnRental {
  return rental instanceof LeaseToOwnRental;
}
```

`TrialRental` no longer has an opinion on `buyoutCreditsCents` at all — not `null`, not
absent-by-convention, just not there.
