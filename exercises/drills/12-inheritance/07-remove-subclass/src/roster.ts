import type { Student } from "./student";

const NAME_WIDTH = 24;
const INSTRUMENT_WIDTH = 12;
const KIND_WIDTH = 7;

/** A term's enrolment sheet: one line per student, then totals. */
export function renderTermRoster(students: readonly Student[]): string[] {
  if (students.length === 0) return ["No students enrolled this term."];
  return [
    ...students.map(renderStudentLine),
    `Total: ${formatCents(totalFeeCents(students))}`,
    `Trial: ${String(trialCount(students))} of ${String(students.length)}`,
  ];
}

function renderStudentLine(student: Student): string {
  const columns = [
    student.name().padEnd(NAME_WIDTH),
    student.instrument().padEnd(INSTRUMENT_WIDTH),
    student.kindLabel().padEnd(KIND_WIDTH),
    formatCents(student.termFeeCents()),
  ];
  return columns.join(" ").trimEnd();
}

function totalFeeCents(students: readonly Student[]): number {
  return students.reduce((sum, student) => sum + student.termFeeCents(), 0);
}

function trialCount(students: readonly Student[]): number {
  return students.filter((student) => student.kindLabel() === "Trial").length;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
