# Steps — one billingAmountCents(), shared by both lesson types

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when two subclasses each implement a method that does the same
job, in the same shape, and nothing about either implementation depends on which subclass
it's on. `PrivateLesson` and `GroupLesson` both compute tuition plus a flat fee; neither
reads a field the other lacks once the fee is named the same thing.

**What it costs:** `Lesson` gains a field and a method neither subclass used to declare for
itself. A private lesson's materials fee and a group lesson's supplies fee now have to mean
literally the same thing forever, not just today — see
[`drill-12-04`](../../../04-push-down-method/README.en.md) for the same question asked
about a method that only one subclass wants, not both.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-01     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Rename `GroupLesson`'s private `#suppliesFeeCents` to `#materialsFeeCents` | `refactor: rename GroupLesson's fee field to match PrivateLesson` |
| 2 | Confirm both `billingAmountCents()` bodies are now textually identical | (no code change — a checkpoint) |
| 3 | Pull Up Field: move `materialsFeeCents` onto `Lesson`, set via `LessonProps` and threaded through both constructors | `refactor: pull up materialsFeeCents to Lesson` |
| 4 | Pull Up Method: move `billingAmountCents()` onto `Lesson`; delete both subclass copies | `refactor: pull up billingAmountCents to Lesson` |
| 5 | Simplify `invoiceLine` and `totalBillingCents`'s parameter from the `PrivateLesson \| GroupLesson` union to `Lesson` | `refactor: invoice functions take a Lesson, not a lesson union` |

Step 1 is renaming a *private* field only — the public constructor property was already
called `materialsFeeCents` on both classes, so no caller anywhere needs to change. Steps 3
and 4 are separate because step 4 has nothing to pull up to until step 3 has given `Lesson`
somewhere to put it.

---

Where it lands:

```ts
export abstract class Lesson {
  protected readonly materialsFeeCents: number;

  billingAmountCents(): number {
    const tuitionCents = (this.tutor.hourlyRateCents * this.durationMinutes) / 60;
    return Math.round(tuitionCents + this.materialsFeeCents);
  }
}

// PrivateLesson and GroupLesson: no billingAmountCents() of their own left to read.
```

One method, one field, and a private lesson's fee and a group lesson's fee can no longer
drift apart without someone noticing the rename.
