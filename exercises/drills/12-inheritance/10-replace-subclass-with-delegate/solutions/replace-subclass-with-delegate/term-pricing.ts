import type { TermLengthPlan } from "./term-length-plan";
import type { StudentCategory } from "./types";

/** What one student's term comes to: a length plan's sessions, minus their category's cut. */
export class TermPricing {
  readonly #plan: TermLengthPlan;
  readonly #category: StudentCategory;

  constructor(plan: TermLengthPlan, category: StudentCategory) {
    this.#plan = plan;
    this.#category = category;
  }

  sessionsPerTerm(): number {
    return this.#plan.sessionsPerTerm;
  }

  termFeeCents(): number {
    const grossCents = this.#plan.sessionsPerTerm * this.#plan.ratePerSessionCents;
    return grossCents - this.#categoryDiscountCents(grossCents);
  }

  #categoryDiscountCents(grossCents: number): number {
    switch (this.#category) {
      case "adult":
        return 0;
      case "child":
        return 3000;
      case "concession":
        return Math.round(grossCents * 0.15);
    }
  }
}
