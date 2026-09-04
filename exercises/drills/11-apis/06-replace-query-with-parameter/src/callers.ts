import type { Show } from "./box-office";
import { sectionHasAvailability, setReservedSeatCount } from "./availability";

const PUBLIC_STAFF_HOLD = 2;
const NO_STAFF_HOLD = 0;

/** What the public booking page shows: honors the seats held back for staff and comps. */
export function publicSectionHasAvailability(show: Show, section: string): boolean {
  setReservedSeatCount(PUBLIC_STAFF_HOLD);
  return sectionHasAvailability(show, section);
}

/** What the internal box-office screen shows: staff can book into the held-back seats. */
export function staffSectionHasAvailability(show: Show, section: string): boolean {
  setReservedSeatCount(NO_STAFF_HOLD);
  return sectionHasAvailability(show, section);
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
  setReservedSeatCount(PUBLIC_STAFF_HOLD);
  const publicAvailability = sectionHasAvailability(show, section);
  setReservedSeatCount(NO_STAFF_HOLD);
  const staffAvailability = sectionHasAvailability(show, section);
  return { publicAvailability, staffAvailability };
}
