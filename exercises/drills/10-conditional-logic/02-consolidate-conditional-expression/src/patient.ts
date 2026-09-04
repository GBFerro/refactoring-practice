/** A same-day triage snapshot for one Fernbank Clinic patient, taken at check-in. */
export interface Patient {
  readonly triageScore: number;
  readonly ageMonths: number;
  readonly hasChronicCondition: boolean;
  readonly flaggedForNurseReview: boolean;
}

/** The on-call nurse's paging tally for the day; pagesSent increments once per page. */
export interface OnCallLog {
  pagesSent: number;
}
