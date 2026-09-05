import type { TermLength } from "./types";

/** The two numbers a term length fixes: how many sessions, and what each one costs. */
export interface TermLengthPlan {
  readonly sessionsPerTerm: number;
  readonly ratePerSessionCents: number;
}

export const STANDARD_TERM: TermLengthPlan = {
  sessionsPerTerm: 10,
  ratePerSessionCents: 4499,
};

export const INTENSIVE_TERM: TermLengthPlan = {
  sessionsPerTerm: 4,
  ratePerSessionCents: 9000,
};

export function termLengthPlan(length: TermLength): TermLengthPlan {
  return length === "standard" ? STANDARD_TERM : INTENSIVE_TERM;
}
