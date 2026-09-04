import type { Appointment, Tariff } from "./appointment";

export function appointmentChargeCents(appt: Appointment, tariff: Tariff): number {
  let rawCents: number;
  if (
    appt.startMinute < 480 ||
    appt.startMinute + appt.durationMinutes > 1080 ||
    appt.isWeekend ||
    appt.isPublicHoliday
  ) {
    rawCents =
      tariff.baseFeeCents * tariff.outOfHoursMultiplier + tariff.outOfHoursSurchargeCents;
  } else {
    rawCents = tariff.baseFeeCents * tariff.gstMultiplier;
  }
  return Math.round(rawCents);
}
