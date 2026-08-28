import { settings } from "./club-settings";

export function spotsRemaining(): number {
  return settings.capacity - settings.memberCount;
}

export function isRegistrationOpen(): boolean {
  return settings.registrationOpen;
}
