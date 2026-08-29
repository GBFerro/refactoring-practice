import type { Loan } from "./loan";
import { daysLate } from "./loan";
import { chargeableDays, fineCents, fineWasCapped } from "./fine";
import { formatCents } from "./format";

/** The one line shown for a loan on the billing job's printed run. */
export function overdueNotice(loan: Loan, today: string): string {
  const late = daysLate(loan, today);
  if (late <= 0) {
    return "Not overdue.";
  }

  const chargeable = chargeableDays(loan, today);
  if (chargeable === 0) {
    return `${String(late)} day(s) overdue, within the grace period - no fine.`;
  }

  const capNote = fineWasCapped(loan, today) ? " (capped)" : "";
  return `${String(late)} day(s) overdue (${String(chargeable)} chargeable) - fine ${formatCents(fineCents(loan, today))}${capNote}.`;
}
