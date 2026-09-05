import { Tutor } from "./tutor";

export class StaffTutor extends Tutor {
  /** Teaching minutes logged this week, rounded to the nearest payroll quarter-hour. */
  weeklyPayrollHours(): number {
    const minutes = this.lessonsThisWeek.reduce(
      (sum, lesson) => sum + lesson.durationMinutes,
      0,
    );
    return Math.round(minutes / 15) / 4;
  }
}
