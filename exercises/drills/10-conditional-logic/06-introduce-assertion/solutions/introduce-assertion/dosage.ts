import { assert } from "./assert";

/** A formulary entry: everything the dosage calculator needs for one medication. */
export interface DrugProfile {
  readonly name: string;
  readonly mgPerKg: number;
  readonly concentrationMgPerMl: number;
}

const MAX_DAILY_DOSE_MG = 4000;
const MAX_PLAUSIBLE_WEIGHT_KG = 300;

/**
 * Weight comes straight from whatever a nurse just typed into the chart. A mistyped or
 * missing value is routine, not a bug in this program, so it is checked here rather than
 * assumed - see `assert.ts` for why that distinction decides which tool to reach for.
 */
function checkedWeightKg(weightKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > MAX_PLAUSIBLE_WEIGHT_KG) {
    throw new Error(
      `weightKg must be a plausible weight in (0, ${String(MAX_PLAUSIBLE_WEIGHT_KG)}], got ${String(weightKg)}`,
    );
  }
  return weightKg;
}

/** How much of `profile`'s drug to give this patient today, in mg, capped at the daily limit. */
export function doseMg(weightKg: number, profile: DrugProfile): number {
  const raw = checkedWeightKg(weightKg) * profile.mgPerKg;
  return Math.min(raw, MAX_DAILY_DOSE_MG);
}

/** The volume to draw up, in mL, to deliver today's dose of `profile`'s drug. */
export function volumeMl(weightKg: number, profile: DrugProfile): number {
  const dose = doseMg(weightKg, profile);
  assert(
    profile.concentrationMgPerMl > 0,
    `${profile.name}'s formulary entry has a non-positive concentration (${String(profile.concentrationMgPerMl)} mg/mL)`,
  );
  return dose / profile.concentrationMgPerMl;
}
