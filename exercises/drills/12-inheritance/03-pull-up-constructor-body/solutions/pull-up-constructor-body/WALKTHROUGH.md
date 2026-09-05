# Walkthrough — one shared prologue, computed before super() where it has to be

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary — why each move, why in that order, what the ordering rules actually force you
to do, and what I am still not sure about. Read it after you have your own version, not
before.

---

## Before anything: constructors are not ordinary methods

Every other Pull Up move in this module — Pull Up Method, Pull Up Field — moves something
that exists independently of *when* it runs. A method can be called whenever a caller
wants it. A constructor cannot. It runs exactly once, at a fixed point in an object's
life, and in a derived class it runs in a fixed order that TypeScript enforces at compile
time: `super(...)` must be the first statement that touches `this`, and everything the
superclass constructor does happens *before* the subclass constructor's own statements
resume.

That ordering is invisible when a subclass constructor is short, which is exactly why it
is easy to miss here. `PrivateLessonEnrolment` and `GroupLessonEnrolment`, in `src/`, each
open with five identical-looking lines: validate the name, build an id from it, store
`enrolledOn`, store two rate figures, multiply them into `tuitionCents`. Read quickly, it
looks like one duplicated block that should slide up into `Enrolment` in a single move.
It is not one block. It is two blocks that happen to look alike, and the difference
between them is entirely about timing.

## Why this order

Split the five lines by what they depend on:

- **Validate `studentName`, derive `id` from it.** Needs nothing but a constructor
  parameter. Could move up on day one, before `Enrolment` even has any other state.
- **Store `enrolledOn`.** Same story — a parameter, passed straight through.
- **Store `sessionsPerTerm` and `ratePerSessionCents`, then multiply them into
  `tuitionCents`.** Needs `this.sessionsPerTerm` and `this.ratePerSessionCents` — fields
  that do not exist on `Enrolment`, and could not be read there even if they did, because
  they are assigned by the *subclass's own* constructor, which has not run yet at the
  point `Enrolment`'s constructor executes. `super()` runs to completion first; a
  subclass's own field assignments happen only after it returns.

I did the easy two first, for the same reason leaves-first extraction always goes first:
each is independently safe, independently testable, and neither is blocked on deciding
what to do about the hard one. Doing the hard one first would have meant holding two kinds
of uncertainty in my head at once — "did I move this correctly" and "did I solve the
timing problem correctly" — instead of one at a time.

## Step 1 — student name and id

Before, in both subclasses:

```ts
constructor(studentName: string, enrolledOn: string, instrumentTutor: string) {
  super();
  if (studentName.trim().length === 0) {
    throw new Error("Student name is required.");
  }
  this.id = `ENR-${studentName.trim().toUpperCase().replace(/\s+/g, "-")}`;
  // ...
```

After, `Enrolment` does both, and each subclass calls `super(studentName)`:

```ts
protected constructor(studentName: string) {
  if (studentName.trim().length === 0) {
    throw new Error("Student name is required.");
  }
  this.id = `ENR-${studentName.trim().toUpperCase().replace(/\s+/g, "-")}`;
  this.studentName = studentName;
}
```

This is legal on the first attempt, with no restructuring, because neither statement ever
reads `this`. They read `studentName`, the parameter — available the instant the
constructor starts, superclass or not.

**On the name.** `id` survived the move unchanged, but I did consider `enrolmentId` for
the *field* name while writing this, to match a hypothetical helper function of the same
name. I rejected it: question 2 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — could this be the name of something
else in this file? — `Enrolment` has exactly one thing that is ever called an id, so the
qualifier is pure noise here. Everywhere it is read (`enrolment.id`), the receiver already
says what kind of id it is. `id` earns its shortness the same way `Member.id` did in
[`drill-07-05`](../../../../07-encapsulation/05-extract-class/README.en.md).

## Step 2 — enrolledOn

Same shape, same reasoning, one parameter added:

```ts
protected constructor(studentName: string, enrolledOn: string) {
  // ...as before...
  this.enrolledOn = enrolledOn;
}
```

Nothing about `enrolledOn` depends on anything computed inside the constructor — it is
handed in whole from outside — so this step carries no risk beyond "did I update both call
sites." Both subclasses now call `super(studentName, enrolledOn)`.

## Step 3 — tuitionCents, the one that cannot move as written

Here is the line that looked, at first read, exactly like the two above:

```ts
this.tuitionCents = this.sessionsPerTerm * this.ratePerSessionCents;
```

Try the same move — cut it, paste it into `Enrolment`'s constructor — and it will not
compile. `Enrolment` has no `sessionsPerTerm` field, so `this.sessionsPerTerm` is a type
error, full stop. Add the fields to `Enrolment` to make it compile, and the actual bug
shows up: `Enrolment`'s constructor runs *before* `PrivateLessonEnrolment`'s own
constructor assigns them, so `this.sessionsPerTerm` would be reading a field that has not
been set yet. The multiplication would silently produce `NaN`, not `4500`.

Both of those blockers exist because of the fixed order: `super()` runs to completion
first, and a subclass's own `this.x = ...` assignments do not exist until the subclass
constructor resumes after that. The statement is not too identical to move. It is
identical *and* pointed at data that will not exist yet when it runs.

The fix is not to leave the calculation behind — that would leave `tuitionCents`
duplicated in exactly the way this drill exists to remove. It is to stop routing the
calculation through fields at all. `sessionsPerTerm` and `ratePerSessionCents` are never
read anywhere except to compute `tuitionCents`, once, in the constructor that already
knows both numbers. Nothing requires them to be fields:

```ts
// PrivateLessonEnrolment, after
constructor(studentName: string, enrolledOn: string, instrumentTutor: string) {
  super(studentName, enrolledOn, SESSIONS_PER_TERM * RATE_CENTS_PER_SESSION);
  this.instrumentTutor = instrumentTutor;
}
```

`SESSIONS_PER_TERM * RATE_CENTS_PER_SESSION` is legal *before* `super()` runs, because it
touches neither `this` nor anything the superclass constructor produces — it is two
module-level constants, known before the object exists at all. Computing it here and
passing the result as `super`'s third argument turns what used to be subclass-only,
post-super state into superclass-available, pre-super state. Once it arrives as a
parameter, `Enrolment` can validate it and store it exactly the way it already stores
`studentName` and `enrolledOn`:

```ts
protected constructor(studentName: string, enrolledOn: string, tuitionCents: number) {
  // ...validate studentName, derive id...
  this.enrolledOn = enrolledOn;
  this.tuitionCents = tuitionCents;
}
```

**On the name.** `tuitionCents` kept its name across the move, and I want to be explicit
about why, because a shorter name was tempting: `amount`, or just `total`. Question 4 —
is it true? — rules both out immediately. This repository's own convention table says a
unit-bearing number carries its unit in the name (`paceSecondsPerKm`, not `pace`), and
`amount` or `total` would silently drop the fact that this number is cents, not dollars —
exactly the kind of bug a stray `/ 100` or `* 100` produces six months later. `tuitionCents`
costs eight extra characters and prevents that class of mistake outright.

**On the name, again.** The module-level constants — `SESSIONS_PER_TERM`,
`RATE_CENTS_PER_SESSION` — read left to right as the sentence they compute:
"sessions per term, times rate per session in cents." I tried `TERM_SESSIONS` first, for
the first constant, to match how I might say it aloud ("this term has this many
sessions"). Question 3 — does it read at the call site? — killed it: at the multiplication
site, `TERM_SESSIONS * RATE_CENTS_PER_SESSION` reads as two unrelated fragments, while
`SESSIONS_PER_TERM * RATE_CENTS_PER_SESSION` reads as the calculation itself. The call site
is where a name has to earn its keep, not the sentence in my head while writing it.

## What it cost

`Enrolment`'s constructor grew from taking nothing to demanding three fully-computed
values, in a fixed order, before it will let an object exist. That is a real cost, not a
free win: a subclass can no longer assign its shared fields one at a time, at whatever
point in its own constructor is convenient. Every current and future subclass has to do
`Enrolment`'s arithmetic — however subclass-specific it is — entirely before calling
`super()`, then hand over the result. `GroupLessonEnrolment` and `PrivateLessonEnrolment`
both happen to need only multiplication, so this reads as clean. A subclass whose
tuition calculation genuinely needed something from the superclass — a discount rate
stored on `Enrolment`, say — could not use this shape at all, because nothing on
`Enrolment` exists yet at the point `super()`'s arguments are evaluated. I do not have a
clean answer for that case beyond "then this refactoring does not apply cleanly and you
should not force it" — which is an honest limit of the mechanic, not a gap in this
solution.

The thing I am least sure about: dropping `sessionsPerTerm` and `ratePerSessionCents` as
stored fields entirely, rather than keeping them as private fields on each subclass for a
future caller who might want to inspect them. Nothing in `tests/` reads them — they were
public in `src/` only as a side effect of being assigned with `this.`, not because any
caller needed them — so removing them is defensible. But it is a real, if small, narrowing
of what `PrivateLessonEnrolment` exposes, and `apiFrozen: true` is usually read as "do not
shrink the public surface." I judged an untested, incidental field is fair game; a
different reviewer could reasonably ask for them back as `#private` fields instead of gone
outright.

## If you took a different route

- **Leaving `tuitionCents`'s calculation in each subclass, after `super()`, and pulling up
  only `studentName`, `id`, and `enrolledOn`.** Completely defensible, and arguably more
  conservative — it stops at exactly the point where the easy reasoning runs out, rather
  than reaching for the pre-super restructuring. The cost is that `this.sessionsPerTerm *
  this.ratePerSessionCents` stays duplicated between the two subclasses, which is the
  literal smell this drill is about removing. I chose to finish the job; I would not fail
  a solution that stopped early and said plainly why.
- **Giving `Enrolment` a `protected static` helper — `Enrolment.computeTuitionCents(rate,
  sessions)` — instead of leaving the multiplication as a bare expression in each
  subclass.** Reasonable once a third subclass needs the same shape of calculation with
  different numbers; over-engineering for two, which is why I left it as two one-line
  expressions instead of introducing a shared helper for a calculation that is, today,
  just a multiplication.

What is *not* a matter of taste: computing `tuitionCents` **before** `super()`, not after.
An identical-looking assignment placed after `super()` in each subclass is still
duplicated code, full stop, no matter how it is phrased — moving it earlier than `super()`
is the only version of this move that actually removes the duplication rather than
relocating it.

## Where TypeScript makes this different from the book

Fowler's own account of this refactoring, in JavaScript, warns that a naive pull-up can
silently produce the wrong value if it reads subclass state too early — the failure is a
runtime one, caught only by a test that happens to check the number. Here, the first
version of the mistake — moving `this.sessionsPerTerm * this.ratePerSessionCents` into
`Enrolment` without also moving the fields — does not get that far: `tsc` rejects it before
the suite ever runs, because `Enrolment` has no such property. That is a strictly better
failure mode. The gap TypeScript does *not* close is the second version of the mistake —
declaring `sessionsPerTerm` and `ratePerSessionCents` as fields on `Enrolment` too, so the
property exists and the code compiles, while the *value* is still `undefined` at the
moment `Enrolment`'s constructor reads it. The type checker is satisfied; the number is
wrong. That failure is exactly as silent in TypeScript as it is in the book's JavaScript,
and it is the reason this walkthrough insists on tracing *when* each field gets its value,
not just *whether* the compiler accepts the code.
