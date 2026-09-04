# Walkthrough — three flat exits, one decision left standing

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and the one thing
in this drill that is easy to get wrong even after you know the mechanics. Read it after
you have your own version, not before.

---

## Before anything: two kinds of conditional, one function

`staffPayoutCents` in `src/` has four `if`s nested four deep. Before touching any of them,
sort them into two piles by asking one question of each: **if this branch didn't run, would
the function still be doing its job, just for a different reason — or would it be doing a
completely different, equally valid job?**

- `staff.active`, `shift.status === "completed"`, `shift.payoutIssued` — each of these,
  when it fails, means the function is *done*: there is nothing left to compute, and `0` is
  the whole answer. None of them tells you anything about how much a shift is worth. They
  only gate whether the question is even askable.
- `staff.employmentType === "salaried"` is not like that. Neither branch is a rejection.
  Salaried and hourly are not "the normal case and an exception" — they are the two things
  this function exists to decide *between*. Delete either branch and the function no longer
  knows how to pay half its staff; delete `staff.active` and the function still knows
  exactly what it's doing, it just doesn't need to do it.

That test — *does failing this branch mean "nothing to do here" or "a different, equally
real thing to do"* — is the whole drill. The first three conditions are guards. The fourth
is a decision. Guard Clauses is a refactoring for the first kind only, and this function was
built with one of each on purpose, because the mechanical difference between them (both are
just `if`s that return) is small enough that habit will happily flatten the wrong one if you
are not asking the question.

## Why this order — and why it isn't leaves-first

`drill-06-01`'s walkthrough extracts leaves first: the smallest, most self-contained piece,
working outward, because each step then touches strictly less code than the one before.
Guard clauses invert that. You want the **outermost** condition first, because converting it
is what removes a level of indentation from *everything still below it* — including the
three conditions you haven't touched yet. Do the innermost one first (`payoutIssued`) and
you've de-nested the least code for the same amount of work; the two `if`s still wrapped
around it stay exactly as deep as they were.

So: active, then completed, then payoutIssued, then — only once there is nothing left
nesting it — turn the accumulator into direct returns.

## Steps 1–3 — peeling the guards off, one at a time

```ts
// before step 1
export function staffPayoutCents(staff: StaffMember, shift: Shift): number {
  let payoutCents = 0;
  if (staff.active) {
    if (shift.status === "completed") {
      /* ... */
    }
  }
  return payoutCents;
}

// after step 1
export function staffPayoutCents(staff: StaffMember, shift: Shift): number {
  if (!staff.active) return 0;

  let payoutCents = 0;
  if (shift.status === "completed") {
    /* ... */
  }
  return payoutCents;
}
```

Each step is the same shape: invert the condition, return the value the innermost code
would otherwise have produced (always `0` here, because none of the three guards has run
any of the payout logic yet), and dedent one level. By step 3 the function has gone from
four levels of nesting to one `if` guarding a `let` and one more `if` inside it.

**On the name.** No new name gets introduced converting `if (staff.active)` into
`if (!staff.active) return 0;` — the field name already reads as the question at the call
site, which is question 3 from [`NAMING.md`](../../../../../../docs/NAMING.md). I
considered naming the negation, `const staffHasLeft = !staff.active;`, mostly out of a
reflex to avoid a bare `!`. I rejected it: `staffHasLeft` is not true of every case this
guard rejects only by coincidence — the guard's actual job is "is this staff member payable
at all," and `active` already says that without a synonym that would need to stay in sync
with it. A variable here would be indirection paying for nothing; question 1 (does it say
what, not how) is satisfied by the field alone.

## Step 4 — the accumulator disappears

```ts
// before
let payoutCents = 0;
if (shift.payoutIssued) {
  // do nothing — payoutCents stays 0
} else if (staff.employmentType === "salaried") {
  payoutCents = staff.dailyRateCents;
} else {
  payoutCents = hourlyPayoutCents(staff.hourlyRateCents, shift.durationMinutes);
}
return payoutCents;

// after
if (shift.payoutIssued) return 0;

if (staff.employmentType === "salaried") {
  return staff.dailyRateCents;
}
return hourlyPayoutCents(staff.hourlyRateCents, shift.durationMinutes);
```

`payoutCents` existed only because the guarded code had nowhere to put its answer except a
variable declared above all four `if`s. Once the guards are all early returns, the
employment-type decision is the last thing standing, and it can return its own answer
directly — the accumulator was never a real accumulator (nothing added to it across
iterations, unlike `drill-09-01`'s loop total), it was a value waiting under four layers of
plumbing for a `return` statement it could have had all along.

**On the name.** `hourlyPayoutCents` did not change here, but it earned a second look at
this step, because it was tempting to inline its body now that the call site is a single
`return`. I kept it separate — question 2 from `NAMING.md`: `staffPayoutCents` already
means "the whole answer for one shift," and folding the per-minute arithmetic into it would
leave two different things both plausibly named "the payout." Keeping `hourlyPayoutCents`
as its own function is also what keeps `staffPayoutCents` under the strict profile's
12-line cap without trying.

## The `if`/`else` that does not become a fourth guard

This is the part of the drill that is easy to get right mechanically and wrong in spirit.
Nothing stops you from writing the last decision the same way as the three guards above it:

```ts
if (staff.employmentType === "salaried") return staff.dailyRateCents;
return hourlyPayoutCents(staff.hourlyRateCents, shift.durationMinutes);
```

I want to be precise about what this costs, because it is *not* a behaviour change and the
test suite will not catch it — I checked, by writing exactly this version and running
`npx vitest run --project drill-10-03` against it. Eight tests, eight passes. `tsc --noEmit`
is silent too. Nothing here is a bug.

What is lost is a signal, and I can point at exactly where. Read the flattened function top
to bottom:

```ts
if (!staff.active) return 0;
if (shift.status !== "completed") return 0;
if (shift.payoutIssued) return 0;
if (staff.employmentType === "salaried") return staff.dailyRateCents;
return hourlyPayoutCents(staff.hourlyRateCents, shift.durationMinutes);
```

Four `if`s that look identical, and a bare `return` at the bottom that now reads as "the
default" — the thing that happens when none of the conditions above it fired. But hourly
pay is not a default. It is one of exactly two things this function does, chosen by
`employmentType`, and calling it "whatever's left after the guards" is a lie about what the
line means, even though it computes the same number. The `if`/`else` version says this
plainly — one condition, two named outcomes, nothing implied — and the flattened version
makes you infer it from the fact that this `if` happens to be the last one in the list.

There is a second, more concrete cost, and I checked this one too rather than asserting it.
Suppose Fernbank Clinic adds a third `employmentType`, `"contractor"`, paid a per-session
rate instead of hourly or daily. I compiled both shapes against that change:

```ts
type EmploymentType = "salaried" | "hourly" | "contractor";
// ... same function bodies as above, unmodified ...
```

Neither the `if`/`else` version nor the flattened version raises a single compiler error.
Both silently pay a contractor as if they were hourly. TypeScript's exhaustiveness checking
only fires on a `switch` with no `default` and a return type that forbids falling through —
verified with `tsc --noEmit --strict` against a minimal repro of each shape, and it is why
[`drill-10-04`](../../../04-replace-conditional-with-polymorphism/README.en.md), one step
later in this module, reaches for a `switch` (and then for classes) the moment the same
type code needs deciding in more than one place: a `switch` is the shape that turns "someone
forgot to handle the new case" into a build failure instead of a silent wrong answer. An
`if`/`else` on two branches doesn't get that protection either, and the honest reading is
that the flattened version isn't *more* dangerous than the `if`/`else` in any way the
compiler can see — it's dangerous in the way a *reader* sees it, which is real but doesn't
show up in a diff of test results. It reads like there is nothing left to add a case to,
right at the one place in this function where a third case would actually need one.

So: not a bug, not a behaviour change, not something the safety net here can pin. A
legibility loss, and a real one — I would flag it in review the same way I'd flag a true
positive test failure, just with a different kind of evidence.

## What it cost

Being honest about the trade this drill asks you to make, not just the one it demonstrates:

- **Three early returns is a real increase in "where could this function exit" for a
  reader**, and I do not think that cost disappears just because it is smaller than the
  nesting it replaced. A function with three guards is easier to hold in your head than one
  with four levels of indentation; a function with eight guards is not obviously easier
  than a deeply nested nightmare, it is just a different-shaped one. This file stops well
  short of that line. I would not promise it stays that way forever without a rule for when
  guards themselves need consolidating — and Fowler's own next move for a growing pile of
  guards is usually **Consolidate Conditional Expression**, covered next door in
  `drill-10-02`, not more guard clauses stacked on guard clauses.
- **I am not fully sure the three guards should return the same value (`0`) with no
  indication of *which* precondition failed.** A caller who wants to tell "this staff member
  left the clinic" apart from "this shift already got paid" cannot, from this function's
  return value alone — both are `0`. For a payroll report that needs to explain a `$0` line
  to someone, that is a real gap, and closing it would mean widening the return type (a
  result object, or a reason code) rather than anything Guard Clauses itself offers. I left
  it out because introducing that would be a second refactoring — **Introduce Special
  Case** or a parameter object riding on top of this one — and this drill has one smell to
  fix. I would raise it as the first thing worth doing next if this were real code.

## If you took a different route

- **Combining two guards with `||`** — `if (!staff.active || shift.status !== "completed") return 0;`
  — is a real option and changes nothing about behaviour. I kept them as three separate
  `if`s because each one is a *different reason* to pay nothing, and the strict profile's
  complexity budget does not actually reward merging them: an `if` with an `||` inside it
  costs the same two points of cyclomatic complexity as two separate `if`s, so nothing is
  gained by combining them except fewer lines, at the cost of a reader no longer being able
  to set a breakpoint on "this staff member wasn't active" specifically.
- **Guarding `shift.payoutIssued` before `shift.status`.** Also fine — these three guards
  do not depend on each other, so their order among themselves is not load-bearing the way
  guard-before-decision is. I ordered them active, then completed, then payoutIssued,
  roughly from "least specific to this shift" to "most specific to this shift," but that is
  a readability preference, not a rule.

What is *not* a matter of taste: turning the fourth `if` into a guard clause because it is
syntactically identical to the first three. That is the mistake this drill is built to
surface, and the tests will not catch it for you.

## Where TypeScript makes this different from the book

Fowler's guard-clause examples are JavaScript, where there is no type-level difference
between "this `if` is a precondition" and "this `if` is a decision" — both are just
booleans. TypeScript doesn't add one here either, and that absence is the point of the
"contractor" experiment above: strict mode, `noUncheckedIndexedAccess`, all of it, and
still nothing stops you from writing the payout decision as a fourth guard, because a
two-armed `if`/`else` was never a place TypeScript checks for completeness. The one place
it *does* check — a `switch` with no `default`, return type `number` — is exactly the shape
`drill-10-04` moves to once the same decision has to be made in more than one function. That
is not a coincidence: it is the same signal (a type code driving a decision) showing up
twice, once too small for the compiler to help and once large enough that it can.
