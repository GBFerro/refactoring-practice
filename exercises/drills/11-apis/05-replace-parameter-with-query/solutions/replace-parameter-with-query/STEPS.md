# Steps — one `Date` in, no day-count ceremony

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost of it — is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a function takes a parameter that every caller derives from data
the function could reach on its own — here, a day count every caller computes from a
booking's show date and the moment of cancellation, the same way, every time. Not when a
caller has a legitimate reason to hand in a value the calendar wouldn't produce — see
[drill-11-06](../../../06-replace-query-with-parameter/README.en.md) for the case that cuts
the other way.

**What it costs:** `refundAmountCents` now owns the formula for turning a booking and a
moment into a day count. A caller that wanted to pass a day count the calendar disagrees
with — a goodwill exception, a test pinning an exact boundary — has no parameter left to do
it with.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-05     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `refundAmountCentsAt(booking, cancelledAt)` next to `refundAmountCents`, computing the day count internally with `daysBetween` and delegating to the old function | `refactor: introduce refundAmountCentsAt, delegate to the day-count version` |
| 2 | Move `refundForSelfServiceCancellation` onto `refundAmountCentsAt`; drop its own `daysBetween` call | `refactor: move self-service cancellation onto refundAmountCentsAt` |
| 3 | Move `refundForSupportDeskCancellation` onto `refundAmountCentsAt` the same way | `refactor: move support-desk cancellation onto refundAmountCentsAt` |
| 4 | Move `refundForBulkCancellation` onto `refundAmountCentsAt` the same way | `refactor: move bulk cancellation onto refundAmountCentsAt` |
| 5 | Inline the old `refundAmountCents(booking, daysUntilShow)` body into `refundAmountCentsAt`, then rename it back to `refundAmountCents` — nothing calls the day-count version any more | `refactor: collapse refundAmountCentsAt into refundAmountCents` |
| 6 | Stop exporting `daysBetween` — no caller outside `refund.ts` needs a day count directly any more | `refactor: make daysBetween a private helper` |

Steps 2–4 are one caller each on purpose: each one only changes what that caller passes,
never what `refundAmountCentsAt` does with it, so a red suite after any of them points at
exactly one caller. Step 5 is the one place the function's own logic moves, and it is safe
because `refundAmountCentsAt` was already implemented as "compute the day count, then call
the old function" — collapsing the two is deleting an indirection, not changing behaviour.

---

Where it lands:

```ts
// refund.ts
export function refundAmountCents(booking: Booking, cancelledAt: Date): number {
  const daysUntilShow = daysBetween(cancelledAt, booking.showDate);
  if (daysUntilShow >= FULL_REFUND_CUTOFF_DAYS) return booking.seatPriceCents;
  if (daysUntilShow >= PARTIAL_REFUND_CUTOFF_DAYS) return Math.round(booking.seatPriceCents / 2);
  return 0;
}

function daysBetween(from: Date, to: Date): number { /* unchanged, now private */ }
```

```ts
// callers.ts
export function refundForSelfServiceCancellation(booking: Booking, cancelledAt: Date): number {
  return refundAmountCents(booking, cancelledAt);
}
```

Every caller now hands over a booking and a moment; none of them compute a day count by
hand any more, and there is nothing left that would let one drift from how the others do it.
