# Steps — names earned by working out the arithmetic first

The route, in the order that keeps you from guessing before you're ready. Terse on
purpose: keep this open in a split pane while you work. The reasoning behind each name —
and the candidates it beat — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** always, once you've worked out what a variable actually holds.
There is no alternative refactoring for a name that lies — Extract Function or Extract
Variable might create the tangle in the first place, but only Rename Variable untangles a
name that no longer matches its value.

**What it costs:** nothing runs differently, so the suite can't confirm you got it right.
Two names could swap and every test would still pass. The only backstop is a reader who
checks each name against the formula, not against the name it's replacing.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-07     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Rename the parameter `xs` → `segments` | `refactor: rename xs to segments` |
| 2 | Rename `n` → `count` | `refactor: rename n to count` |
| 3 | Rename `d` → `meanPace` | `refactor: rename d to meanPace` |
| 4 | Rename `x2` → `meanSquare`; rename its reduce's `a`, `s` → `sum`, `segment` | `refactor: rename x2 to meanSquare` |
| 5 | Rename `t` → `variance` | `refactor: rename t to variance` |

Step 1 first, deliberately: it's the only rename you can make with full confidence before
reading a single line of the body — the function's own name and the module it lives in
already tell you the parameter is a list of segments. Steps 2–5 follow the data through
the formula in the order it's computed, because each rename becomes obvious only once the
one before it has a name to react against.

---

Where it lands:

```ts
export function pacingSpreadSeconds(segments: readonly Segment[]): number {
  const count = segments.length;
  const meanPace = averagePaceSecondsPerKm(segments);
  const meanSquare =
    segments.reduce((sum, segment) => sum + segment.paceSecondsPerKm ** 2, 0) / count;
  const variance = meanSquare - meanPace * meanPace;
  return Math.sqrt(Math.max(0, variance));
}
```

Same five lines, same five values, in the same order — every identifier now names what it
holds instead of what it might be mistaken for.
