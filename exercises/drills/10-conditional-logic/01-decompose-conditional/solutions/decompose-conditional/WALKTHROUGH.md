# Walkthrough — one name each for the question and the two answers

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## This is Extract Function, wearing a conditional

If you did `drill-06-01`, you already know the mechanics here: cut a piece of a function
out, give it a name, pass in what it needs. Nothing about *how* you extract is different
for a condition or a branch than it was for a block of loop body. Decompose Conditional is
Extract Function, applied three times, to the three pieces every `if`/`else` is made of —
the test, the consequent, and the alternative.

What's actually new in this drill isn't the move. It's recognising that a condition
*deserves* a name in the first place. It is easy to see a seventy-line function and think
"this needs extracting." It is much easier to look at a four-line `if` and think it's
already small enough to read in place — and that is exactly the trap.

## Before anything: read the condition as a sentence

```ts
if (
  appt.startMinute < 480 ||
  appt.startMinute + appt.durationMinutes > 1080 ||
  appt.isWeekend ||
  appt.isPublicHoliday
)
```

Try to say this out loud without looking at the code. You can't, not accurately, because
`480` and `1080` don't mean anything until you've done the arithmetic — 8 a.m. and 6 p.m.,
in minutes since midnight, and you have to know the clinic's hours to know that. The
condition is four clauses long and every one of the first two needs decoding before you can
tell what it's asking.

That's the smell this drill names: **Mysterious Name**. Not "no name" — the condition and
both branches are perfectly compilable without one. Mysterious in the specific sense that
chapter 3 means it: the reader has to do work that a name would have done for them, every
single time they pass through this function.

## Why this order

Constants before extraction, always. If you extract `isOutOfHours(appt)` while `480` and
`1080` are still sitting inside it, you've moved the mystery, not solved it — now it's
hiding one level down instead of at the call site. Naming the boundaries first means the
extracted function reads in English the moment it exists.

After that, condition before branches. The condition is what makes the two branches make
sense at all — "out of hours" is the reason the charge differs, so naming it first gives you
the vocabulary the branch names get to use. Extracting `outOfHoursChargeCents` before
`isOutOfHours` existed would have worked, but the name would have had nothing to react
against; you'd be guessing at "out of hours" from the arithmetic alone instead of reading it
off a condition that already says so.

## Step 1 — name the boundaries

```ts
// before
appt.startMinute < 480 ||
appt.startMinute + appt.durationMinutes > 1080

// after
const CLINIC_OPENS_MINUTE = 8 * 60;
const CLINIC_CLOSES_MINUTE = 18 * 60;
// ...
appt.startMinute < CLINIC_OPENS_MINUTE ||
appt.startMinute + appt.durationMinutes > CLINIC_CLOSES_MINUTE
```

Mechanically this is Extract Variable, not Extract Function — the book keeps these as
separate catalog entries even though they're close cousins, and `drill-06-03` is where that
one gets its own drill. It shows up here because you can't write a truthful
`isOutOfHours` in step 2 while it still contains two numbers nobody can read.

**On the name.** `CLINIC_OPENS_MINUTE`, not `OPEN_TIME` or `OPENING`. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — rules out `OPEN_TIME`: this
constant isn't a time, it's an offset in minutes from midnight, and a reader who later adds
a real `Date`-based open time would collide with a name that no longer means what it says.
`8 * 60` instead of `480` is deliberate too: the arithmetic is the derivation, left visible,
rather than a number a reader has to reverse-engineer.

## Step 2 — name the condition

```ts
// before
if (
  appt.startMinute < CLINIC_OPENS_MINUTE ||
  appt.startMinute + appt.durationMinutes > CLINIC_CLOSES_MINUTE ||
  appt.isWeekend ||
  appt.isPublicHoliday
) { /* ... */ }

// after
if (isOutOfHours(appt)) { /* ... */ }

function isOutOfHours(appt: Appointment): boolean {
  return (
    appt.startMinute < CLINIC_OPENS_MINUTE ||
    appt.startMinute + appt.durationMinutes > CLINIC_CLOSES_MINUTE ||
    appt.isWeekend ||
    appt.isPublicHoliday
  );
}
```

This is the step that matters most in the whole exercise, and it's also the shortest diff.
Four clauses become one word at the call site. The reader no longer needs to know *why*
weekends and holidays surcharge the same way as early mornings — that's now a fact
`isOutOfHours` is responsible for, not a fact every caller has to reconstruct.

**On the name.** `isOutOfHours`, not `checkHours` or `shouldSurcharge`. Question 1 — what,
not how — is what rules out `checkHours`: "check" describes an action on the function, not
a fact about the appointment, and it doesn't say what a `true` result means. I also
considered `isSurchargeable`, and rejected it on question 4: it's true today, but it smuggles
in an assumption — that being out of hours is the *only* reason to surcharge — that this
function doesn't actually make and that a later reader shouldn't be able to infer from the
name. `isOutOfHours` says exactly what it checks and nothing about what happens as a result.

## Step 3 — name the expensive branch

```ts
// before
rawCents = tariff.baseFeeCents * tariff.outOfHoursMultiplier + tariff.outOfHoursSurchargeCents;

// after
rawCents = outOfHoursChargeCents(tariff);

function outOfHoursChargeCents(tariff: Tariff): number {
  return tariff.baseFeeCents * tariff.outOfHoursMultiplier + tariff.outOfHoursSurchargeCents;
}
```

Two things are folded into this one line before extraction — a multiplier and a flat
surcharge — and neither is explained. After extraction they still aren't explained *inside*
the function, but the reader calling it no longer needs the explanation to use it correctly.
That's the whole trade this refactoring makes: it doesn't make the arithmetic simpler, it
moves the burden of understanding it from every call site to one place.

**On the name.** `outOfHoursChargeCents`, matching this repository's convention for
unit-bearing numbers from `NAMING.md`'s table — `paceSecondsPerKm`, not `pace` — so `Cents`
rides along rather than being left implicit. I rejected `outOfHoursFeeCents`: "fee" is
already claimed by `tariff.baseFeeCents`, the raw number this function marks up, and reusing
it here would fail question 2 — could this name be something else in this file? Yes,
specifically the field it's built from.

## Step 4 — name the ordinary branch

```ts
// before
rawCents = tariff.baseFeeCents * tariff.gstMultiplier;

// after
rawCents = standardChargeCents(tariff);

function standardChargeCents(tariff: Tariff): number {
  return tariff.baseFeeCents * tariff.gstMultiplier;
}
```

This branch is one line, and extracting a one-line function is exactly the move
`drill-06-02` warns is sometimes Lazy Element instead of progress — a function whose name
tells you less than its body did. I extracted it anyway, and here's the actual case for it,
not just a reflex: `standardChargeCents` and `outOfHoursChargeCents` are answers to the
*same question* — "what does this appointment cost" — asked under two different conditions.
Leaving one of them inline while the other is a named function would make the `if`/`else`
lopsided: one branch reads as a sentence, the other as an expression, and a reader has to
notice that asymmetry means nothing before they can trust it. Paired branches earn paired
treatment.

**On the name.** `standardChargeCents`, not `inHoursChargeCents` or `normalChargeCents`. I
went through both. `inHoursChargeCents` is the literal opposite of `outOfHoursChargeCents`
and I like that symmetry, but question 3 — does it read at the call site? — argues against
it: `if (isOutOfHours(appt)) { ... } else { standardChargeCents(...) }` reads oddly, because
the `else` branch isn't "in hours," it's "the default, absent any of the four reasons to
surcharge." `standardChargeCents` says that directly. `normalChargeCents` lost on question 4
— "normal" implies the surcharged case is abnormal, which is a judgement this function isn't
making, just a fact about which condition held.

## What this drill has in common with `drill-10-02`, and what it doesn't

This drill and [`drill-10-02`](../../../02-consolidate-conditional-expression/) are opposite
moves on the same material, and it's worth being explicit about the difference rather than
letting them blur together, because on the surface both are "clean up an `if`."

Here, you start with **one** condition that is tangled, and the fix is to give its **parts**
names — the test gets one name, each branch gets its own. You're pulling one thing apart.

`drill-10-02` starts with **several** separate conditions, each guarding its own `if`, that
turn out — on inspection — to already be answers to the same question. The fix there is to
give the **whole** a single name, collapsing several `if`s into one. You're pushing several
things together.

If you find yourself reaching for Decompose Conditional on a function that has four separate
`if` statements all returning the same thing, or reaching for Consolidate Conditional
Expression on one four-clause condition with two different branches, you have the two drills
backwards. The tell is which direction the arrows point: one condition splitting outward
into names, or several conditions collapsing inward into one.

## What it cost

The honest part.

- **Four functions for four lines of original logic** is a real cost for a function this
  small. `appointmentChargeCents` was seven lines before this drill and is seven lines
  after it — the difference is entirely in *whose* seven lines they are. A reader now has
  to trust `isOutOfHours`, `outOfHoursChargeCents`, and `standardChargeCents` rather than
  read one paragraph. For this function, I think that trade is clearly worth it, because the
  paragraph was never actually readable — but I would not make the same call on a condition
  half this tangled. There's a threshold below which decomposing a conditional just adds
  indirection, and this exercise is deliberately built to sit above it, not at it.
- **I'm not fully sure about extracting the standard-hours branch** (step 4). The argument
  for symmetry in that step is real, but a reviewer could reasonably say a single field
  access dressed up as a function is exactly the Lazy Element pattern `drill-06-02` exists to
  warn about, and that the asymmetry I was worried about is honest — the two branches
  genuinely aren't doing the same amount of work, so why should they look like they are? I
  kept the extraction. I would not be surprised to be argued out of it.

## If you took a different route

- **Extracting the branches before the condition.** Workable, but you'd be naming
  `outOfHoursChargeCents` before you had a name for what "out of hours" even referred to —
  more guessing, same destination.
- **Leaving `standardChargeCents` inline**, per the doubt above. Defensible, and arguably the
  more disciplined call.
- **A single boolean local instead of extracting `isOutOfHours` as a function** —
  `const outOfHours = ...;` computed once and reused. This preserves behaviour identically
  and reads almost as well at the one call site this function has. I chose a function
  because `isOutOfHours` is a *fact about an appointment*, not a fact about this particular
  calculation, and a second caller (a booking-confirmation email, say, that also wants to
  warn about a surcharge) shouldn't have to recompute it. Reasonable people would pick the
  local for a function with exactly one caller and no foreseeable second one.

What is *not* a matter of taste: leaving `480` and `1080` as unexplained literals inside
whichever function ends up holding them. Wherever the boundary check lives, it has to be
readable as "opens" and "closes," not as arithmetic a reader has to run in their head.

## Where TypeScript makes this different from the book

Fowler's Decompose Conditional example is JavaScript, and nothing about the extraction
itself needs a type system — this is a pure naming-and-boundary exercise, and TypeScript's
role here is smaller than it was in `drill-06-01`. The one place it earns its keep: the
`Appointment` and `Tariff` interfaces mean `isOutOfHours` and `outOfHoursChargeCents` have
parameter types that document, at the signature, exactly what each extracted piece needs —
a caller reading `function outOfHoursChargeCents(tariff: Tariff): number` knows it needs a
whole `Tariff`, not an `Appointment`, without reading the body. In JavaScript that boundary
is only visible once you read what the function actually touches.
