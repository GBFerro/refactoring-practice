/** What every appointment kind has to be able to answer about itself. */
export abstract class Appointment {
  abstract durationMinutes(): number;
  abstract feeCents(insured: boolean): number;
  abstract prepInstructions(): string;
}
