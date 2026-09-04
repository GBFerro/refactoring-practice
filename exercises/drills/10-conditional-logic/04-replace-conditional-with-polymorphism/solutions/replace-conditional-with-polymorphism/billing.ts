import { createAppointment } from "./appointment-factory";
import type { AppointmentType } from "./types";

/** What the patient owes for one appointment, in cents. */
export function appointmentFeeCents(type: AppointmentType, insured: boolean): number {
  return createAppointment(type).feeCents(insured);
}
