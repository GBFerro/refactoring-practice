# Walkthrough — one class per appointment type, one switch left at the factory

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and — because
this is the drill where it matters most — what you actually give up by doing this at all.
Read it after you have your own version, not before.

---

## Before anything: three switches, not one

`src/` has three functions - `appointmentDurationMinutes`, `appointmentFeeCents`,
`appointmentPrepInstructions` - each in its own file, each with its own
`switch (type) { case "checkup": ...; case "vaccination": ...; case "bloodDraw": ... }`.
Run `npx oxlint exercises/drills/10-conditional-logic/04-replace-conditional-with-polymorphism`
against it before touching anything: it is clean. No line-count rule, no complexity rule,
no duplication checker in this repository's lint profile flags three separate ten-line
switches over the same type in three separate files, because none of them, on its own, is
too long or too complex. **Repeated Switches is a smell a linter cannot see.** You see it
by asking a question no tool asks for you: if Fernbank Clinic adds a fourth appointment
type tomorrow, how many files does someone have to remember to touch, and what happens if
they only remember two of the three?

That question is the whole justification for this drill, and it is worth being precise
about it, because the same question with a different answer argues the other way. **One**
switch on `AppointmentType`, on its own, is not this smell - it is just a switch, and
turning one switch into three classes and a factory would be spending real complexity to
solve a problem that doesn't exist yet. Three switches, all keyed on the same type, all of
which have to be found and extended together, is the specific shape *Replace Conditional
with Polymorphism* answers. Count them before you reach for this.

## Why this order

Build the shape empty first (steps 1-2), then migrate one switch at a time (steps 3-5).
The alternative - moving `appointmentDurationMinutes`'s logic onto the classes before the
classes exist - isn't really an alternative, it's the same two steps with the scaffolding
written inline instead of up front; I split them because "create the type, then fill it in"
keeps each individual diff reviewable, the same reasoning `drill-07-05`'s walkthrough gives
for creating an empty `ContactDetails` before moving anything into it.

Within steps 3-5, order doesn't matter - the three switches don't depend on each other. I
did duration first because `number` is the simplest return type to get right, and left
`feeCents`, the one method that takes a parameter, for after I'd settled the shape once.

## Steps 1-2 — the shape, empty

```ts
// appointment.ts
export abstract class Appointment {
  abstract durationMinutes(): number;
  abstract feeCents(insured: boolean): number;
  abstract prepInstructions(): string;
}

// appointment-factory.ts
export function createAppointment(type: AppointmentType): Appointment {
  switch (type) {
    case "checkup": return new CheckupAppointment();
    case "vaccination": return new VaccinationAppointment();
    case "bloodDraw": return new BloodDrawAppointment();
  }
}
```

**On the name.** I named the abstract class `Appointment`, not `AppointmentHandler` or
`AppointmentStrategy`. `Handler` is on the list in
[`NAMING.md`](../../../../../../docs/NAMING.md) of suffixes that fail question 2 by
construction - a category, not a name - and I rejected `Strategy` for a related reason:
it names the *pattern* this class happens to implement, not the *domain thing* it
represents. Question 1 - does it say what, or how - is exactly the test that catches this:
a caller who reads `Appointment` learns what the object is; a caller who reads
`AppointmentStrategy` learns something about this codebase's design vocabulary, which is
not their problem to know.

Each concrete class kept the type-code word plus the suffix -
`CheckupAppointment`, not bare `Checkup`. Question 2: `Checkup` alone, declared as
`class Checkup extends Appointment`, could plausibly be mistaken at a glance for a
different kind of checkup entirely (a code-quality checkup, a health check on the server) -
the file is small enough that this is a mild risk, not a real one, but the suffix costs
nothing and removes the question.

**On the name.** `createAppointment`, not `getAppointment`. This is question 4 - is it
true - and it's the sharpest of the three name calls in this file: `get` promises retrieval
of something that already exists, with the implication that calling it twice for the same
type might hand back the same thing, or at least something cheap. `createAppointment`
allocates a fresh object on every call, always, and `create` says so. I also considered a
static factory, `AppointmentFactory.create(type)`, and rejected it as unneeded ceremony - a
plain function is this repository's convention for this exact refactoring (see chapter 11's
*Replace Constructor with Factory Function*, which this same file quietly performs a small
version of), and a class with one static method here would be a class for the sake of
having one.

## Steps 3-5 — moving the switches, one at a time

```ts
// billing.ts, before
export function appointmentFeeCents(type: AppointmentType, insured: boolean): number {
  switch (type) {
    case "checkup": return insured ? 2000 : 12000;
    case "vaccination": return insured ? 0 : 4500;
    case "bloodDraw": return insured ? 1500 : 6000;
  }
}

// billing.ts, after
export function appointmentFeeCents(type: AppointmentType, insured: boolean): number {
  return createAppointment(type).feeCents(insured);
}

// checkup-appointment.ts
feeCents(insured: boolean): number {
  return insured ? 2000 : 12000;
}
```

Each step is a cut-and-paste of one `case` body into one class method, repeated three
times, followed by collapsing the original switch into a one-line delegation. Nothing about
the arithmetic changes - `insured ? 2000 : 12000` is byte-identical before and after, just
relocated. That is what makes this refactoring, unlike most of this chapter's, mechanically
almost risk-free: there is no logic to get subtly wrong, only bookkeeping about which value
went to which class.

**On the name.** `feeCents`, not `fee` or `getFee`. This repository's own convention, from
[`NAMING.md`](../../../../../../docs/NAMING.md)'s table - a unit-bearing number carries its
unit in the name, `paceSecondsPerKm` rather than `pace` - applies to a method's return
value exactly as much as to a variable. `fee(insured): number` compiles fine and reads
fine until the day someone forgets whether it returns cents or dollars and multiplies a
bill by 100 twice. `feeCents` forecloses that question at every call site, including the
ones inside the three subclasses themselves.

## What this actually costs

The honest section, and the one this drill exists to make you sit with rather than take on
faith.

**Reading "everything about a checkup" got better. Reading "everything about duration" got
worse.** Before this refactoring, `appointmentDurationMinutes` was one switch - three lines,
three numbers, side by side, and you could answer "which type has the shortest slot" by
looking at one screen. After it, that same question means opening
`checkup-appointment.ts`, `vaccination-appointment.ts`, and `blood-draw-appointment.ts` and
finding the same method in each. This is Fowler's own framing for this refactoring, not
something this drill discovered: a conditional organizes information by *operation* (rows),
polymorphism organizes it by *type* (columns), and transposing a table doesn't make the
information denser, it just changes which query is a scan and which is a hunt. This drill's
domain has three operations and three types - small enough that the cost is barely visible.
Real appointment scheduling systems have more of both, and the trade gets sharper in both
directions as they grow.

**Adding a new operation is now the expensive direction.** Suppose Fernbank Clinic wants a
fourth thing every appointment type answers - a CPT billing code, say. In the switch-based
version, that's one new function with one new three-case switch, written once, touching
nothing that exists today. In the class-based version, it's a new abstract method on
`Appointment` and a concrete implementation added to *every* subclass - three edits instead
of one, and `tsc` will at least force you to make all three (an abstract method left
unimplemented is a compile error), but it is still three files touched for one new fact.
Polymorphism made adding a new *type* cheap (one new class, no existing code edited) at the
direct cost of making adding a new *operation* expensive. This drill only exercises the
first direction; a real codebase eventually needs both, and whichever happens more often in
practice is the one that should have driven this decision, not which one happened to be the
hook here.

**A lookup table would have done almost all of this for less code, and I want to be
specific about where "almost."** Nothing in this domain needs inheritance, virtual dispatch,
or an object with identity - every appointment type is three constants and one two-armed
ternary, known completely at compile time. A plain data table says the same thing with no
classes at all:

```ts
const APPOINTMENT_DEFINITIONS: Record<AppointmentType, AppointmentDefinition> = {
  checkup: { durationMinutes: 20, feeCents: (insured) => (insured ? 2000 : 12000), prepInstructions: "No preparation needed." },
  vaccination: { durationMinutes: 10, feeCents: (insured) => (insured ? 0 : 4500), prepInstructions: "Bring your vaccination card." },
  bloodDraw: { durationMinutes: 15, feeCents: (insured) => (insured ? 1500 : 6000), prepInstructions: "Fast for 8 hours before your appointment." },
};
```

That removes `createAppointment`, all three classes, and every `new`, and it is genuinely
less code than what this drill ships. I built the classes anyway, because the brief asks
specifically for *Replace Conditional with Polymorphism* and because that is a real,
separate skill from writing a lookup table - but if this file had landed on my desk without
an assigned refactoring, the lookup table is what I would have reached for first, and I
would only have promoted it to classes the day a method needed real per-type *behaviour*
that a value can't express - state that persists across calls, an override of shared logic,
something that depends on more than its own inputs. Nothing here does. If your own instinct
while writing this drill was "why are these classes," that instinct was correct about this
file in isolation; it's correct about the drill only because the assignment is polymorphism
specifically, not because polymorphism was this file's best answer on its own merits.

## If you took a different route

- **The lookup table above**, as the actual submission rather than a caveat. Fully
  defensible, and arguably the better engineering call for this exact file - see above. Not
  what this drill asks for, which is worth naming rather than pretending the classes were
  the only reasonable design.
- **Interfaces instead of an abstract class.** `Appointment` here declares three abstract
  methods and provides no shared implementation, which is exactly what a TypeScript
  `interface` is for, and using one would produce zero runtime code instead of a real class
  and prototype chain. I kept the abstract class because it gives future shared logic
  somewhere to live without restructuring - if two appointment types ever want to share a
  default `prepInstructions()`, an interface has no home for that and an abstract class
  already does. That is a bet on the future, not a fact about the code today, and a
  reviewer could reasonably call it premature.
- **A single `Appointment` class taking `type` as a constructor argument and branching
  internally**, rather than three subclasses. This reintroduces exactly the switch the
  drill is meant to remove, just moved inside one class instead of spread across three
  functions - not a variant worth choosing, but a shape worth recognizing if you catch
  yourself halfway toward it.

What is *not* a matter of taste: leaving more than one switch on `AppointmentType` anywhere
in the finished solution. `createAppointment`'s switch is the one the book expects to
remain - constructing an object still has to decide which one to construct somehow - but a
second switch surviving inside a class method, or reappearing at a new call site, is the
smell this drill exists to remove showing back up.

## Where TypeScript makes this different from the book

Fowler's polymorphism examples are JavaScript, where a `switch` with a missing `case` is
silently absent - nothing checks it, at compile time or otherwise. `createAppointment`
here does not have a `default` clause, and I confirmed, rather than assumed, what that
buys: compiling this file's `AppointmentType` extended with a fourth member and no matching
`case` in `createAppointment` fails with `tsc --noEmit --strict` under exactly this
repository's `tsconfig.base.json` - "not all code paths return a value" - the same
exhaustiveness check verified in
[`drill-10-03`](../../../03-replace-nested-conditional-with-guard-clauses/README.en.md)'s
walkthrough. That is real, compiler-enforced protection this repository's TypeScript setup
gives you for free the moment the decision is a `switch` with a return type that forbids
`undefined`, and it is a large part of why `createAppointment`'s switch is the one this
drill is comfortable leaving behind: forgetting to teach it about a new appointment type is
not a silent bug here, it is a build failure.
