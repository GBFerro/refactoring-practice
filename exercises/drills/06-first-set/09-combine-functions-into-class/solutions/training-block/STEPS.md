# Steps — one TrainingBlock the sheet asks questions of

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and why this order and not a
different one — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** several functions all take the same group of records and derive
related facts from them, and callers hold onto the pair for more than one call — a sheet
that prints several fields for the same runner and plan, a UI that keeps recomputing as the
coach edits. If the derived values are computed once and thrown away, see
[`drill-06-10`](../../../10-combine-functions-into-transform/README.en.md) instead — this
is its sibling move, not a strictly better one.

**What it costs:** a `new` where there was only a function call, and a boundary that has to
be defended — the renderer will want to move formatting logic *into* the class next, and it
must not.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-09     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `TrainingBlock(runner, plan)`; move `runnerName` in as a getter | `refactor: introduce TrainingBlock, move in runnerName` |
| 2 | Move `raceName` and `totalWeeks` in as getters | `refactor: move raceName and totalWeeks onto TrainingBlock` |
| 3 | Move `targetDistanceKm(week)` in — the first query needing both `runner` and `plan` | `refactor: move targetDistanceKm onto TrainingBlock` |
| 4 | Move `targetPaceSecondsPerKm(week)` in | `refactor: move targetPaceSecondsPerKm onto TrainingBlock` |
| 5 | Move `weekLabel(week)` and `isRecoveryWeek(week)` in | `refactor: move weekLabel and isRecoveryWeek onto TrainingBlock` |
| 6 | Move `totalDistanceKm` in last, now that it can read `this.totalWeeks` and call `this.targetDistanceKm(week)` | `refactor: move totalDistanceKm onto TrainingBlock` |
| 7 | Fold the shared `weekAt(plan, week)` helper into the class as a private method — its only callers are methods now | `refactor: make weekAt a private method` |
| 8 | In `training-sheet.ts`, construct one `block` per call and read every field off it; delete the now-unused free functions | `refactor: renderTrainingSheet reads the block` |

Step 1 moves the field that needs only `runner`; step 2 moves the two that need only
`plan`. Neither pair depends on the other, and moving the lopsided ones first is what
proves early that the clump — not any one function's complexity — is what this refactoring
targets.

---

Where it lands:

```ts
export class TrainingBlock {
  constructor(
    private readonly runner: Runner,
    private readonly plan: TrainingPlan,
  ) {}

  get totalDistanceKm(): number {
    let total = 0;
    for (let week = 0; week < this.totalWeeks; week++) {
      total += this.targetDistanceKm(week);
    }
    return total;
  }
  // ...seven more methods, none of which takes a runner or a plan again.
}
```

One class, eight members, and every one of them free of the parameter that used to be on
all eight.
