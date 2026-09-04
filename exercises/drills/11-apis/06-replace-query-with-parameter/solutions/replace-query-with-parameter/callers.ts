import type { Show } from "./box-office";
import { sectionHasAvailability } from "./availability";

const PUBLIC_STAFF_HOLD = 2;
const NO_STAFF_HOLD = 0;

/** What the public booking page shows: honors the seats held back for staff and comps. */
export function publicSectionHasAvailability(show: Show, section: string): boolean {
  return sectionHasAvailability(show, section, PUBLIC_STAFF_HOLD);
}

/** What the internal box-office screen shows: staff can book into the held-back seats. */
export function staffSectionHasAvailability(show: Show, section: string): boolean {
  return sectionHasAvailability(show, section, NO_STAFF_HOLD);
}

export interface AvailabilitySummary {
  readonly publicAvailability: boolean;
  readonly staffAvailability: boolean;
}

/** The admin dashboard's per-section row: what the public sees and what staff can still book. */
export function sectionAvailabilitySummary(
  show: Show,
  section: string,
): AvailabilitySummary {
  return {
    publicAvailability: sectionHasAvailability(show, section, PUBLIC_STAFF_HOLD),
    staffAvailability: sectionHasAvailability(show, section, NO_STAFF_HOLD),
  };
}
