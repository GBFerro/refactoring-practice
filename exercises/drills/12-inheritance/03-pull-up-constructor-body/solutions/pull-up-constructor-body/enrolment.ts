/** A Beckworth Music School enrolment for one student, for one term. */
export abstract class Enrolment {
  readonly id: string;
  readonly studentName: string;
  readonly enrolledOn: string;
  readonly tuitionCents: number;

  protected constructor(studentName: string, enrolledOn: string, tuitionCents: number) {
    if (studentName.trim().length === 0) {
      throw new Error("Student name is required.");
    }
    this.id = `ENR-${studentName.trim().toUpperCase().replace(/\s+/gu, "-")}`;
    this.studentName = studentName;
    this.enrolledOn = enrolledOn;
    this.tuitionCents = tuitionCents;
  }
}
