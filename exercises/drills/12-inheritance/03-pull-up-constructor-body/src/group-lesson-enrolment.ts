import { Enrolment } from "./enrolment";

const SESSIONS_PER_TERM = 8;
const RATE_CENTS_PER_SESSION = 1800;

/** Several students sharing one group lesson slot, for one term. */
export class GroupLessonEnrolment extends Enrolment {
  readonly id: string;
  readonly studentName: string;
  readonly enrolledOn: string;
  readonly sessionsPerTerm: number;
  readonly ratePerSessionCents: number;
  readonly tuitionCents: number;
  readonly groupSize: number;

  constructor(studentName: string, enrolledOn: string, groupSize: number) {
    super();
    if (studentName.trim().length === 0) {
      throw new Error("Student name is required.");
    }
    this.id = `ENR-${studentName.trim().toUpperCase().replace(/\s+/gu, "-")}`;
    this.studentName = studentName;
    this.enrolledOn = enrolledOn;
    this.sessionsPerTerm = SESSIONS_PER_TERM;
    this.ratePerSessionCents = RATE_CENTS_PER_SESSION;
    this.tuitionCents = this.sessionsPerTerm * this.ratePerSessionCents;
    this.groupSize = groupSize;
  }

  describe(): string {
    return `${this.studentName} — group lessons (${this.groupSize} students)`;
  }
}
