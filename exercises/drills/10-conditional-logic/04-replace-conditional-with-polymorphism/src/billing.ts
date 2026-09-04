import type { AppointmentType } from "./types";

/**
 * What the patient owes for one appointment, in cents. Insured patients pay a fixed
 * copay set per appointment type; everyone else pays Fernbank's posted rate for it.
 */
export function appointmentFeeCents(type: AppointmentType, insured: boolean): number {
  switch (type) {
    case "checkup":
      return insured ? 2000 : 12000;
    case "vaccination":
      return insured ? 0 : 4500;
    case "bloodDraw":
      return insured ? 1500 : 6000;
  }
}
