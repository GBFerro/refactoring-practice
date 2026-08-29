# Steps — small queries, not long-lived temps

The route, in the order that keeps every step small and the suite green throughout. Terse
on purpose: keep this open in a split pane while you work. The reasoning behind each move —
and the cost this trade actually has — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a temp is assigned once near the top of a function and read again
much further down, so nothing can be extracted around it without also relocating the temp.
Cheap, pure, deterministic values in that shape have one correct move, which is why this
is a drill.

**What it costs:** the four values `overdueNotice` used to compute once now get recomputed
— up to four times each — every time it runs. Fine for date arithmetic on one loan; the
wrong trade the day any of it gets expensive or the answer needs to hold still mid-call.
See `WALKTHROUGH.md` for when that line actually gets crossed.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-04     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract `formatCents` from the inline template arithmetic | `refactor: extract formatCents` |
| 2 | Extract `daysLate`; replace the `effectiveDate`/`late` temps with calls to it | `refactor: replace late temp with daysLate query` |
| 3 | Extract `chargeableDays`; replace the `chargeable` temp | `refactor: replace chargeable temp with chargeableDays query` |
| 4 | Extract `rawFineCents` (private), folding in the daily-rate lookup; delete `dailyRateCents` and `rawFineCents` | `refactor: replace rawFineCents temp with a query` |
| 5 | Extract `fineCents`; replace the `fineCents` temp with a call at the point of use | `refactor: replace fineCents temp with fineCents query` |
| 6 | Extract `fineWasCapped`; replace the `wasCapped` temp | `refactor: replace wasCapped temp with fineWasCapped query` |
| 7 | Split into `loan.ts`, `fine.ts`, `format.ts`, `overdue-notice.ts` | `refactor: split queries into their own modules` |

Steps 2 through 6 go leaves-first, same as `drill-06-01`: each query only depends on the
ones already extracted, so no step has to look ahead at code that does not exist yet.

---

Where it lands:

```ts
export function overdueNotice(loan: Loan, today: string): string {
  const late = daysLate(loan, today);
  if (late <= 0) return "Not overdue.";
  const chargeable = chargeableDays(loan, today);
  if (chargeable === 0) return `${late} day(s) overdue, within the grace period - no fine.`;
  const capNote = fineWasCapped(loan, today) ? " (capped)" : "";
  return `${late} day(s) overdue (${chargeable} chargeable) - fine ${formatCents(fineCents(loan, today))}${capNote}.`;
}
```

Four queries, each taking `(loan, today)` and computing its own answer from scratch. No
variable in this function outlives the few lines it is used in.
