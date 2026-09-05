# Steps — weeklyPayrollHours(), staff only

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a superclass method is only ever meaningfully called on one
subclass, and every existing call site already knows that, one way or another, before
calling it. `weeklyPayrollHours()` passes both tests — `FreelanceTutor` never calls it, and
`weeklyPayrollReport` already narrows to staff before asking for hours.

**What it costs:** `FreelanceTutor` loses a method it never called, so nothing observable
changes today. What changes is what the compiler will allow tomorrow — a future call site
that forgets to narrow now fails to build instead of quietly compiling against a method that
was never meant for it. See [`drill-12-01`](../../../01-pull-up-method/README.en.md), where
the same forwarding-method question runs in the opposite direction for a method both
subclasses genuinely share.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-04     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `StaffTutor.weeklyPayrollHours()`, identical body to the one on `Tutor` | `refactor: add weeklyPayrollHours directly to StaffTutor` |
| 2 | Delete `weeklyPayrollHours()` from `Tutor` | `refactor: remove weeklyPayrollHours from Tutor` |
| 3 | Fix the resulting compile error in `weeklyPayrollReport`: replace the `kind === "staff"` filter with an `isStaffTutor` type predicate | `refactor: narrow to StaffTutor with a type predicate, not a string check` |
| 4 | Delete the now-unused `kind` field and `TutorKind` type from `Tutor` | `refactor: remove the kind discriminant, now redundant` |

Step 1 is pure addition and cannot break anything the suite already checks - it exists so
step 2 has somewhere safe to land. Step 3 is not optional cleanup: after step 2, the
original `kind`-based filter genuinely fails to typecheck, because a boolean-returning
filter callback does not narrow the array's element type the way a type predicate does.

---

Where it lands:

```ts
export abstract class Tutor {
  constructor(
    readonly name: string,
    protected readonly lessonsThisWeek: readonly LoggedLesson[],
  ) {}
}

export class StaffTutor extends Tutor {
  weeklyPayrollHours(): number { /* ... */ }
}

// payroll.ts
function isStaffTutor(tutor: Tutor): tutor is StaffTutor {
  return tutor instanceof StaffTutor;
}
```

No `kind` field left to go stale, and no way to write `someTutor.weeklyPayrollHours()`
without the compiler first making you prove `someTutor` is staff.
