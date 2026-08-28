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
    passesSuspensionCheck(runner) &&
    passesAgeCheck(runner, course) &&
    passesConsentCheck(runner) &&
    passesLicenseCheck(runner, course) &&
    passesQualifyingCheck(runner, course)
  );
}

function isSuspended(runner: Runner): boolean {
  return runner.isSuspended;
}

function passesSuspensionCheck(runner: Runner): boolean {
  return !isSuspended(runner);
}

function getRunnerAge(runner: Runner): number {
  return runner.age;
}

function getCourseMinAge(course: Course): number {
  return course.minAge;
}

function meetsAgeRequirement(runner: Runner, course: Course): boolean {
  return getRunnerAge(runner) >= getCourseMinAge(course);
}

function passesAgeCheck(runner: Runner, course: Course): boolean {
  return meetsAgeRequirement(runner, course);
}

function isMinor(runner: Runner): boolean {
  return getRunnerAge(runner) < CONSENT_AGE;
}

function hasGuardianConsent(runner: Runner): boolean {
  return runner.hasGuardianConsent;
}

function passesConsentCheck(runner: Runner): boolean {
  return !isMinor(runner) || hasGuardianConsent(runner);
}

function courseRequiresLicense(course: Course): boolean {
  return course.requiresLicense;
}

function hasClubLicense(runner: Runner): boolean {
  return runner.hasClubLicense;
}

function passesLicenseCheck(runner: Runner, course: Course): boolean {
  return !courseRequiresLicense(course) || hasClubLicense(runner);
}

function getQualifyingSeconds(course: Course): number | null {
  return course.qualifyingSeconds;
}

function courseHasQualifyingTime(course: Course): boolean {
  return getQualifyingSeconds(course) !== null;
}

function getPersonalBest(runner: Runner): number | null {
  return runner.personalBestSeconds;
}

function beatsQualifyingTime(runner: Runner, course: Course): boolean {
  const personalBest = getPersonalBest(runner);
  const qualifyingSeconds = getQualifyingSeconds(course);
  return (
    personalBest !== null &&
    qualifyingSeconds !== null &&
    personalBest <= qualifyingSeconds
  );
}

function passesQualifyingCheck(runner: Runner, course: Course): boolean {
  return !courseHasQualifyingTime(course) || beatsQualifyingTime(runner, course);
}
