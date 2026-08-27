# Steps — one function per named intention

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the dead ends — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** always, for this shape of problem. A long procedure whose blocks
are announced by comments has one good answer, which is why this is a drill.

**What it costs:** ten functions where there was one, all needing names. The top-level
function stops reading as a procedure and starts reading as a table of contents. That is a
trade, not a free win.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-01     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract `pad2` — the `padStart(2, "0")` repeated four times | `refactor: extract pad2` |
| 2 | Extract `formatDuration` from the loop | `refactor: extract formatDuration` |
| 3 | Replace the **second** copy of the h:mm:ss block with `formatDuration` | `refactor: use formatDuration for the fastest line` |
| 4 | Extract `formatPace`, moving the rounding inside it | `refactor: extract formatPace` |
| 5 | Extract `paceSecondsPerKm` | `refactor: extract paceSecondsPerKm` |
| 6 | Extract `isFinisher` as a type predicate; delete every `?? 0` | `refactor: extract isFinisher predicate` |
| 7 | Extract `sortedFinishers` | `refactor: extract sortedFinishers` |
| 8 | Extract `titleOf` and `renderHeader` | `refactor: extract renderHeader` |
| 9 | Extract `renderFinisher` and `renderDidNotFinish`; drop the `position` counter | `refactor: extract line renderers` |
| 10 | Extract `averagePace` and delete the `paceTotal` accumulator | `refactor: replace paceTotal with averagePace query` |
| 11 | Extract `renderSummary` and read what is left | `refactor: extract renderSummary` |

Steps 2 and 3 are separate on purpose: replacing the second copy is the step that can
silently change behaviour if the two copies were not identical.

---

Where it lands:

```ts
export function renderRaceReport(race: Race): string {
  const finishers = sortedFinishers(race.entries);
  const lines = [
    ...renderHeader(race),
    ...finishers.map((finisher, index) => renderFinisher(race, finisher, index + 1)),
    ...race.entries.filter(didNotFinish).map(renderDidNotFinish),
    "-".repeat(titleOf(race).length),
    ...renderSummary(race, finishers),
  ];
  return lines.join("\n");
}
```

Six lines naming the six parts of a results sheet. Nothing here says *how* a pace is
formatted, and that is the whole point.
