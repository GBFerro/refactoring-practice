import { Appointment } from "./appointment";

export class VaccinationAppointment extends Appointment {
  durationMinutes(): number {
    return 10;
  }

  feeCents(insured: boolean): number {
    return insured ? 0 : 4500;
  }

  prepInstructions(): string {
    return "Bring your vaccination card.";
  }
}
