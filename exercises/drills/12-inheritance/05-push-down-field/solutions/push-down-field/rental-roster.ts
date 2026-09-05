import { InstrumentRental } from "./instrument-rental";
import { LeaseToOwnRental } from "./lease-to-own-rental";

function isLeaseToOwnRental(rental: InstrumentRental): rental is LeaseToOwnRental {
  return rental instanceof LeaseToOwnRental;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function rentalLine(rental: InstrumentRental): string {
  const base = `${rental.studentName} - ${rental.instrumentName} (${formatCents(rental.monthlyFeeCents)}/mo)`;
  if (!isLeaseToOwnRental(rental)) return base;
  return `${base}, ${formatCents(rental.buyoutCreditsCents)} credited toward buyout`;
}

export function totalBuyoutCreditsCents(rentals: readonly InstrumentRental[]): number {
  return rentals
    .filter(isLeaseToOwnRental)
    .reduce((total, rental) => total + rental.buyoutCreditsCents, 0);
}
