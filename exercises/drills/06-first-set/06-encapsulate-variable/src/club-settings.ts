export interface SeasonConfig {
  readonly duesCents: number;
  readonly lateFeeRatePercent: number;
  readonly capacity: number;
}

export interface ClubSettings {
  duesCents: number;
  lateFeeRatePercent: number;
  capacity: number;
  memberCount: number;
  registrationOpen: boolean;
}

export const settings: ClubSettings = {
  duesCents: 4500,
  lateFeeRatePercent: 5,
  capacity: 120,
  memberCount: 0,
  registrationOpen: true,
};
