import { createAppointment } from "./appointment-factory";
import type { AppointmentType } from "./types";

/** What the front desk tells a patient to do before one appointment. */
export function appointmentPrepInstructions(type: AppointmentType): string {
  return createAppointment(type).prepInstructions();
}
