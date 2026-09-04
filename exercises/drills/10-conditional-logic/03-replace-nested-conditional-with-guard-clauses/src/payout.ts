import type { Shift, StaffMember } from "./staff";

/** Minutes an hourly shift can run before overtime kicks in - an eight-hour day. */
const OVERTIME_THRESHOLD_MINUTES = 480;
const OVERTIME_MULTIPLIER = 1.5;

/**
 * What Fernbank Clinic owes a staff member for one shift, in cents. Nothing is owed to
 * someone who has left the clinic, for a shift that never completed, or for a shift
 * payroll already ran. Otherwise, salaried staff draw a flat day rate and hourly staff
 * draw their rate times the minutes worked, with a premium past the overtime threshold.
 */
export function staffPayoutCents(staff: StaffMember, shift: Shift): number {
  let payoutCents = 0;
  if (staff.active) {
    if (shift.status === "completed") {
      if (!shift.payoutIssued) {
        if (staff.employmentType === "salaried") {
          payoutCents = staff.dailyRateCents;
        } else {
          payoutCents = hourlyPayoutCents(staff.hourlyRateCents, shift.durationMinutes);
        }
      }
    }
  }
  return payoutCents;
}

function hourlyPayoutCents(hourlyRateCents: number, durationMinutes: number): number {
  const regularMinutes = Math.min(durationMinutes, OVERTIME_THRESHOLD_MINUTES);
  const overtimeMinutes = Math.max(durationMinutes - OVERTIME_THRESHOLD_MINUTES, 0);
  const regularCents = (hourlyRateCents / 60) * regularMinutes;
  const overtimeCents = (hourlyRateCents / 60) * OVERTIME_MULTIPLIER * overtimeMinutes;
  return Math.round(regularCents + overtimeCents);
}
