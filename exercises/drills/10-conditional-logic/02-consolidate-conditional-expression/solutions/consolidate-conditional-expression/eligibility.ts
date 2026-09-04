import type { OnCallLog, Patient } from "./patient";

const URGENT_TRIAGE_SCORE = 4;
const INFANT_AGE_MONTHS = 24;

export function isEligibleForSameDaySlot(patient: Patient, log: OnCallLog): boolean {
  // Paging happens whenever the patient is flagged, whether or not they already
  // qualify below - it is not part of the eligibility question, so it is not part
  // of the || chain that answers it. See drill-10-02's WALKTHROUGH.md, step 2.
  const nursePaged = pageOnCallNurseIfFlagged(patient, log);
  return isPriorityCase(patient) || nursePaged;
}

function isPriorityCase(patient: Patient): boolean {
  return (
    patient.triageScore >= URGENT_TRIAGE_SCORE ||
    patient.ageMonths < INFANT_AGE_MONTHS ||
    patient.hasChronicCondition
  );
}

function pageOnCallNurseIfFlagged(patient: Patient, log: OnCallLog): boolean {
  if (!patient.flaggedForNurseReview) return false;
  log.pagesSent += 1;
  return true;
}
