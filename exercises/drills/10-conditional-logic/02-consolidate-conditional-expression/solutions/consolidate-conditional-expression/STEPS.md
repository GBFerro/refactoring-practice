# Steps — one name for the three that agree, one guard for the one that doesn't

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the trap in step 2 — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when several separate `if` statements all produce the same result
and none of them has a side effect — then, and only after checking, because this drill has
one that looks like it qualifies and does not. Compare
[`drill-10-01`](../../../01-decompose-conditional/), the mirror-image problem: one tangled
condition whose *parts* need names, not several conditions that are already one idea.

**What it costs:** `isPriorityCase` reads as a single rule instead of three, which is a
clear win — but `isEligibleForSameDaySlot` now has to say out loud, in a comment, that a
fourth condition is deliberately kept out of it. A reader who only skims `isPriorityCase`
and assumes it's the whole eligibility story will miss that a nurse gets paged.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-10-02     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Check each of the four conditions for a side effect before merging anything | *(no code change — see WALKTHROUGH.md)* |
| 2 | Extract the fourth `if` (the paging one) into `pageOnCallNurseIfFlagged`, called unconditionally, before touching the other three | `refactor: extract pageOnCallNurseIfFlagged, called unconditionally` |
| 3 | Consolidate the three side-effect-free conditions with `\|\|` into a single `if` | `refactor: consolidate the three side-effect-free conditions` |
| 4 | Extract the consolidated condition into `isPriorityCase` | `refactor: extract isPriorityCase` |
| 5 | Replace the `let eligible` accumulator with a direct `return isPriorityCase(patient) \|\| nursePaged;` | `refactor: return the consolidated result directly` |

Step 1 produces no diff — it's the precondition check Consolidate Conditional Expression
requires and this repository's own review focus asks about. Skipping it is how the bug in
`tests/eligibility.spec.ts`'s "still pages ... through triage" test gets introduced: merge
all four into one `\|\|` chain, and the paging call stops firing whenever the patient
already qualifies through triage, age, or chronic condition — because `\|\|` short-circuits
and a `true` earlier in the chain means the later clause is never evaluated.

---

Where it lands:

```ts
export function isEligibleForSameDaySlot(patient: Patient, log: OnCallLog): boolean {
  const nursePaged = pageOnCallNurseIfFlagged(patient, log);
  return isPriorityCase(patient) || nursePaged;
}
```

Three conditions collapsed into one name; the fourth stays a named function of its own,
called first and unconditionally, specifically so it keeps running regardless of what
`isPriorityCase` returns.
