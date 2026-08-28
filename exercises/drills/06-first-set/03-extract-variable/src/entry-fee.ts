const MS_PER_DAY = 86_400_000;

/** Club members pay 85% of the base fee. */
const MEMBER_DISCOUNT = 0.85;
/** Registering three weeks or more ahead pays 90% of the base fee. */
const EARLY_BIRD_DISCOUNT = 0.9;
const EARLY_BIRD_DAYS = 21;
/** Runners from a club other than the one hosting the race pay 115%. */
const NON_HOST_SURCHARGE = 1.15;
/** Flat concession, in cents, for runners under 18. */
const JUNIOR_ADJUSTMENT_CENTS = -1000;
/** Flat concession, in cents, for runners 60 and over. */
const SENIOR_ADJUSTMENT_CENTS = -500;
/** Governing-body registration fee, in cents. Charged in full; never discounted. */
const AFFILIATION_FEE_CENTS = 200;

export type AgeCategory = "junior" | "adult" | "senior";

export interface EntryRequest {
  readonly ageCategory: AgeCategory;
  readonly club: string;
  readonly isMember: boolean;
  /** ISO calendar date the entry form was submitted. */
  readonly registeredOn: string;
}

export interface Race {
  readonly baseFeeCents: number;
  /** ISO calendar date. */
  readonly date: string;
  readonly hostClub: string;
}

function daysBetween(from: string, to: string): number {
  return (Date.parse(to) - Date.parse(from)) / MS_PER_DAY;
}

function isEarlyBird(entry: EntryRequest, race: Race): boolean {
  return daysBetween(entry.registeredOn, race.date) >= EARLY_BIRD_DAYS;
}

function ageAdjustmentCents(category: AgeCategory): number {
  if (category === "junior") return JUNIOR_ADJUSTMENT_CENTS;
  if (category === "senior") return SENIOR_ADJUSTMENT_CENTS;
  return 0;
}

/** The entry fee in whole cents, for one runner entering one race. */
export function calculateEntryFee(entry: EntryRequest, race: Race): number {
  return Math.round(
    race.baseFeeCents *
      (entry.isMember ? MEMBER_DISCOUNT : 1) *
      (isEarlyBird(entry, race) ? EARLY_BIRD_DISCOUNT : 1) *
      (entry.club === race.hostClub ? 1 : NON_HOST_SURCHARGE) +
      ageAdjustmentCents(entry.ageCategory) +
      AFFILIATION_FEE_CENTS,
  );
}
