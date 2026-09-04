import type { Appointment } from "./appointment";
import { BloodDrawAppointment } from "./blood-draw-appointment";
import { CheckupAppointment } from "./checkup-appointment";
import { VaccinationAppointment } from "./vaccination-appointment";
import type { AppointmentType } from "./types";

/** The one place left in this module that switches on AppointmentType. */
export function createAppointment(type: AppointmentType): Appointment {
  switch (type) {
    case "checkup":
      return new CheckupAppointment();
    case "vaccination":
      return new VaccinationAppointment();
    case "bloodDraw":
      return new BloodDrawAppointment();
  }
}
