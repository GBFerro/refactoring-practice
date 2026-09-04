export type EmploymentType = "salaried" | "hourly";
export type ShiftStatus = "scheduled" | "completed" | "cancelled" | "no-show";

/** A Fernbank Clinic staff member on the payout roster. */
export interface StaffMember {
  readonly id: string;
  readonly employmentType: EmploymentType;
  /** False once someone has left the clinic; past shifts stay on record but stop paying out. */
  readonly active: boolean;
  /** Only meaningful when employmentType is "hourly". */
  readonly hourlyRateCents: number;
  /** Only meaningful when employmentType is "salaried". */
  readonly dailyRateCents: number;
}

/** One worked shift, as logged by the rota system. */
export interface Shift {
  readonly staffId: string;
  readonly status: ShiftStatus;
  readonly durationMinutes: number;
  /** True once this shift's payout has already been sent to payroll. */
  readonly payoutIssued: boolean;
}
