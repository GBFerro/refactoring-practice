import { Tier } from "./tier";
import type { TierName } from "./tier";

/** A member's standing at the library: which tier they hold, and since when. */
export class Membership {
  readonly #tier: Tier;
  readonly startedOn: string;

  constructor(tierName: TierName, startedOn: string) {
    this.#tier = new Tier(tierName);
    this.startedOn = startedOn;
  }

  tier(): Tier {
    return this.#tier;
  }
}
