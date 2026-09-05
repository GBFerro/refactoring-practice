import { TermPricing } from "./term-pricing";

const SESSIONS_PER_TERM = 10;
const RATE_PER_SESSION_CENTS = 4499;

export class StandardTermPricing extends TermPricing {
  sessionsPerTerm(): number {
    return SESSIONS_PER_TERM;
  }

  protected ratePerSessionCents(): number {
    return RATE_PER_SESSION_CENTS;
  }

  protected categoryDiscountCents(grossCents: number): number {
    switch (this.category) {
      case "adult":
        return 0;
      case "child":
        return 3000;
      case "concession":
        return Math.round(grossCents * 0.15);
    }
  }
}
