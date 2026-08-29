# Steps — one ShelfCode, one parser

The route, in the order that keeps every step small and the suite green throughout. Terse
on purpose: keep this open in a split pane while you work. The reasoning behind each move —
and the decision the last two steps actually turn on — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever more than one place parses the same primitive value and
you cannot point at a single function that decides what the value means. A raw string with
three ad hoc readers has one correct first move, which is why this is a drill.

**What it costs:** two of the three callers answer edge-shaped shelf codes differently once
they go through `ShelfCode`, because consolidating three disagreeing parsers into one
necessarily picks a side. That is not free, and it is not this diff's job to also fix it —
see `WALKTHROUGH.md` for why.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-03     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `ShelfCode.parse`, with `section`, `classNumber`, `shelfLetter` — unused so far | `refactor: add ShelfCode.parse` |
| 2 | Route `spineLabelSection` through `ShelfCode.parse(...).section` | `refactor: route spineLabelSection through ShelfCode` |
| 3 | Route `cartSection` through `ShelfCode.parse(...).section` | `refactor: route cartSection through ShelfCode` |
| 4 | Route `sectionTally` through `ShelfCode.parse(...).section` | `refactor: route sectionTally through ShelfCode` |
| 5 | Delete the leftover `.slice()`, `.split()`, and the `SHELVED_CODE` regex — nothing outside `shelf-code.ts` touches the raw string any more | `refactor: remove the ad hoc parsing` |

Step 2 goes first because it is the one caller that was already correct — a warm-up that
proves `ShelfCode` before anything risky depends on it. Steps 3 and 4 are separate commits
on purpose: each is the moment a caller's answer for an untested shape of code silently
changes, and one bad diff is easier to bisect than two.

---

Where it lands:

```ts
export function cartSection(shelfCode: string): string {
  return ShelfCode.parse(shelfCode).section;
}
```

Three one-line functions, each asking `ShelfCode` the same question instead of re-deriving
the answer three different ways. Nothing outside `shelf-code.ts` runs a regex, a `slice`,
or a `split` against a shelf code again.
