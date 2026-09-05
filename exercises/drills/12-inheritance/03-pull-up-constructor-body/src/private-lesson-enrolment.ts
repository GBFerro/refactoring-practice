import { Enrolment } from "./enrolment";

const SESSIONS_PER_TERM = 10;
const RATE_CENTS_PER_SESSION = 4500;

/** One student's private, one-on-one lessons with a named tutor, for one term. */
export class PrivateLessonEnrolment extends Enrolment {
  readonly id: string;
  readonly studentName: string;
  readonly enrolledOn: string;
  readonly sessionsPerTerm: number;
  readonly ratePerSessionCents: number;
  readonly tuitionCents: number;
  readonly instrumentTutor: string;

  constructor(studentName: string, enrolledOn: string, instrumentTutor: string) {
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
    this.instrumentTutor = instrumentTutor;
  }

  describe(): string {
    return `${this.studentName} — private lessons with ${this.instrumentTutor}`;
  }
}
