export interface SeasonConfig {
  readonly duesCents: number;
  readonly lateFeeRatePercent: number;
  readonly capacity: number;
}

interface ClubSettings {
  duesCents: number;
  lateFeeRatePercent: number;
  capacity: number;
  memberCount: number;
  registrationOpen: boolean;
}

let settings: ClubSettings = {
  duesCents: 4500,
  lateFeeRatePercent: 5,
  capacity: 120,
  memberCount: 0,
  registrationOpen: true,
};

export function currentDuesCents(): number {
  return settings.duesCents;
}

export function currentLateFeeRatePercent(): number {
  return settings.lateFeeRatePercent;
}

export function remainingCapacity(): number {
  return settings.capacity - settings.memberCount;
}

export function registrationIsOpen(): boolean {
  return settings.registrationOpen;
}

export function admitOneMember(): void {
  settings.memberCount = settings.memberCount + 1;
}

export function configureSeason(config: SeasonConfig): void {
  settings.duesCents = config.duesCents;
  settings.lateFeeRatePercent = config.lateFeeRatePercent;
  settings.capacity = config.capacity;
  settings.memberCount = 0;
  settings.registrationOpen = true;
}

export function closeSeasonRegistration(): void {
  settings.registrationOpen = false;
}

export function raiseDuesBy(cents: number): void {
  settings.duesCents = settings.duesCents + cents;
}
