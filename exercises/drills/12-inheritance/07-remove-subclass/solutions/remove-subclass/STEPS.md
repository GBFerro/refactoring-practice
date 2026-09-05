# Steps — a boolean field where the subclass used to be

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubt — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a subclass's every override just returns a different fixed
value derived from data the object already holds, and nothing about the override branches
on anything else. `TrialStudent` passes that test: two overridden methods, both driven
entirely by the one boolean already sitting unread in `EnrolmentInput`.

**What it costs:** the type disappears as a place to hang future trial-only behaviour.
Today the trade is free, because `enrolStudent` was already the only place either class got
constructed. See
[`drill-12-06`](../../../06-replace-type-code-with-subclasses/README.en.md) for the exact
opposite call, made for the opposite reason.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-07     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Give `Student.termFeeCents()` a `trial` branch, copied from `TrialStudent` — unreachable while `enrolStudent` still builds `TrialStudent` for trial input | `refactor: give Student its own trial branch for termFeeCents` |
| 2 | Give `Student.kindLabel()` the same treatment | `refactor: give Student its own trial branch for kindLabel` |
| 3 | Change `enrolStudent` to always construct `Student`, never `TrialStudent` — the branch goes live | `refactor: route every enrolment through Student` |
| 4 | Delete `trial-student.ts` and its import | `refactor: delete TrialStudent` |
| 5 | Tighten `Student`'s `protected input` field to a private `#input` — no subclass is left to need `protected` access | `refactor: make Student's input field private` |

Steps 1–2 and step 3 are separate on purpose: 1 and 2 cannot change behaviour, because
nothing calls the new branches yet. Step 3 is the one that can — it is only safe because
the branches copied in step 1–2 are checked, by inspection, against `TrialStudent`'s
originals first.

---

Where it lands:

```ts
export class Student {
  readonly #input: EnrolmentInput;

  termFeeCents(): number {
    return this.#input.trial
      ? Math.round(this.#input.baseFeeCents * TRIAL_FEE_FACTOR)
      : this.#input.baseFeeCents;
  }

  kindLabel(): string {
    return this.#input.trial ? "Trial" : "Regular";
  }
}
```

One class. `trial` was always sitting on the input; the subclass was the only thing
stopping it from being read.
