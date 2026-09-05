import type { InstrumentRental } from "./instrument-rental";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function rentalLine(rental: InstrumentRental): string {
  const base = `${rental.studentName} - ${rental.instrumentName} (${formatCents(rental.monthlyFeeCents)}/mo)`;
  if (rental.buyoutCreditsCents === null) return base;
  return `${base}, ${formatCents(rental.buyoutCreditsCents)} credited toward buyout`;
}

export function totalBuyoutCreditsCents(rentals: readonly InstrumentRental[]): number {
  return rentals.reduce((total, rental) => total + (rental.buyoutCreditsCents ?? 0), 0);
}
