/** Formats a whole number of cents as a dollar amount, e.g. 1500 -> "$15.00". */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
