/** What the parsing phase produces: facts about one runner, not the text they came from. */
export interface ParsedRegistration {
  readonly runnerName: string;
  /** Raw distance token, upper-cased and trimmed. The parser does not know if it is real. */
  readonly distanceCode: string;
  readonly isMember: boolean;
  readonly hasEarlyBirdPromo: boolean;
}

/** What the pricing phase produces: the money owed, and the numbers that explain it. */
export interface RegistrationCharge {
  readonly runnerName: string;
  readonly baseFeeCents: number;
  readonly memberDiscountCents: number;
  readonly promoDiscountCents: number;
  readonly totalCents: number;
}
