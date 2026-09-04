/**
 * Documents an assumption the rest of this module already depends on, and stops the
 * program the instant it turns out false - before a silently wrong number reaches a
 * chart. Only ever call this for something a clinician's input could not cause; a value
 * typed in at the point of care is checked input, not an assumption, and belongs behind a
 * thrown, catchable Error instead (see `checkedWeightKg` in `dosage.ts`).
 *
 * Many teams strip calls like this one out of production bundles - see WALKTHROUGH.md for
 * what that means for what is, and is not, safe to put behind it.
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}
