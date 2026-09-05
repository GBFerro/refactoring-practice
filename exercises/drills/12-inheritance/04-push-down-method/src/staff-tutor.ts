import { Tutor, type LoggedLesson } from "./tutor";

export class StaffTutor extends Tutor {
  constructor(name: string, lessonsThisWeek: readonly LoggedLesson[]) {
    super(name, "staff", lessonsThisWeek);
  }
}
