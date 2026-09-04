import { Appointment } from "./appointment";

export class BloodDrawAppointment extends Appointment {
  durationMinutes(): number {
    return 15;
  }

  feeCents(insured: boolean): number {
    return insured ? 1500 : 6000;
  }

  prepInstructions(): string {
    return "Fast for 8 hours before your appointment.";
  }
}
