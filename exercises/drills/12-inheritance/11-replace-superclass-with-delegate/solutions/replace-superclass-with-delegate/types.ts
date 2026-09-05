/** A lesson that has taken place, kept for record-keeping once it is over. */
export interface Lesson {
  readonly id: string;
  readonly student: string;
  readonly completedOn: string;
}
