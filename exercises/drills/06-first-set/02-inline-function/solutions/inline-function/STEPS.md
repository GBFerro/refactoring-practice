# Steps — three rules, not seventeen functions

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and why three functions stay
while fourteen do not — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a function's body is no harder to read than its name, and
especially when several such functions form a chain that only forwards a call downward. If
the body is genuinely easier to read *because* of the name — a magic number, a non-obvious
domain rule, real branching — it does not go, no matter how short it is.

**What it costs:** the eligibility policy now lives partly as a five-line boolean chain and
partly in three helpers; a reader who wants to unit-test the suspension or age check alone
can no longer do it without exporting a function that exists only to be inlined again.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-02     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Inline `isSuspended` into `passesSuspensionCheck` | `refactor: inline isSuspended` |
| 2 | Inline `passesSuspensionCheck` into `isEligible` | `refactor: inline passesSuspensionCheck` |
| 3 | Inline `getRunnerAge` at its call site in `meetsAgeRequirement` (its other call site waits) | `refactor: inline getRunnerAge in meetsAgeRequirement` |
| 4 | Inline `getCourseMinAge` into `meetsAgeRequirement` | `refactor: inline getCourseMinAge` |
| 5 | Inline `passesAgeCheck` into `isEligible`, calling `meetsAgeRequirement` directly | `refactor: inline passesAgeCheck` |
| 6 | Inline `meetsAgeRequirement` into `isEligible` | `refactor: inline meetsAgeRequirement` |
| 7 | Inline `hasGuardianConsent` into `passesConsentCheck` | `refactor: inline hasGuardianConsent` |
| 8 | Inline `getRunnerAge`'s remaining call site, inside `isMinor`; delete `getRunnerAge` | `refactor: inline getRunnerAge in isMinor` |
| 9 | Inline `isMinor` into `passesConsentCheck`; flip the negated comparison to its affirmative form; rename to `hasRequiredConsent` | `refactor: inline isMinor and rename to hasRequiredConsent` |
| 10 | Inline `courseRequiresLicense` and `hasClubLicense` into `passesLicenseCheck`; rename to `meetsLicenseRequirement` | `refactor: inline license field wrappers` |
| 11 | Inline `getQualifyingSeconds`'s call site inside `courseHasQualifyingTime` | `refactor: inline getQualifyingSeconds in courseHasQualifyingTime` |
| 12 | Inline `getPersonalBest` and `getQualifyingSeconds`'s remaining call site into `beatsQualifyingTime` | `refactor: inline personal-best and qualifying-time field wrappers` |
| 13 | Inline `courseHasQualifyingTime` and `beatsQualifyingTime` into `passesQualifyingCheck`, reshaping the OR into a guard clause; rename to `meetsQualifyingTime` | `refactor: inline into meetsQualifyingTime` |
| 14 | Read what is left | — |

Steps 3+8 and 11+12 are each one function inlined in two visits, because `getRunnerAge` and
`getQualifyingSeconds` each have two call sites. Inline at one call site, leave the
declaration standing while the other call site still needs it, and only delete the function
once every call site is gone — deleting early is a compile error waiting to happen, not a
behaviour change, but it will stop you mid-step.

---

Where it lands:

```ts
export function isEligible(runner: Runner, course: Course): boolean {
  return (
    !runner.isSuspended &&
    runner.age >= course.minAge &&
    hasRequiredConsent(runner) &&
    meetsLicenseRequirement(runner, course) &&
    meetsQualifyingTime(runner, course)
  );
}
```

Two conditions inlined flat, three still named. Which two and which three is the entire
judgement this drill is for.
