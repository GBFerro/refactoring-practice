# Walkthrough — weeklyPayrollHours(), staff only

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: does this method actually change any output?

Grep `weeklyPayrollHours` across `src/` before touching a line, and you find exactly two
call sites: `StaffTutor` nowhere calls it on itself directly (it's inherited), and
`weeklyPayrollReport` calls it once, inside a `.map()`, after filtering the tutor list down
to `tutor.kind === "staff"`. `FreelanceTutor` never calls it, anywhere, on anything.

That is the whole case for Push Down Method in one grep: a method that lives on the shared
type but that only one branch of the hierarchy has ever asked a question of. It is *not* a
case where today's output is wrong — `weeklyPayrollReport` already excludes freelance tutors
correctly, because the `kind` filter does its job. This is the honest, slightly deflating
fact about this drill: pushing the method down will not fix a bug, because there isn't one
yet. It closes a door that nothing has walked through — so far.

## Why this order: add before you remove, remove before you clean up

Three moves, in a strict sequence: add the method where it belongs, delete it from where it
doesn't, then deal with whatever that deletion breaks. I did not fix `payroll.ts` before
deleting `Tutor.weeklyPayrollHours()`, even though I could see the fix coming. Fixing it
first would mean writing a type predicate against a method that, at that moment, still
exists on every `Tutor` — there is nothing for the predicate to prove yet, because nothing
is at risk. The predicate only *earns* its existence once the plain string check stops being
sufficient, and that happens exactly at step 2, not before.

## Step 1 — add, without removing anything yet

```ts
// StaffTutor, after this step (Tutor still has its own copy too)
export class StaffTutor extends Tutor {
  weeklyPayrollHours(): number {
    const minutes = this.lessonsThisWeek.reduce((sum, lesson) => sum + lesson.durationMinutes, 0);
    return Math.round(minutes / 15) / 4;
  }
}
```

For one commit, `weeklyPayrollHours()` exists in two places at once — on `Tutor` and, now,
shadowing it on `StaffTutor`. Nothing calls the new copy yet (the inherited one still wins
for anyone who doesn't know a more specific one exists, but in practice every existing
caller goes through `StaffTutor` instances, so the shadow is already active). Tests are
green because both copies compute the same thing. This step is pure addition, which is why
it comes first: there is no way for it to break a test that was passing before it.

**On the name.** `weeklyPayrollHours` is unchanged. Question 3 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — does it read at the call site? — was
already answered when this name was chosen on `Tutor`, and moving the
method doesn't change what the receiver's type tells the reader. I considered
`staffPayrollHours`, repeating "staff" now that the method lives on `StaffTutor` — and
rejected it on the same reasoning as `drill-12-01`'s `Membership.loanLimit()`: the receiver
already carries that fact once you're calling `staffTutor.weeklyPayrollHours()`, so a prefix
repeating it teaches the reader nothing they didn't already know from the call site.

## Step 2 — delete from `Tutor`

```ts
// Tutor, before
export abstract class Tutor {
  constructor(/* ... */) {}
  weeklyPayrollHours(): number { /* ... */ }
}

// Tutor, after
export abstract class Tutor {
  constructor(/* ... */) {}
}
```

This is the step that actually does something: before it, every `Tutor` — staff or
freelance — answers `weeklyPayrollHours()`. After it, only `StaffTutor` does, and the
compiler enforces that on every build. Running the suite immediately after this step is the
whole point of splitting it from step 1 — if something outside `payroll.ts` had been calling
the method on a bare `Tutor` reference, this is the commit where it would stop compiling,
and I would rather find that out in a two-line diff than in whatever step happened to touch
that file next.

## Step 3 — the compile error, and what it is actually telling you

Deleting the method in step 2 does not, on its own, break `payroll.ts` — the original filter
was:

```ts
tutors.filter((tutor) => tutor.kind === "staff").map((tutor) => ({
  name: tutor.name,
  hours: tutor.weeklyPayrollHours(), // error TS2339 after step 2
}));
```

`.filter((tutor) => tutor.kind === "staff")` returns `Tutor[]`, not `StaffTutor[]` — a
boolean-returning callback tells the compiler nothing about the narrowed type, no matter how
certain a human reader is that the result only contains staff. Before step 2 this didn't
matter, because `weeklyPayrollHours()` existed on `Tutor` and the `.map()` call was legal
regardless of what the filter proved. After step 2, the same code is a compile error, and
the fix is a type predicate:

```ts
function isStaffTutor(tutor: Tutor): tutor is StaffTutor {
  return tutor instanceof StaffTutor;
}

tutors.filter(isStaffTutor).map((tutor) => ({
  name: tutor.name,
  hours: tutor.weeklyPayrollHours(), // fine - tutor: StaffTutor here
}));
```

**On the name.** `isStaffTutor`, not `isStaff` — question 2 from `NAMING.md`, could it be
the name of something else in this file? `payroll.ts` has no other concept called "staff"
that a shorter name might collide with, but the longer name still earns its keep for a
different reason: a type predicate's name is read at its declaration nearly as often as at
its call site, because a reader checking *what it narrows to* has to look at the signature
either way, and `isStaffTutor` states that outright where `isStaff` would make you go check.

The instinct to reach for `instanceof` here instead of keeping the string check is not
about style — it is the direct, mechanical consequence of the method no longer being on the
wider type. That is the entire benefit this drill buys: not better code today, but code that
refuses to compile tomorrow if someone tries to ask a `FreelanceTutor` for its payroll hours.

## Step 4 — the discriminant that outlived its job

```ts
// Tutor, before this step
export type TutorKind = "staff" | "freelance";
export abstract class Tutor {
  constructor(readonly name: string, readonly kind: TutorKind, /* ... */) {}
}

// Tutor, after
export abstract class Tutor {
  constructor(readonly name: string, /* ... */) {}
}
```

Once `payroll.ts` narrows with `instanceof StaffTutor`, nothing anywhere reads `tutor.kind`
any more — I grepped to confirm before deleting, the same way the module-7 hide-delegate and
remove-middle-man drills grep before deleting an accessor. This was not a goal when I started
the drill; it fell out of step 3 the same way the module-6 reference drill's loop counter
fell out of an unrelated extraction. A hand-maintained string tag whose only job was standing
in for a type distinction the compiler can now express directly has nothing left to do.

**On the name.** Not really a naming decision so much as a naming *retirement*, but it is
worth stating the question it answers anyway — is `kind` still true? Once nothing reads it,
a field that used to describe something real describes nothing, and a field describing
nothing is a lie waiting for someone to trust it. Deleting it is question 4 from
`NAMING.md`, applied to a field's continued existence rather than to a candidate name.

## What it cost

Nothing changed for any test in `tests/` — every one of them passes identically before and
after this drill, which is either the strongest argument that this refactoring is safe or
the strongest argument that it didn't need to happen yet. I am genuinely unresolved on which.
The case for doing it now is preventive: a hierarchy where a superclass method is honest
about who can answer it is a hierarchy where the next person who adds a third `Tutor`
subclass — a substitute tutor, say, paid neither by payroll nor by invoice — cannot
accidentally inherit a payroll method that makes no sense for them either, because there is
no such method sitting on `Tutor` to inherit by accident. The case against doing it now is
that nothing was actually broken, and "this could theoretically go wrong for a subclass that
doesn't exist yet" is a weaker justification than most of the refactorings in this
repository get to make.

## If you took a different route

- **Leaving the `kind === "staff"` filter and only doing steps 1–2.** This does not compile
  — TypeScript will not let you call `weeklyPayrollHours()` on the un-narrowed filter result
  once the method leaves `Tutor`. There is no version of this drill that skips step 3.
- **Using `tutor.kind === "staff"` as the type predicate's own check**, instead of
  `instanceof StaffTutor` — `function isStaffTutor(tutor: Tutor): tutor is StaffTutor { return tutor.kind === "staff"; }`
  would still compile and pass every test, and it keeps the `kind` field alive for a reason.
  Defensible, especially if this codebase had other legitimate uses for a serializable
  discriminant (a payload sent over a wire, say, where `instanceof` doesn't survive
  serialization). I chose `instanceof` because nothing here crosses a serialization boundary,
  and a discriminant with no other job is a discriminant this drill's whole point argues
  against.

What is *not* a matter of taste: keeping `weeklyPayrollHours()` on `Tutor` while also adding
a copy on `StaffTutor`, past step 1. Two copies computing the same thing from the same state
is the exact shape [`drill-12-01`](../../../01-pull-up-method/README.en.md) exists to
remove, and leaving both in place here would just relocate that drill's smell into this one.

## Where TypeScript makes this different from the book

Fowler's Push Down Method mechanics are almost entirely about finding every caller by hand
and confirming none of them need the method through the wider type. Here, that confirmation
is not something you have to trust yourself on: delete the method, run `tsc`, and every call
site that assumed the wider type surfaces as a named compile error at its exact location.
The more interesting difference is step 3 — in JavaScript, the equivalent code
(`tutors.filter(t => t.kind === "staff").map(t => t.weeklyPayrollHours())`) never distinguishes
"a boolean check" from "a type-narrowing check," because there is no static type to narrow.
Moving the method down is invisible to that code either way. In TypeScript, the exact same
refactoring forces a visible, compiler-checked upgrade from a value-level check to a
type-level one — the language itself hands you a better version of the fix, not just a
warning that something needs fixing.

## The deeper question: should this even be a hierarchy?

Push Down Method is the right answer here because `StaffTutor` and `FreelanceTutor` share
real things beyond this one method — a name, a week of logged lessons, presumably more as
Beckworth's system grows. Pushing down the one method that doesn't belong on top leaves a
hierarchy that is smaller but still earns its keep.

That would stop being true if payroll-versus-invoicing turned out to be the *only* axis
these two types ever varied on — if, hypothetically, every other method on `Tutor` applied
equally to both, and the entire reason two subclasses exist were this one billing
difference. At that point, Push Down Method is treating a symptom: you'd have moved the
mismatched method to where it belongs, but the deeper mismatch — using subclassing to model
one varying axis of behaviour — would still be sitting underneath, and the sharper tool is
`drill-12-10`, *Replace Subclass
with Delegate*: give `Tutor` a single `payMethod` collaborator (a
`StaffPayroll` or a `FreelanceInvoicing`) instead of a subclass per payment style, and the
question "does this tutor get payroll hours" becomes "does this tutor's pay method support
that," answerable without `instanceof` anywhere. Beckworth's tutors are not there yet — they
differ in more than pay style — so this drill's answer stands. The test for *which* fix
applies is the same one `drill-12-01`'s closing section names: count what each subclass
actually needs, and if the count ever collapses to one varying thing, stop reaching for
inheritance to model it.
