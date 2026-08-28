# Steps — one transform, one enriched record

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the trade-off it commits
you to — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** several functions each read the same base record and derive
related, connected facts about it, and callers routinely want more than one of those facts
for the same record — a card, a row — and end up calling several functions per record,
each of which redoes the same underlying lookups.

**What it costs:** the profile is a copy, taken once. Enrich a runner and then mutate their
underlying results, and the profile you already built does not know. A class would keep
the derived fields live, at the price of a `new` and a boundary that has to be defended.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-10     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract `qualifyingResults`; call it from `bestPaceOf`, `handicapOf`, `isSelectableOf` | `refactor: extract qualifyingResults` |
| 2 | Extract `ageInSeason`; call it from `ageGroupOf`, `handicapOf` | `refactor: extract ageInSeason` |
| 3 | Extract `bestPace` (qualifying results to a pace); call it from `bestPaceOf`, `handicapOf` | `refactor: extract bestPace` |
| 4 | Extract `ageGroupFor`, `handicapFor`, `meetsSelectionRules` as pure functions of primitives, wrapped by the four `*Of` functions | `refactor: extract pure derivation functions` |
| 5 | Introduce `RunnerProfile` and `enrichRunner`, computing all four fields once from the shared intermediates | `refactor: introduce enrichRunner transform` |
| 6 | Point `renderProfileCard` at `enrichRunner` instead of the four `*Of` functions | `refactor: renderProfileCard reads the profile` |
| 7 | Point `renderSquadSheet` at `runners.map(enrichRunner)`; sort and render from the enriched array instead of re-deriving pace inside the comparator | `refactor: renderSquadSheet reads the profile` |
| 8 | Delete `ageGroupOf`, `bestPaceOf`, `handicapOf`, `isSelectableOf` — nothing calls them | `refactor: delete the four query functions` |

Steps 1–3 remove the *textual* duplication without changing the module's shape: four
exported functions, each still walking the raw record on every call. Steps 5–8 remove the
*structural* duplication — repeated derivation from the same record — which is the actual
target of this refactoring and the reason it has its own name instead of just being
"Extract Function" again.

---

Where it lands:

```ts
export function enrichRunner(runner: RunnerRecord): RunnerProfile {
  const qualifying = qualifyingResults(runner.results);
  const bestPaceSecondsPerKm = bestPace(qualifying);
  const age = ageInSeason(runner.birthYear);
  return {
    ...runner,
    ageGroup: ageGroupFor(age),
    bestPaceSecondsPerKm,
    handicapSeconds: handicapFor(bestPaceSecondsPerKm, age),
    isSelectable: meetsSelectionRules(runner.joinedSeason, qualifying.length),
  };
}
```

Every raw fact — the qualifying results, the age — is derived exactly once. Everything
downstream reads a field off `RunnerProfile` instead of calling a function.
