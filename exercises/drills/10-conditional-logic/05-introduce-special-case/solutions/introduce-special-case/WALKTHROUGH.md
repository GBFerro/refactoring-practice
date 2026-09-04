# Walkthrough — one patient record that already knows how to answer

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what this
refactoring buys you that a simple clean-up of the nine checks would not.

---

## Before anything: nine checks, one condition

`patient-board.ts` has nine functions. Read them side by side and they are not nine
different pieces of logic — they are one piece of logic, `patient.id === "unknown"`,
copy-pasted nine times with a different pair of consequences hanging off it each time.
That repetition is **Repeated Switches**: not a literal `switch` statement anywhere in this
file, but the same condition, tested independently at every site that cares about it, so
that adding a tenth site means finding and copying the ninth one correctly — and forgetting,
or mistyping, is exactly as easy the tenth time as the first.

It already happened once. `isBillable` checks `patient.id === "Unknown"` — capital U. Every
other site in the file uses the lowercase sentinel that `unknownPatient()` actually
produces, so this one silently never fires: an unidentified patient reads as billable. Run
the two variants side by side before you touch anything:

```ts
isBillable(unknownPatient());  // src/:      true  - the typo falls through to the default
isBillable(unknownPatient());  // solution:  false - there is no comparison left to typo
```

That disagreement is real, and removing the category of bug that produced it — not just
this one instance — is what *Introduce Special Case* is for.

## Why this order

Add the resolved fields before you touch a single call site. If you rewrote
`boardDisplayName` to read `patient.displayName` before `patient.displayName` existed on
both factories, the suite would fail the instant you saved the file, and you'd be doing two
things at once: inventing the field's value *and* removing the old logic that used to
compute it. Landing the fields first, unread, means every later step is a pure redirection —
point a getter at a value that has already been proven correct by the tests that exercise
the factories indirectly through the *old* code path still running in parallel for one
commit.

This is the same shape as `drill-08-01`'s *Move Function* (copy the destination before you
cut the source) and `drill-09-03`'s *Replace Derived Variable with Query* (get the new read
path right while the old one is still there as a harmless spectator). All three refactorings
separate "build the correct new thing" from "stop using the old thing," because doing both
in one step means a failure could be caused by either half, and you'd have to re-diagnose
which.

## Step 1 — resolve every field, read by nobody yet

```ts
// patient.ts (excerpt)
export function registeredPatient(data: RegisteredPatientData): Patient {
  return {
    ...data,
    isUnknown: false,
    displayName: data.name,
    contactPhoneLine: data.phone,
    insuranceLabel: data.insuranceProvider ?? "Self-pay",
    dateOfBirthLine: data.dateOfBirthIso,
    nextOfKinLine: data.nextOfKinPhone ?? "None on file",
    requiresIdArmband: false,
    waitingRoomSortKey: data.name,
    isBillable: true,
    followUpEligible: true,
  };
}
```

`unknownPatient()` gets the mirror-image treatment: every resolved field set directly to its
special-case value, and the raw fields (`name`, `phone`, ...) still filled in with the same
placeholders `src/` always used, because `Patient` at this step is still
`RegisteredPatientData` plus the new fields — nothing has been removed yet. The suite is
green here for the least interesting possible reason: nothing reads the new fields, so
nothing can depend on them being right or wrong.

**On the name.** `isBillable`, not `billable` and not `canBill`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — *what*, not *how* — is why `canBill` lost:
it reads as a capability check the caller has to invoke, when this is a fact already
resolved about the record, the same shape as `isUnknown` and `requiresIdArmband` next to it.
Matching the repository's own `is*`/`has*` convention for yes/no fields settled it the rest
of the way.

## Step 2 — the text fields

```ts
// patient-board.ts (before)
export function insuranceLabel(patient: Patient): string {
  if (patient.id === "unknown") return "Pending identification";
  return patient.insuranceProvider ?? "Self-pay";
}

// after
export function insuranceLabel(patient: Patient): string {
  return patient.insuranceLabel;
}
```

Five functions collapse the same way: `boardDisplayName`, `contactPhoneLine`,
`insuranceLabel`, `dateOfBirthLine`, `nextOfKinLine`. Each one goes from a two-branch
conditional to a single field read, because the branch's two answers are now sitting on the
object, already resolved by whichever factory built it. Nothing about what a caller sees
changes — the field was computed from the exact same rule the deleted `if` used to apply
inline.

**On the name.** The board function keeps the name `insuranceLabel` and the field on
`Patient` is *also* called `insuranceLabel` — a deliberate collision, not a coincidence.
Question 3 — does it read at the call site? — is why: `patient.insuranceLabel` at the call
site inside the function body should look exactly like calling `insuranceLabel(patient)`
looks to *that* function's callers, because after this refactor they mean the same thing.
I considered `resolvedInsuranceLabel` for the field, to visually separate "the field" from
"the function," and rejected it — question 4, is it true? — `resolved` would imply the other
eight fields on `Patient` are somehow *not* resolved, which isn't true of any of them.

## Step 3 — the rest, and where the bug goes

```ts
// before
export function isBillable(patient: Patient): boolean {
  if (patient.id === "Unknown") return false;
  return true;
}

// after
export function isBillable(patient: Patient): boolean {
  return patient.isBillable;
}
```

`requiresIdArmband`, `waitingRoomSortKey`, `isBillable` and `followUpEligible` all move the
same way `insuranceLabel` did in step 2. This is the step to slow down on, because it is the
only one in the whole route where a caller's observed answer can change: `isBillable` used
to read a comparison against a string that never matched anything real, so it always fell
through to `true`. After this step it reads `patient.isBillable`, which
`unknownPatient()`'s factory set to `false` back in step 1. Nothing else in this step
touches behaviour — the other three fields' `if` branches were typo-free, so their
before/after values agree exactly, the same way `insuranceLabel`'s did.

This is exactly why `tests-fixed/unknown-patient-not-billable.spec.ts` exists rather than a
line inside `tests/`: the shared suite has to stay green against `src/`, and against `src/`
`isBillable(unknownPatient())` really is `true`. No single expected value could pass both
files, so the proof that this step is a fix — not just a tidy-up — lives where only the
solution is graded.

**On the name.** No name changes in this step, but it's worth stating why `isBillable`
*didn't* get renamed to something like `isBillableSafely` or `isBillableChecked` once its
bug was fixed. Question 4 again: `isBillable` was never a lie about *what* the function
answers — "can this visit go to billing" — it was wrong about the *value* for one input.
Fixing a wrong value is not the same problem `NAMING.md`'s renaming guidance exists to
solve, and dressing the name up to advertise the fix would leave every other correctly-named
function in the file looking under-labelled by comparison.

## Step 4 — stop carrying data nothing reads

```ts
// patient.ts (before)
export type Patient = RegisteredPatientData & { /* nine resolved fields */ };

// after
export interface Patient {
  readonly id: string;
  readonly isUnknown: boolean;
  readonly displayName: string;
  // ...the other eight resolved fields, and nothing else
}
```

Once step 3 lands, no board function reads `patient.name`, `patient.phone`, or any of the
other four raw fields directly — they only exist because `registeredPatient` used to be an
identity function. Removing them from `Patient` is safe for the same reason removing
`totalFareCentsCache` was safe in `drill-09-03`: TypeScript refuses to compile any leftover
read of a field that no longer exists, so a missed reference surfaces at `tsc --noEmit`
rather than at runtime.

This step also retires `unknownPatient()`'s per-call object literal in favour of one shared
`UNKNOWN_PATIENT` constant, returned by reference. Nothing about an unidentified patient
varies from one call to the next, so building a fresh object every time was buying nothing.

**On the name.** `UNKNOWN_PATIENT`, not `NULL_PATIENT` and not `NO_PATIENT`. Question 4 is
what rules out `NULL_PATIENT`: this is not a null-object standing in for *the absence* of a
patient — Fernbank is still seeing someone, examining them, possibly billing their next of
kin. What's missing is their identity, not their presence, and `UNKNOWN_PATIENT` says that;
`NULL_PATIENT` would say something false about a person actually sitting in the waiting
room.

## What it cost

The honest part. `registeredPatient` was a one-line identity function before this
refactoring and a twelve-line object literal after it — right at the strict lint profile's
function-length ceiling, which is not a coincidence so much as a warning sign. Every one of
the nine board fields has to be resolved *somewhere*, and putting all nine in one factory
function is the reason it's twelve lines instead of four separate three-line ones. I split
the constant defaults (`REGISTERED_DEFAULTS`) out to buy back four of those lines, and I am
not fully confident that was the right trade over, say, three smaller helper functions each
resolving two or three related fields (contact info together, billing flags together). I
kept one factory because the fields don't group cleanly — `waitingRoomSortKey` shares
nothing conceptually with `requiresIdArmband` — and I didn't want to invent a grouping that
doesn't correspond to anything a reader of this domain would recognise.

## If you took a different route

- **A `Patient` union type** (`RegisteredPatient | UnknownPatient`) with the nine board
  functions doing a single `if (patient.kind === "unknown")` dispatch, instead of baking
  every field's special-case value into the object at construction. Defensible, and closer
  to a textbook discriminated union. I didn't take it because it reintroduces exactly one
  conditional per board function — smaller and safer than nine string comparisons, but
  still nine places that have to remember to ask. The whole point of *Introduce Special
  Case* is that client code stops asking.
- **Methods instead of fields** (`patient.insuranceLabel()` instead of
  `patient.insuranceLabel`), closer to the book's own examples, which lean on classes. I
  kept plain data with resolved fields because every module through chapter 9 in this
  repository does the same, and introducing methods here would mix this refactoring with
  *Combine Functions into Class* — a second move riding on the first.

What is *not* a matter of taste: leaving `isBillable`'s comparison as `=== "Unknown"` once
you've noticed it disagrees with the other eight. A special case is supposed to remove the
opportunity for that kind of drift, not carry it forward under a new name.

## Where TypeScript makes this different from the book

Fowler's own worked examples for *Introduce Special Case* lean on a class hierarchy — a
`NullCustomer` subclassing `Customer` — because that is what makes a special case
*substitutable* in Java or plain JavaScript: same interface, different `instanceof`.
TypeScript's structural typing makes that inheritance unnecessary here. `Patient` is an
interface, and `registeredPatient` and `unknownPatient` are two functions that both happen
to return something shaped like it; nothing needs to declare a subclass relationship for the
two to be interchangeable everywhere a `Patient` is expected. The trade is that TypeScript
can't stop a third factory from appearing somewhere else in the codebase that builds a
`Patient`-shaped object by hand and gets one field wrong — a class hierarchy with a private
constructor could close that door; a plain interface can't. For nine fields resolved in
exactly two places in one file, I didn't think that door was worth building.
