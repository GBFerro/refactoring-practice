import { registrationIsOpen, remainingCapacity } from "./club-settings";

export function spotsRemaining(): number {
  return remainingCapacity();
}

export function isRegistrationOpen(): boolean {
  return registrationIsOpen();
}
