/**
 * The kinds of appointment Fernbank Clinic schedules. Each one has its own slot length,
 * its own fee, and its own instructions for the patient - the three things a booking
 * needs to know before it can be confirmed.
 */
export type AppointmentType = "checkup" | "vaccination" | "bloodDraw";
