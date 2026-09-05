import type { Lesson } from "./lesson";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** One printable line for an invoice: what the lesson was, then what it costs. */
export function invoiceLine(lesson: Lesson): string {
  return `${lesson.invoiceDescription()}: ${formatCents(lesson.billingAmountCents())}`;
}

/** The total a term's worth (or any batch) of lessons comes to, in cents. */
export function totalBillingCents(lessons: readonly Lesson[]): number {
  return lessons.reduce((sum, lesson) => sum + lesson.billingAmountCents(), 0);
}
