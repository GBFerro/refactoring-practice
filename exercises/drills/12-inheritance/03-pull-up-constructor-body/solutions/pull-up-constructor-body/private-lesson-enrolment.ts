import { Enrolment } from "./enrolment";

const SESSIONS_PER_TERM = 10;
const RATE_CENTS_PER_SESSION = 4500;

/** One student's private, one-on-one lessons with a named tutor, for one term. */
export class PrivateLessonEnrolment extends Enrolment {
  readonly instrumentTutor: string;

  constructor(studentName: string, enrolledOn: string, instrumentTutor: string) {
    super(studentName, enrolledOn, SESSIONS_PER_TERM * RATE_CENTS_PER_SESSION);
    this.instrumentTutor = instrumentTutor;
  }

  describe(): string {
    return `${this.studentName} — private lessons with ${this.instrumentTutor}`;
  }
}
