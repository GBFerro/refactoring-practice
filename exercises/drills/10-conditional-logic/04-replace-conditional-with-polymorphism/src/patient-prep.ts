import type { AppointmentType } from "./types";

/**
 * What the front desk reads out to a patient when confirming an appointment by phone -
 * anything they need to do or bring before they walk in.
 */
export function appointmentPrepInstructions(type: AppointmentType): string {
  switch (type) {
    case "checkup":
      return "No preparation needed.";
    case "vaccination":
      return "Bring your vaccination card.";
    case "bloodDraw":
      return "Fast for 8 hours before your appointment.";
  }
}
