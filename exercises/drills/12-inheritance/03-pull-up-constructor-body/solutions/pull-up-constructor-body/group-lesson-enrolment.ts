import { Enrolment } from "./enrolment";

const SESSIONS_PER_TERM = 8;
const RATE_CENTS_PER_SESSION = 1800;

/** Several students sharing one group lesson slot, for one term. */
export class GroupLessonEnrolment extends Enrolment {
  readonly groupSize: number;

  constructor(studentName: string, enrolledOn: string, groupSize: number) {
    super(studentName, enrolledOn, SESSIONS_PER_TERM * RATE_CENTS_PER_SESSION);
    this.groupSize = groupSize;
  }

  describe(): string {
    return `${this.studentName} — group lessons (${this.groupSize} students)`;
  }
}
