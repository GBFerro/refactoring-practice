/** Fernbank Clinic books appointments in minutes-since-midnight, clinic-local time. */
export interface Appointment {
  readonly startMinute: number;
  readonly durationMinutes: number;
  readonly isWeekend: boolean;
  readonly isPublicHoliday: boolean;
}

export interface Tariff {
  readonly baseFeeCents: number;
  /** Applied to the base fee during normal opening hours, e.g. 1.1 for 10% GST. */
  readonly gstMultiplier: number;
  /** Applied to the base fee instead of gstMultiplier when the visit is out of hours. */
  readonly outOfHoursMultiplier: number;
  /** Flat callout fee added on top of the multiplied base fee, out of hours only. */
  readonly outOfHoursSurchargeCents: number;
}
