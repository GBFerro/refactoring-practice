import { createAppointment } from "./appointment-factory";
import type { AppointmentType } from "./types";

/** How long to block the calendar for one appointment, in minutes. */
export function appointmentDurationMinutes(type: AppointmentType): number {
  return createAppointment(type).durationMinutes();
}
