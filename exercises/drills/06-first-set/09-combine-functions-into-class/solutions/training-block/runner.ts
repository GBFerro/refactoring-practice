/** A club member training toward a race, as the coach's spreadsheet keeps them. */
export interface Runner {
  readonly name: string;
  /** The runner's own comfortable weekly volume, in kilometres, before any plan scaling. */
  readonly weeklyBaseKm: number;
  /** A recent time-trial pace, in seconds per kilometre - the anchor every target pace offsets from. */
  readonly thresholdPaceSecondsPerKm: number;
}
