import type { OnCallLog, Patient } from "./patient";

export function isEligibleForSameDaySlot(patient: Patient, log: OnCallLog): boolean {
  let eligible = false;
  if (patient.triageScore >= 4) {
    eligible = true;
  }
  if (patient.ageMonths < 24) {
    eligible = true;
  }
  if (patient.hasChronicCondition) {
    eligible = true;
  }
  if (patient.flaggedForNurseReview) {
    log.pagesSent += 1;
    eligible = true;
  }
  return eligible;
}
