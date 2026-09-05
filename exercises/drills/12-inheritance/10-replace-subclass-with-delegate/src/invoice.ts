import type { TermPricing } from "./term-pricing";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** One printable line: how many sessions, then what the term costs. */
export function invoiceLine(studentName: string, pricing: TermPricing): string {
  const sessions = String(pricing.sessionsPerTerm());
  return `${studentName}: ${sessions} sessions, ${formatCents(pricing.termFeeCents())}`;
}

/** The total a batch of priced terms comes to, in cents. */
export function totalFeeCents(pricings: readonly TermPricing[]): number {
  return pricings.reduce((sum, pricing) => sum + pricing.termFeeCents(), 0);
}
