import type { StudentCategory } from "./types";

/** What every term-length pricing bills: sessions at a rate, minus the category's cut. */
export abstract class TermPricing {
  constructor(protected readonly category: StudentCategory) {}

  abstract sessionsPerTerm(): number;
  protected abstract ratePerSessionCents(): number;
  protected abstract categoryDiscountCents(grossCents: number): number;

  termFeeCents(): number {
    const grossCents = this.sessionsPerTerm() * this.ratePerSessionCents();
    return grossCents - this.categoryDiscountCents(grossCents);
  }
}
