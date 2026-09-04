import type { Appointment, Tariff } from "./appointment";

const CLINIC_OPENS_MINUTE = 8 * 60;
const CLINIC_CLOSES_MINUTE = 18 * 60;

export function appointmentChargeCents(appt: Appointment, tariff: Tariff): number {
  let rawCents: number;
  if (isOutOfHours(appt)) {
    rawCents = outOfHoursChargeCents(tariff);
  } else {
    rawCents = standardChargeCents(tariff);
  }
  return Math.round(rawCents);
}

function isOutOfHours(appt: Appointment): boolean {
  return (
    appt.startMinute < CLINIC_OPENS_MINUTE ||
    appt.startMinute + appt.durationMinutes > CLINIC_CLOSES_MINUTE ||
    appt.isWeekend ||
    appt.isPublicHoliday
  );
}

function standardChargeCents(tariff: Tariff): number {
  return tariff.baseFeeCents * tariff.gstMultiplier;
}

function outOfHoursChargeCents(tariff: Tariff): number {
  return (
    tariff.baseFeeCents * tariff.outOfHoursMultiplier + tariff.outOfHoursSurchargeCents
  );
}
