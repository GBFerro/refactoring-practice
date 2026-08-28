import type { ParsedRegistration } from "./registration";

const MEMBER_TOKEN = "MEMBER";
const EARLY_BIRD_TOKEN = "EARLY";

/**
 * Turns one raw desk line into facts about the runner. Knows the line's shape
 * (four `|`-separated fields) and nothing about what any of it costs.
 */
export function parseRegistrationLine(raw: string): ParsedRegistration {
  const [name = "", distance = "", membership = "", promo = ""] = raw.split("|");
  return {
    runnerName: name.trim(),
    distanceCode: distance.trim().toUpperCase(),
    isMember: membership.trim().toUpperCase() === MEMBER_TOKEN,
    hasEarlyBirdPromo: promo.trim().toUpperCase() === EARLY_BIRD_TOKEN,
  };
}
