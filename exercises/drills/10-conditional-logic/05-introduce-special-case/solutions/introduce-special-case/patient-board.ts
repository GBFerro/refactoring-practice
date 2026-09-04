import type { Patient } from "./patient";

/** The name shown on the waiting-room board. */
export function boardDisplayName(patient: Patient): string {
  return patient.displayName;
}

/** The number front desk calls to reach this patient about their visit. */
export function contactPhoneLine(patient: Patient): string {
  return patient.contactPhoneLine;
}

/** What billing prints under "insurance" on the visit summary. */
export function insuranceLabel(patient: Patient): string {
  return patient.insuranceLabel;
}

/** The date of birth line shown on the chart cover sheet. */
export function dateOfBirthLine(patient: Patient): string {
  return patient.dateOfBirthLine;
}

/** Who reception calls if this patient can't speak for themselves. */
export function nextOfKinLine(patient: Patient): string {
  return patient.nextOfKinLine;
}

/** Whether triage should fit this patient with an ID armband before anything else. */
export function requiresIdArmband(patient: Patient): boolean {
  return patient.requiresIdArmband;
}

/** Where this patient sorts on the waiting-room board. */
export function waitingRoomSortKey(patient: Patient): string {
  return patient.waitingRoomSortKey;
}

/** Whether this visit can go to billing at all. */
export function isBillable(patient: Patient): boolean {
  return patient.isBillable;
}

/** Whether a follow-up appointment can be booked for this patient. */
export function followUpEligible(patient: Patient): boolean {
  return patient.followUpEligible;
}
