import type { Shift, StaffMember } from "./staff";

/** Minutes an hourly shift can run before overtime kicks in - an eight-hour day. */
const OVERTIME_THRESHOLD_MINUTES = 480;
const OVERTIME_MULTIPLIER = 1.5;

/**
 * What Fernbank Clinic owes a staff member for one shift, in cents.
 *
 * Three preconditions have to hold before any money is owed at all - none of them are
 * part of deciding *how much*, they only decide *whether*. Once they hold, exactly one
 * question remains: salaried staff draw a flat day rate, hourly staff draw their rate
 * times the minutes worked, with a premium past the overtime threshold. Both answers to
 * that question are equally normal; neither is a reason to stop early.
 */
export function staffPayoutCents(staff: StaffMember, shift: Shift): number {
  if (!staff.active) return 0;
  if (shift.status !== "completed") return 0;
  if (shift.payoutIssued) return 0;

  if (staff.employmentType === "salaried") {
    return staff.dailyRateCents;
  }
  return hourlyPayoutCents(staff.hourlyRateCents, shift.durationMinutes);
}

function hourlyPayoutCents(hourlyRateCents: number, durationMinutes: number): number {
  const regularMinutes = Math.min(durationMinutes, OVERTIME_THRESHOLD_MINUTES);
  const overtimeMinutes = Math.max(durationMinutes - OVERTIME_THRESHOLD_MINUTES, 0);
  const regularCents = (hourlyRateCents / 60) * regularMinutes;
  const overtimeCents = (hourlyRateCents / 60) * OVERTIME_MULTIPLIER * overtimeMinutes;
  return Math.round(regularCents + overtimeCents);
}
