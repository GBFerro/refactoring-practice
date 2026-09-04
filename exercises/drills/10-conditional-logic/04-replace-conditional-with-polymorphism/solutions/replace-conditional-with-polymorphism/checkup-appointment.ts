import { Appointment } from "./appointment";

export class CheckupAppointment extends Appointment {
  durationMinutes(): number {
    return 20;
  }

  feeCents(insured: boolean): number {
    return insured ? 2000 : 12000;
  }

  prepInstructions(): string {
    return "No preparation needed.";
  }
}
