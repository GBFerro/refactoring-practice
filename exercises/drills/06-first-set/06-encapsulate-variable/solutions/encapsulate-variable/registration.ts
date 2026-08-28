import { admitOneMember, registrationIsOpen, remainingCapacity } from "./club-settings";

export interface Applicant {
  readonly name: string;
}

export type EntryDecision =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly reason: string };

export function decideEntry(applicant: Applicant): EntryDecision {
  if (!registrationIsOpen()) {
    return { accepted: false, reason: `registration is closed for ${applicant.name}` };
  }
  if (remainingCapacity() <= 0) {
    return { accepted: false, reason: `the club is full for ${applicant.name}` };
  }
  admitOneMember();
  return { accepted: true };
}
