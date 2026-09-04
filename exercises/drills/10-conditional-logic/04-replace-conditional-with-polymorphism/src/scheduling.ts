import type { AppointmentType } from "./types";

/**
 * How long to block the calendar for one appointment, in minutes. The booking screen
 * calls this the moment a patient picks an appointment type, before a time slot is even
 * shown, so it has to know every type's slot length up front.
 */
export function appointmentDurationMinutes(type: AppointmentType): number {
  switch (type) {
    case "checkup":
      return 20;
    case "vaccination":
      return 10;
    case "bloodDraw":
      return 15;
  }
}
