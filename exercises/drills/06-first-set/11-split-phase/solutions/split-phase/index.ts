import { parseRegistrationLine } from "./parse-registration";
import { priceRegistration } from "./price-registration";
import type { RegistrationCharge } from "./registration";

export type { RegistrationCharge };

export function priceRegistrationLine(raw: string): RegistrationCharge {
  return priceRegistration(parseRegistrationLine(raw));
}
