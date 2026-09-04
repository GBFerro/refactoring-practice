import type { Patient } from "./patient";

/** The name shown on the waiting-room board. */
export function boardDisplayName(patient: Patient): string {
  if (patient.id === "unknown") return "Unidentified Patient";
  return patient.name;
}

/** The number front desk calls to reach this patient about their visit. */
export function contactPhoneLine(patient: Patient): string {
  if (patient.id === "unknown") return "No contact on file";
  return patient.phone;
}

/** What billing prints under "insurance" on the visit summary. */
export function insuranceLabel(patient: Patient): string {
  if (patient.id === "unknown") return "Pending identification";
  return patient.insuranceProvider ?? "Self-pay";
}

/** The date of birth line shown on the chart cover sheet. */
export function dateOfBirthLine(patient: Patient): string {
  if (patient.id === "unknown") return "DOB unknown";
  return patient.dateOfBirthIso;
}

/** Who reception calls if this patient can't speak for themselves. */
export function nextOfKinLine(patient: Patient): string {
  if (patient.id === "unknown") return "Not available";
  return patient.nextOfKinPhone ?? "None on file";
}

/** Whether triage should fit this patient with an ID armband before anything else. */
export function requiresIdArmband(patient: Patient): boolean {
  return patient.id === "unknown";
}

/** Where this patient sorts on the waiting-room board. */
export function waitingRoomSortKey(patient: Patient): string {
  if (patient.id === "unknown") return "\uFFFF";
  return patient.name;
}

/** Whether this visit can go to billing at all. */
export function isBillable(patient: Patient): boolean {
  if (patient.id === "Unknown") return false;
  return true;
}

/** Whether a follow-up appointment can be booked for this patient. */
export function followUpEligible(patient: Patient): boolean {
  if (patient.id === "unknown") return false;
  return true;
}
