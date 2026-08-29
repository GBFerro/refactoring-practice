export type TierName = "standard" | "family" | "senior";

const LOAN_LIMITS: Readonly<Record<TierName, number>> = {
  standard: 5,
  family: 10,
  senior: 8,
};

/** A membership tier: the name the front desk shows, and the loan cap it carries. */
export class Tier {
  readonly #name: TierName;

  constructor(name: TierName) {
    this.#name = name;
  }

  name(): TierName {
    return this.#name;
  }

  loanLimit(): number {
    return LOAN_LIMITS[this.#name];
  }
}
