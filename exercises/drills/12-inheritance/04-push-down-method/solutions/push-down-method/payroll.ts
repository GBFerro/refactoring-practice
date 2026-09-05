import { StaffTutor } from "./staff-tutor";
import type { Tutor } from "./tutor";

export interface PayrollLine {
  readonly name: string;
  readonly hours: number;
}

function isStaffTutor(tutor: Tutor): tutor is StaffTutor {
  return tutor instanceof StaffTutor;
}

/** One payroll line per staff tutor. Freelance tutors are invoiced, never on this report. */
export function weeklyPayrollReport(tutors: readonly Tutor[]): readonly PayrollLine[] {
  return tutors.filter(isStaffTutor).map((tutor) => ({
    name: tutor.name,
    hours: tutor.weeklyPayrollHours(),
  }));
}
