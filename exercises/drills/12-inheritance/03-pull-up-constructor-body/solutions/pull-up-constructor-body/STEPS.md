# Steps — one shared prologue, computed before super() where it has to be

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and why step 3 cannot be done
the way steps 1 and 2 were — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when two or more subclasses each open their constructor with the
same handful of statements, and `Enrolment` — the class both of them extend — currently
does nothing at all. `PrivateLessonEnrolment` and `GroupLessonEnrolment` validate the same
way, build an id the same way, and store `enrolledOn` the same way; only the tuition
number and one field afterward are genuinely theirs.

**What it costs:** `Enrolment`'s constructor now takes three parameters instead of zero,
and every current and future subclass must arrive with all three already computed — a
subclass can no longer assign its shared fields at its own pace, one line at a time, the
way it could when the prologue lived in the subclass itself.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-03     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Give `Enrolment` a constructor that takes `studentName`, validates it, and derives `id` from it. Both subclasses call `super(studentName)` and delete their own copies of the check and the id line | `refactor: pull student-name validation and id into Enrolment` |
| 2 | Add `enrolledOn` as `Enrolment`'s second constructor parameter; both subclasses pass it through `super()` and delete their own `this.enrolledOn = enrolledOn` line | `refactor: pull enrolledOn into Enrolment` |
| 3 | In each subclass, stop storing `sessionsPerTerm` and `ratePerSessionCents` as fields — compute their product as a local constant **before** calling `super()`, and pass it as `super`'s third argument. Add `tuitionCents` as `Enrolment`'s third parameter | `refactor: compute tuitionCents before super() and pull its storage into Enrolment` |

Steps 1 and 2 are the easy half: every value they move depends on nothing but a
constructor parameter, so there is no wrong order to get them in. Step 3 is the one this
drill is actually about — see **Why this order** in the walkthrough for why it could not
happen first, and why it could not happen the way steps 1 and 2 did.

---

Where it lands:

```ts
export abstract class Enrolment {
  protected constructor(studentName: string, enrolledOn: string, tuitionCents: number) {
    // validate, derive id, store all three
  }
}

export class PrivateLessonEnrolment extends Enrolment {
  constructor(studentName: string, enrolledOn: string, instrumentTutor: string) {
    super(studentName, enrolledOn, SESSIONS_PER_TERM * RATE_CENTS_PER_SESSION);
    this.instrumentTutor = instrumentTutor;
  }
}
```

One constructor holds the prologue every enrolment shares. Each subclass's own constructor
holds exactly two things: the arithmetic only it knows how to do, computed before `super()`
runs, and the one field that was never shared to begin with.
