/** The minimum age at which the club treats a runner as an adult for consent purposes. */
const CONSENT_AGE = 18;

export interface Runner {
  readonly age: number;
  readonly isSuspended: boolean;
  readonly hasGuardianConsent: boolean;
  readonly hasClubLicense: boolean;
  /** Fastest recorded time for the course's distance, in whole seconds, or null. */
  readonly personalBestSeconds: number | null;
}

export interface Course {
  readonly name: string;
  readonly minAge: number;
  readonly requiresLicense: boolean;
  /** The corral cutoff, in whole seconds, or null when the course is open entry. */
  readonly qualifyingSeconds: number | null;
}

export function isEligible(runner: Runner, course: Course): boolean {
  return (
    !runner.isSuspended &&
    runner.age >= course.minAge &&
    hasRequiredConsent(runner) &&
    meetsLicenseRequirement(runner, course) &&
    meetsQualifyingTime(runner, course)
  );
}

function hasRequiredConsent(runner: Runner): boolean {
  return runner.age >= CONSENT_AGE || runner.hasGuardianConsent;
}

function meetsLicenseRequirement(runner: Runner, course: Course): boolean {
  return !course.requiresLicense || runner.hasClubLicense;
}

function meetsQualifyingTime(runner: Runner, course: Course): boolean {
  if (course.qualifyingSeconds === null) return true;
  return (
    runner.personalBestSeconds !== null &&
    runner.personalBestSeconds <= course.qualifyingSeconds
  );
}
