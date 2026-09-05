import { IntensiveTermPricing } from "./intensive-term-pricing";
import { StandardTermPricing } from "./standard-term-pricing";
import type { TermPricing } from "./term-pricing";
import type { TermPricingRequest } from "./types";

/** Price a term for one student, given how long it runs and what they're billed under. */
export function priceTerm(request: TermPricingRequest): TermPricing {
  return request.length === "standard"
    ? new StandardTermPricing(request.category)
    : new IntensiveTermPricing(request.category);
}
