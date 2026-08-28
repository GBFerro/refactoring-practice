import { settings } from "./club-settings";

export interface Applicant {
  readonly name: string;
}

export type EntryDecision =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly reason: string };

export function decideEntry(applicant: Applicant): EntryDecision {
  if (!settings.registrationOpen) {
    return { accepted: false, reason: `registration is closed for ${applicant.name}` };
  }
  if (settings.capacity - settings.memberCount <= 0) {
    return { accepted: false, reason: `the club is full for ${applicant.name}` };
  }
  settings.memberCount = settings.memberCount + 1;
  return { accepted: true };
}
