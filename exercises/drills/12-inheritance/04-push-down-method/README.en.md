[🌐 English](./README.en.md)

# Push Down Method

`Chapter 12` · `Push Down Method` · `●○○` · ~20 min

## Context

Beckworth Music School employs two kinds of tutor. Staff tutors are salaried and paid
through payroll for the hours they log each week. Freelance tutors invoice the school
directly for each lesson they teach, at their own negotiated rate, and never appear on a
payroll run at all. Both kinds show up in the same tutor roster and teach the same lessons.

## The smell

**Refused Bequest.** `Tutor` declares `weeklyPayrollHours()`, and both `StaffTutor` and
`FreelanceTutor` inherit it. Only `StaffTutor` is ever actually paid that way — nothing in
this codebase, and nothing at Beckworth, ever asks a freelance tutor for their "payroll
hours," because freelance tutors don't have any. `FreelanceTutor` inherits a method that
answers a question about it the business never asks, which is exactly what it means for a
subclass to refuse part of what its superclass hands it.

## The target

**Push Down Method**: move `weeklyPayrollHours()` off `Tutor` and onto `StaffTutor` alone.
Nothing about what the report computes today needs to change — the caller that builds a
payroll report already narrows to staff tutors before asking for hours. What changes is
what the *type system* allows: after this move, there is no way to write code that asks a
plain `Tutor` (or a `FreelanceTutor`) for payroll hours and have it compile.

## Done when

- `Tutor` no longer declares `weeklyPayrollHours()`, in any form.
- `StaffTutor.weeklyPayrollHours()` returns exactly what it did before.
- `weeklyPayrollReport`'s output is unchanged for every existing caller.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters -
  `npm run lint:strict -- exercises/drills/12-inheritance/04-push-down-method/solutions` is
  the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Grep for `weeklyPayrollHours` across the whole exercise before changing anything. Count how
many places call it, and on what type each caller believes it's calling it on. If every call
site already narrows to staff before calling it, the method moving down should not change
what any of them compute — only what the compiler will let a *new* call site get away with.
</details>

<details>
<summary>Does anything need to change in `payroll.ts`?</summary>

Look closely at how `weeklyPayrollReport` currently decides who is staff. A check against a
string field compiles today because the method is available on every `Tutor` regardless of
the check's result — the filter's *result type* was never load-bearing. Once the method only
exists on `StaffTutor`, that same string check stops being enough for the compiler to let you
call it on the filtered result, and the filter has to become an honest type predicate.
</details>

<details>
<summary>Is this even the right fix? Wouldn't `Replace Subclass with Delegate` also work?</summary>

Maybe, and it's worth asking. Push Down Method is the right call when a method needs to
leave the shared type but the rest of the hierarchy still earns its keep — `StaffTutor` and
`FreelanceTutor` still share real state and behaviour beyond this one method. If "how is this
tutor paid" turned out to be the *only* thing that ever varied between them, that would be a
different signal, and `WALKTHROUGH.md` says more about where that line is.
</details>

## Reading

*Refactoring*, 2nd edition - chapter 12, *Push Down Method*; chapter 3, *Refused Bequest*.
