# Walkthrough — three rules, not seventeen functions

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, which names had to earn their keep, and
where the judgement actually lives. Read it after you have your own version, not before.

---

## Before anything: this is the mirror image of drill 06-01

The Extract Function drill hands you a single seventy-line function and asks you to give
its blocks names. This drill hands you seventeen functions and asks you to take some of
those names away. The skill is the same skill — can you tell when a name is carrying
weight? — pointed in the opposite direction, and that is the whole reason this drill
exists as the very next one in the sequence.

Skim `eligibility.ts` once and count the layers under `isEligible`. There are three:

- **A "passes\*Check" layer**, five functions, each called from `isEligible` exactly once,
  each doing nothing but forwarding to the layer below.
- **A "meets\*"/"is\*"/"has\*" layer** underneath some of those, holding the actual
  comparison.
- **A field-getter layer** underneath *that* — `getRunnerAge`, `getCourseMinAge`,
  `getQualifyingSeconds`, `getPersonalBest`, `hasClubLicense`, `hasGuardianConsent`,
  `courseRequiresLicense`, `isSuspended` — eight functions whose entire body is a single
  field read.

**Lazy Element**, precisely: a function whose body tells you everything its name tells you,
and nothing more. The field getters are the purest cases — `getRunnerAge(runner)` says
"the runner's age," and so does `runner.age`, in fewer characters and one fewer place to
look. The "passes\*Check" layer is the same smell wearing a different hat: `passesAgeCheck`
forwards to `meetsAgeRequirement` and adds no information a caller didn't already have from
the name of the function it calls.

Not every layer goes. Somewhere between "field getter" and "the whole policy in one
function," three of these checks stop being simple enough to fold away for free. Finding
that boundary is the exercise.

## Why bottom-up, one rule at a time

I worked leaf-to-root, one of the five rules at a time — suspension first, then age, then
consent, then license, then qualifying time — rather than doing "delete all the field
getters everywhere" as one pass.

The reason is `getRunnerAge` and `getQualifyingSeconds`. Each has **two** call sites, in
two different rules. Try to delete either function before both call sites are handled and
`tsc` stops you — not a behaviour change, just a compile error, but one that arrives at an
inconvenient moment if you are three rules deep in an unrelated change. Working one rule at
a time means you meet each shared getter's first call site, leave the declaration standing,
and come back for the second when its rule's turn arrives. The alternative — a global
find-and-replace across all seventeen functions — works too, but it is the kind of "large,
safe-looking" step this repository's `STEPS.md` convention exists to discourage: easy to
get right, hard to bisect if a test fails partway through.

## Suspension and age: the two that vanish completely

```ts
// before
function isSuspended(runner: Runner): boolean {
  return runner.isSuspended;
}
function passesSuspensionCheck(runner: Runner): boolean {
  return !isSuspended(runner);
}
// isEligible calls: passesSuspensionCheck(runner)

// after
// isEligible calls: !runner.isSuspended
```

Two inlines, two deletions, nothing survives. `isSuspended` was a field alias; once it is
gone, `passesSuspensionCheck` is just `!runner.isSuspended` with a name in front of it, and
that expression is exactly as clear inline as it was named. There is no magic number, no
double negative worth naming, no branch. It goes.

Age is the same shape, one layer deeper:

```ts
// before
function getRunnerAge(r: Runner) { return r.age; }
function getCourseMinAge(c: Course) { return c.minAge; }
function meetsAgeRequirement(r: Runner, c: Course) {
  return getRunnerAge(r) >= getCourseMinAge(c);
}
function passesAgeCheck(r: Runner, c: Course) {
  return meetsAgeRequirement(r, c);
}
// after
// isEligible calls: runner.age >= course.minAge
```

Four functions, one expression. `passesAgeCheck` is the most extreme case in the whole
file — it does not even rename anything, it just forwards `meetsAgeRequirement`'s result
under a second name. Once the getters are gone, `meetsAgeRequirement`'s body is
`runner.age >= course.minAge`: a direct comparison between two fields with unambiguous
names. Nothing about wrapping it in a function called `meetsAgeRequirement` tells a reader
more than the comparison itself does — the comparison *is* the requirement.

**On the name.** I considered keeping `meetsAgeRequirement` for symmetry with the three
survivors below. I rejected it on question 1 from
[`NAMING.md`](../../../../../docs/NAMING.md): does the name say *what*, or does it just
restate *how*? `meetsAgeRequirement` restates the comparison one level up; it does not
explain a threshold, a policy, or an edge case the way the three survivors do. A name that
adds nothing beyond "this is a comparison" is not worth the extra frame.

## Consent: where a comparison earns a name

```ts
// before (after getters are inlined into isMinor)
function isMinor(runner: Runner): boolean {
  return runner.age < CONSENT_AGE;
}
function passesConsentCheck(runner: Runner): boolean {
  return !isMinor(runner) || runner.hasGuardianConsent;
}
// after
function hasRequiredConsent(runner: Runner): boolean {
  return runner.age >= CONSENT_AGE || runner.hasGuardianConsent;
}
```

Here is the first survivor, and the first place I did something that is not *purely*
Inline Function: `!(runner.age < CONSENT_AGE)` and `runner.age >= CONSENT_AGE` are the
same condition, but getting from one to the other is a comparison flip, not a textual
substitution. I made the flip deliberately, ran the suite, and committed it as its own
step rather than folding it silently into the inline — it is a small enough change that a
reviewer diffing the commit can check it in five seconds, which is the entire point of
keeping steps small.

**On the name.** `hasRequiredConsent` over `passesConsentCheck`, on two of the four
questions at once. Question 1: "passes...Check" describes the mechanism (a check that
either passes or fails) rather than the domain fact (consent that either exists or
doesn't). Question 2: every one of the five original wrapper functions was named
`passes*Check` — a template, not a name; swap any noun into that slot and you'd believe it.
`hasRequiredConsent` could not be mistaken for the license or qualifying-time rule.

I kept the function at all, rather than inlining `runner.age >= CONSENT_AGE || runner.hasGuardianConsent`
straight into `isEligible`, because of `CONSENT_AGE`. Eighteen is not self-explanatory the
way `course.minAge` is — it is the club's own policy choice, already named once as a
constant, and inlining the comparison into `isEligible` would put `runner.age >= course.minAge`
and `runner.age >= CONSENT_AGE` side by side in the same boolean chain. Both are `runner.age
>= `*something*; a reader skimming the chain could easily assume they are testing the same
thing. The function name is what keeps the two age comparisons from blurring into each
other.

## License: the double negative that reads better named

```ts
// before
function courseRequiresLicense(c: Course) { return c.requiresLicense; }
function hasClubLicense(r: Runner) { return r.hasClubLicense; }
function passesLicenseCheck(r: Runner, c: Course) {
  return !courseRequiresLicense(c) || hasClubLicense(r);
}
// after
function meetsLicenseRequirement(runner: Runner, course: Course): boolean {
  return !course.requiresLicense || runner.hasClubLicense;
}
```

The two field getters go the same way every other field getter did. `passesLicenseCheck`
survives, renamed, and this is the second survivor for a reason distinct from consent's:
`!course.requiresLicense || runner.hasClubLicense` is an implication — "if the course
requires a license, the runner must have one" — written in its logically equivalent but
less directly readable form. Boolean algebra like this is exactly as correct inlined as
named; it is not *harder* to verify inline, the way a branch would be. But a reader
scanning `isEligible`'s five-line chain for the license rule has to notice the `!`, hold
the implication in their head, and confirm it says what they think it says — every single
time they read the chain. A name amortizes that cost to zero after the first read.

**On the name.** `meetsLicenseRequirement`, not `passesLicenseCheck`. Question 3: does it
read at the call site? `hasRequiredConsent(runner) && meetsLicenseRequirement(runner,
course) && meetsQualifyingTime(runner, course)` reads as three requirements in a row;
`passesConsentCheck(runner) && passesLicenseCheck(runner, course) &&
passesQualifyingCheck(runner, course)` reads as one mechanism applied three times, which is
a worse description of what `isEligible` actually is: a list of unrelated rules, not one
procedure repeated.

## Qualifying time: the one with a real branch

```ts
// before
function getQualifyingSeconds(c: Course) { return c.qualifyingSeconds; }
function getPersonalBest(r: Runner) { return r.personalBestSeconds; }
function courseHasQualifyingTime(c: Course) {
  return getQualifyingSeconds(c) !== null;
}
function beatsQualifyingTime(r: Runner, c: Course) {
  const personalBest = getPersonalBest(r);
  const qualifyingSeconds = getQualifyingSeconds(c);
  return personalBest !== null && qualifyingSeconds !== null && personalBest <= qualifyingSeconds;
}
function passesQualifyingCheck(r: Runner, c: Course) {
  return !courseHasQualifyingTime(c) || beatsQualifyingTime(r, c);
}
// after
function meetsQualifyingTime(runner: Runner, course: Course): boolean {
  if (course.qualifyingSeconds === null) return true;
  return runner.personalBestSeconds !== null && runner.personalBestSeconds <= course.qualifyingSeconds;
}
```

Four functions collapse into one, and this is the third survivor, for the most
straightforward reason of the three: **it has a branch**. `isEligible`'s body is a single
`&&`-chain of expressions; there is nowhere to put an `if` inside that shape. Even if I
wanted to inline this one, the surrounding code would not let me without restructuring
`isEligible` itself into something with statements instead of one expression — a bigger
change than this drill is asking for, and a worse one, since it would make the four simple
conditions pay for the one complicated one's shape.

I also changed the logical form here, same as in the consent step: the original is one OR
(`!hasQualifyingTime || beatsQualifyingTime`), the result is a guard clause. Both are
correct; I chose the guard clause because "no cutoff means automatically eligible" reads as
an exception you handle and move past, not as one branch of a single condition — which is
what it actually is in the domain (most courses have no cutoff at all; the qualifying-time
rule is the exception, not the rule). This is *Replace Nested Conditional with Guard
Clauses*, chapter 10, arriving in a chapter 6 drill — the same "refactorings come in
flocks" phenomenon the reference drill calls out for *Replace Temp with Query*. I did not
plan to reach for it; I noticed the OR read awkwardly once everything else was inlined and
reached for the nearest tool.

## What is left, and what it cost

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

Fourteen functions gone, three kept, for three different reasons:

1. **`meetsQualifyingTime`** has a branch. There is no shape that lets it fold into a flat
   `&&`-chain without restructuring the caller.
2. **`hasRequiredConsent`** guards a magic number that would otherwise sit next to a
   structurally identical but semantically unrelated comparison (`course.minAge`) and
   invite misreading.
3. **`meetsLicenseRequirement`** hides a double negative that is correct either way, but
   costs a reader a re-derivation on every read if left unnamed.

The honest part: I am not fully sure `hasRequiredConsent` clears the bar. `runner.age >=
CONSENT_AGE || runner.hasGuardianConsent` is one line, same shape as the age and
suspension checks that did get inlined. A reviewer could reasonably argue that `CONSENT_AGE`
being a named constant is protection enough, and that wrapping it in a function on top of
that is one layer more than the risk justifies. I kept the function because I found the
two `runner.age >= ...` lines genuinely easy to conflate while editing this file — but
that is a report on my own reading, not a provable fact about the code, and it is the
kind of judgement call `./rp review` exists to second-guess.

**Where TypeScript changes this from the book.** Fowler's Inline Function examples are
untyped; here, `noUnusedLocals` in `tsconfig.base.json` turns half of "did I finish this
step" into a compiler check. Delete a function's last call site and forget to delete the
declaration, and `tsc --noEmit` fails immediately — which is exactly what happened to me at
step 8, forgetting that `getRunnerAge` still had a caller in `meetsAgeRequirement`'s already
long-gone body (it did not; the compiler was right and I had misremembered which step I was
on). It does not help with the harder question this drill is actually about — whether a
function's *body* is as clear as its *name* — because that is a readability judgement, and
the type checker has no opinion on readability.

## If you took a different route

- **Inlining `hasRequiredConsent` too, leaving `isEligible` as four lines of comparison and
  one function call.** Defensible — see above. I would not fight hard against it in review.
- **Keeping the OR form instead of the guard clause in `meetsQualifyingTime`.** Also fine;
  the guard clause is a style preference once you accept the function has to stay.
- **Renaming less.** You could stop at `passesLicenseCheck` and `passesConsentCheck` and
  still have a correct, fully-inlined result. I think the renames are worth doing in the
  same pass — the smell that justified keeping the function (a name doing real work) is the
  same smell that makes a generic, templated name for it a waste of the keep.

What is *not* a matter of taste: leaving any of the eight field getters standing, or
leaving `passesAgeCheck` or `passesSuspensionCheck` in place because "it might be reused
later." Nothing in this file reuses them, and *Speculative Generality* — a function that
exists for a future that has not arrived — is the smell this drill is careful not to be
about. If a second course-eligibility rule needs a suspension check next month, extract
it then, with the second call site in hand to prove the extraction is worth it.
