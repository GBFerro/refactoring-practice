import { Student } from "./student";
import type { EnrolmentInput } from "./types";

export function enrolStudent(input: EnrolmentInput): Student {
  return new Student(input);
}
