# Walkthrough — one name for the three that agree, one guard for the one that doesn't

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and the one
condition that must not be folded in. Read it after you have your own version, not before.

---

## The shape, before anything

```ts
let eligible = false;
if (patient.triageScore >= 4) {
  eligible = true;
}
if (patient.ageMonths < 24) {
  eligible = true;
}
if (patient.hasChronicCondition) {
  eligible = true;
}
if (patient.flaggedForNurseReview) {
  log.pagesSent += 1;
  eligible = true;
}
return eligible;
```

Four `if`s, each with the same effect on `eligible`. The reflexive read is "this is one
rule written four times, consolidate it" — and for three of the four, that reflex is
correct. The fourth is the point of this drill.

## What this drill has in common with `drill-10-01`, and what it doesn't

[`drill-10-01`](../../../01-decompose-conditional/) and this one are opposite moves on the
same material. There, you start with **one** tangled condition and the fix is to give its
**parts** names — pulling one thing apart into a test and two branches. Here, you start
with **several** separate conditions that turn out to already be answers to the same
question, and the fix is to give the **whole** a single name — pushing several things
together into one.

The direction is the whole difference. If a fix here felt like it was splitting one thing
into pieces, you were doing `drill-10-01`'s move by mistake; if a fix there felt like it was
merging several things into one, you had it backwards too.

## The precondition, and why this drill has a trap

Fowler's Consolidate Conditional Expression comes with a condition attached, not just a
recipe: the branches being merged must have no side effects, because `||` and `&&` are
short-circuiting. `a || b` does not evaluate `b` when `a` is already `true`. Four separate
`if` statements, by contrast, each evaluate their own condition regardless of what the
others decided — there's no chaining, so there's no short-circuiting to worry about.

That difference is invisible if every condition is a pure predicate — reading a field,
returning a boolean, nothing else. It becomes a live bug the moment one of them does
something besides answer a question. This module has exactly one: `flaggedForNurseReview`
doesn't just gate `eligible`, it also pages the on-call nurse and records it in `log`. Look
again at the shape above — that page has to fire *whenever the patient is flagged*, full
stop, regardless of whether the first three conditions already made them eligible. A
same-day slot and an on-call page are two different things this function happens to decide
together; being eligible via triage score doesn't make the nurse-review flag stop mattering.

Fold all four into `patient.triageScore >= 4 || patient.ageMonths < 24 ||
patient.hasChronicCondition || pageOnCallNurseIfFlagged(patient, log)` and you have written
exactly that bug. The moment `triageScore >= 4` is `true`, `||` never evaluates the fourth
clause, and a patient who is both triage-urgent *and* flagged for nurse review never gets
paged. `tests/eligibility.spec.ts`'s `"still pages the on-call nurse even when the patient
already qualifies through triage"` test exists to catch exactly this, and it is the reason
this drill has a `log: OnCallLog` parameter at all instead of a plain boolean return — a
pure boolean function can't expose this kind of bug to a test.

**Step 1 is checking this, before writing a line of code.** Ask it of each of the four:
does evaluating this condition do anything besides answer a question? Three don't. One does.

## Step 2 — pull the side-effecting one out first, called unconditionally

```ts
// before
if (patient.flaggedForNurseReview) {
  log.pagesSent += 1;
  eligible = true;
}

// after
function pageOnCallNurseIfFlagged(patient: Patient, log: OnCallLog): boolean {
  if (!patient.flaggedForNurseReview) return false;
  log.pagesSent += 1;
  return true;
}
```

I extract this one first, before touching the three that will merge, and I call it
unconditionally — assigned to a `const nursePaged` at the top of the function, not folded
into the return expression's `||` chain. That ordering is deliberate: it's the one place in
this whole drill where getting the *order of statements* right, not just the extraction,
is what keeps the behaviour identical. Do this after step 4 and it's tempting to reach for
`isPriorityCase(patient) || pageOnCallNurseIfFlagged(patient, log)`, which reintroduces the
exact short-circuiting bug this drill is about — the extraction alone doesn't save you, the
call site has to keep it out of the `||`.

**On the name.** `pageOnCallNurseIfFlagged`, not `isFlaggedForNurseReview`. This is question
4 from [`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — doing real work:
`isFlaggedForNurseReview` reads like a pure predicate, the same shape as `isPriorityCase`,
and a name in that shape is a promise that calling it is free. It isn't; it pages someone.
Naming it as if it were a query would be the exact kind of lie `NAMING.md` warns about — a
name that is true today and becomes a trap the day someone calls it twice expecting no
consequence. `pageOnCallNurseIfFlagged` states the side effect in the name, and returns a
boolean besides, which is unusual but honest: this function does two things, and I chose to
say so rather than split it into a query and a command, because the query has no meaning on
its own here — nothing needs to know "is this patient flagged" without also acting on it.

## Step 3 — consolidate the three that actually agree

```ts
// before
if (patient.triageScore >= 4) {
  eligible = true;
}
if (patient.ageMonths < 24) {
  eligible = true;
}
if (patient.hasChronicCondition) {
  eligible = true;
}

// after
if (
  patient.triageScore >= 4 ||
  patient.ageMonths < 24 ||
  patient.hasChronicCondition
) {
  eligible = true;
}
```

This is the mechanical core of the refactoring, and on its own it's almost too small to be
interesting — three `if`s with an identical consequence become one `if` with a boolean
expression, no behaviour change, nothing to think about beyond confirming (again) that none
of the three has a side effect. It's small on purpose. All of the judgement in this drill
sits in deciding *which three*, not in performing the merge itself.

## Step 4 — name the merged condition

```ts
// after
function isPriorityCase(patient: Patient): boolean {
  return (
    patient.triageScore >= URGENT_TRIAGE_SCORE ||
    patient.ageMonths < INFANT_AGE_MONTHS ||
    patient.hasChronicCondition
  );
}
```

**On the name.** `isPriorityCase`, not `isEligible`. Question 2 from `NAMING.md` — could it
be the name of something else in this file? — rules `isEligible` out directly: the exported
function is already answering "is this patient eligible," and a second, differently-scoped
function with almost the same name would be exactly the kind of collision question 2 exists
to catch. `isPriorityCase` names what actually distinguishes these three conditions from
the fourth: they're clinical priority signals — how urgent, how young, how chronic — where
the fourth is an administrative one, a flag for review. That's also *true* in a way
`isEligible` wouldn't be: this function is not the full eligibility rule, it's three-fourths
of it, and its name should not claim more than that.

I also considered `hasPriorityIndicator`. Rejected on question 3 — read it at the call
site: `isPriorityCase(patient) || nursePaged` reads as a sentence; `hasPriorityIndicator(patient)
|| nursePaged` reads as a field lookup dressed up as a sentence, and the extra syllables
buy nothing.

## Step 5 — drop the accumulator

```ts
// before
let eligible = false;
if (isPriorityCase(patient)) {
  eligible = true;
}
return eligible;

// after
return isPriorityCase(patient) || nursePaged;
```

Once the four `if`s are down to two conditions and no side effects sit inside either of
them, `let eligible` has nothing left to do — every reassignment was standing in for the
`||` this line now writes directly. This is a small instance of the same move `drill-06-01`
made to `paceTotal`: a mutable flag that only ever collects the result of conditions is a
temp begging to become the expression it was accumulating. I did it last, after the
consolidation, because doing it first — before `isPriorityCase` existed — would have meant
writing the same four-clause `||` expression directly into the return statement, which is
exactly the short-circuiting trap this drill exists to avoid.

**On the name.** `nursePaged`, not `flagged`. Question 1 — what, not how — is why: `flagged`
describes the patient's input state, which `pageOnCallNurseIfFlagged` already tells you by
name; `nursePaged` describes what happened as a *result* of calling it, which is the fact
this local variable actually needs to carry into the `||`. Using `flagged` here would make
the return line quietly imply the boolean is still just reading a field, undoing the honesty
step 2's name worked to establish.

## What it cost

The honest part.

- **A reader who reads only `isPriorityCase` gets a wrong but plausible mental model.** It
  looks like the whole eligibility rule, and it's three-quarters of it. I mitigated this
  with the comment above `nursePaged` in `isEligibleForSameDaySlot`, pointing at this file,
  but a comment is a weaker guarantee than a name, and I don't think there's a name for
  `isEligibleForSameDaySlot`'s top-level logic that makes the split obvious without reading
  the body. That asymmetry — three conditions get a clean consolidated name, one doesn't —
  is real, and I'm not fully satisfied a comment is enough to close the gap for a reader
  moving fast.
- **`OnCallLog` as a parameter, threaded through a function whose name is about
  eligibility.** A same-day-slot query taking a mutable paging log as an argument is an
  unusual signature, and it exists only because this drill needs an observable side effect
  to test against — a real Fernbank Clinic system would more plausibly have
  `pageOnCallNurseIfFlagged` publish an event or call a paging service, not append to a
  struct its caller owns. I kept the log because it makes the side effect something a test
  can pin without mocking, which matters more for a teaching exercise than architectural
  realism does — but it's a simplification, not a recommendation.

## If you took a different route

- **Merging all four and accepting the behaviour change**, on the theory that a patient who
  already qualifies via triage doesn't *need* the extra page. This is a legitimate product
  decision — maybe it's genuinely fine, or even desirable, not to page twice-over-qualified
  patients. What makes it a defensible alternative and not a bug is whether it's a decision
  someone made on purpose and the tests reflect it, versus something that happened silently
  because `||` short-circuits and nobody checked. This repository's tests pin the
  always-page behaviour; changing that on purpose means changing the tests on purpose too,
  with a reason written down.
- **Splitting `pageOnCallNurseIfFlagged` into a pure predicate plus a separate paging
  call**, rather than one function that does both. Cleaner separation of query and command,
  and probably the better call in a larger codebase. I didn't, because nothing in this
  module needs "is this patient flagged" independent of "then page them" — introducing that
  split here would be answering a question nobody's asking yet, which chapter 3 calls
  Speculative Generality.

What is *not* a matter of taste: consolidating all four conditions into one `||` chain
without first checking whether any of them has a side effect. Fowler states the precondition
plainly, and skipping the check is not a style choice — it's how this specific bug gets
written, silently, by code that looks perfectly refactored.

## Where TypeScript makes this different from the book

Fowler's Consolidate Conditional Expression is written in JavaScript, and the trap here
isn't specific to either language — short-circuit evaluation of `||` is identical in both.
TypeScript doesn't close the gap either, and it's worth saying plainly why not:
`pageOnCallNurseIfFlagged(patient, log)` has the type `(patient: Patient, log: OnCallLog) =>
boolean`, and that signature is indistinguishable, to the compiler, from a pure predicate
with the exact same shape as `isPriorityCase`. TypeScript's type system tracks what a
function returns, never what it *does* on the way there — there is no annotation that says
"this one has a side effect, don't let short-circuiting skip it." `tsc --noEmit` passes on
the buggy `isPriorityCase(patient) || pageOnCallNurseIfFlagged(patient, log)` version just
as cleanly as it passes on the correct one. Catching this is a reading exercise in
TypeScript exactly as much as it is in JavaScript.
