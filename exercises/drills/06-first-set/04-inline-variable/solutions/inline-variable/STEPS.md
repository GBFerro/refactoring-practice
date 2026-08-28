# Steps — only the variables that earn their line

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the three variables that
stay — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a variable's only job is to restate a field or an
expression, read exactly once, one line below its own declaration. If the same shape needs
a second implementation because inlining would duplicate expensive work, that is not this
drill — that is a design decision, and belongs in a kata.

**What it costs:** some expressions get longer, and the file loses the paper trail of
intermediate names a first-time reader might have leaned on. Three variables survive for
three unrelated reasons; the rule you leave with is a judgement, not a lint rule.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-04     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Inline `duration`/`distance` in `paceSecondsPerKm` | `refactor: inline duration/distance in paceSecondsPerKm` |
| 2 | Inline `total`/`distance` in `averagePaceSecondsPerKm` | `refactor: inline total/distance in averagePaceSecondsPerKm` |
| 3 | Inline `last`/`lastElapsed` in `totalSeconds` | `refactor: inline last/lastElapsed in totalSeconds` |
| 4 | Inline `wholeMinutes`/`remainingSeconds` in `formatPace` | `refactor: inline wholeMinutes/remainingSeconds in formatPace` |
| 5 | Inline `hasHours` in `formatDuration` | `refactor: inline hasHours in formatDuration` |
| 6 | Inline the six field aliases in `segmentsOf`; keep `previous` | `refactor: inline field aliases in segmentsOf` |
| 7 | Inline `label`/`elapsed`/`duration`/`pace`/`row` in `renderSegment`; keep `columns` | `refactor: inline column aliases in renderSegment` |
| 8 | Inline `pace`/`isFirstOrFaster` in `fastestSegment`; keep the `fastest` accumulator | `refactor: inline the tie-break condition in fastestSegment` |
| 9 | Inline `pace`/`difference` inside the `hasEvenPacing` callback; keep `average` | `refactor: inline pace/difference in hasEvenPacing` |
| 10 | Inline the five summary aliases in `renderSummary`; keep `fastest` | `refactor: inline the summary line aliases` |
| 11 | Inline `heading`/`segmentLines`/`summaryLines`/`lines` in `renderSplitReport` | `refactor: inline the top-level line aliases` |

Steps 6, 8, 9 and 10 are the ones to slow down for: each inlines several variables in the
same function while leaving exactly one behind. Do the deletions one variable at a time
even within a single step — it is easy to inline the survivor by mistake and only notice
when a test starts failing three steps later.

---

Where it lands:

```ts
function hasEvenPacing(segments: readonly Segment[]): boolean {
  const average = averagePaceSecondsPerKm(segments);
  return segments.every(
    (segment) => Math.abs(paceSecondsPerKm(segment) - average) <= EVEN_PACING_SECONDS,
  );
}
```

One name left standing out of three in that function, and it is the one whose single
textual occurrence is misleading — it runs once per segment, not once.
