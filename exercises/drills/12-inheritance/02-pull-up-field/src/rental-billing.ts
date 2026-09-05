import type { StringInstrument } from "./string-instrument";
import type { WindInstrument } from "./wind-instrument";

/** Billed monthly, as a share of what the instrument is insured for. */
const INSURANCE_RATE = 0.004;

export type RentedInstrument = WindInstrument | StringInstrument;

export function monthlyInsurancePremiumCents(instrument: RentedInstrument): number {
  return Math.round(instrument.insuredValueCents * INSURANCE_RATE);
}

export function totalMonthlyInsurancePremiumCents(
  instruments: readonly RentedInstrument[],
): number {
  return instruments.reduce(
    (total, instrument) => total + monthlyInsurancePremiumCents(instrument),
    0,
  );
}
