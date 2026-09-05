import { Student } from "./student";
import { TrialStudent } from "./trial-student";
import type { EnrolmentInput } from "./types";

export function enrolStudent(input: EnrolmentInput): Student {
  return input.trial ? new TrialStudent(input) : new Student(input);
}
