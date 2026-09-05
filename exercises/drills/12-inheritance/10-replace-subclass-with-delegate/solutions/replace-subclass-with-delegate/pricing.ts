import { termLengthPlan } from "./term-length-plan";
import { TermPricing } from "./term-pricing";
import type { TermPricingRequest } from "./types";

/** Price a term for one student, given how long it runs and what they're billed under. */
export function priceTerm(request: TermPricingRequest): TermPricing {
  return new TermPricing(termLengthPlan(request.length), request.category);
}
