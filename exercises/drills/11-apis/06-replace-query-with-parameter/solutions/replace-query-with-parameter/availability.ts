import type { Show } from "./box-office";

/** Whether a section still has anything to offer once `reservedSeatCount` is set aside. */
export function sectionHasAvailability(
  show: Show,
  section: string,
  reservedSeatCount: number,
): boolean {
  return openSeatCount(show, section) > reservedSeatCount;
}

function openSeatCount(show: Show, section: string): number {
  return show.seats.filter((seat) => seat.section === section && seat.status === "open")
    .length;
}
