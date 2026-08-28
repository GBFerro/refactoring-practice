# Steps — a DateRange the report can ask questions of

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the one decision I am not
sure about — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when the same pair of values is threaded through several
signatures *and* at least one of those functions is doing real work with the pair, not just
passing it along. If nothing downstream ever compares, derives, or validates the pair, you
have a Data Clump but not yet a reason to introduce a type — see the walkthrough's note on
`weeks`.

**What it costs:** a type to construct at every entry point, and a standing invitation to
keep adding getters to it. Worth it here only because the two dates already had behaviour
waiting for them — `includes` and the day count were being reimplemented, not invented.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-08     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Create an empty `DateRange` — `from`, `to`, constructor, nothing else | `refactor: create empty DateRange class` |
| 2 | Change `renderReport`, `renderRangeLine`, `racesInRange`, `renderTotals` to take one `range: DateRange`; update the three callers in `reports.ts` to build it | `refactor: thread DateRange through the report pipeline` |
| 3 | Move the inclusion check into `DateRange.includes(date)`; `racesInRange` calls it | `refactor: move the range check onto DateRange` |
| 4 | Move the day-count arithmetic into a `DateRange.days` getter; delete both duplicated computations | `refactor: replace duplicated day math with DateRange.days` |
| 5 | Add `DateRange.weeks`, replacing `range.days / 7` in `renderTotals` | `refactor: add DateRange.weeks` |
| 6 | Extract `monthOf(month)` into `date-range.ts`; `renderMonthReport` becomes one line | `refactor: extract monthOf onto DateRange` |

Step 2 is the only one that touches every call site at once — `Change Function
Declaration` on a function used in three places has to move all three together or the
suite goes red between them. Steps 3 through 6 are each one function growing a method,
one at a time.

---

Where it lands:

```ts
export function renderCustomReport(season: Season, from: string, to: string): string {
  return renderReport(season, new DateRange(from, to));
}

export function renderMonthReport(season: Season, month: string): string {
  return renderReport(season, monthOf(month));
}
```

Three call sites, each building or obtaining a `DateRange` and handing it to one function
that no longer knows or cares how the window was chosen.
