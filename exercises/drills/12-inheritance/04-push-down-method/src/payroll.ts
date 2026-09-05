import type { Tutor } from "./tutor";

export interface PayrollLine {
  readonly name: string;
  readonly hours: number;
}

/** One payroll line per staff tutor. Freelance tutors are invoiced, never on this report. */
export function weeklyPayrollReport(tutors: readonly Tutor[]): readonly PayrollLine[] {
  return tutors
    .filter((tutor) => tutor.kind === "staff")
    .map((tutor) => ({ name: tutor.name, hours: tutor.weeklyPayrollHours() }));
}
