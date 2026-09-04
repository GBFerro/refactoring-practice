import type { Show } from "./box-office";

/** Seats held back from public sale - comps, staff, and last-minute VIP requests. */
let reservedSeatCount = 0;

/** Sets how many open seats in every section are off-limits before a check runs. */
export function setReservedSeatCount(count: number): void {
  reservedSeatCount = count;
}

/** Whether a section still has anything to offer once the current reserve is set aside. */
export function sectionHasAvailability(show: Show, section: string): boolean {
  return openSeatCount(show, section) > reservedSeatCount;
}

function openSeatCount(show: Show, section: string): number {
  return show.seats.filter((seat) => seat.section === section && seat.status === "open")
    .length;
}
