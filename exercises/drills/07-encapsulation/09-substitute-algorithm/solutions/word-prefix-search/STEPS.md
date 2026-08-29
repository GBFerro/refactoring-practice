# Steps — rank by word match, sort, map

The route, in the order that keeps every step small and the suite green throughout. Terse
on purpose: keep this open in a split pane while you work. The reasoning behind each move —
and why this refactoring is not like the others in this module — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** you have a working algorithm, you can name every behaviour it
guarantees (including the accidental ones), and you have a test for each of them. Without
that last part, stop — you are not refactoring, you are rewriting with extra steps.

**What it costs:** the tie-break order the tests pin now comes from trusting
`Array.prototype.sort`'s stability guarantee rather than from a comparison you can read
line by line in this file — correct on every engine this repo targets, but a promise the
code no longer states for itself.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-09     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Replace the hand-rolled character comparison loop with `String.prototype.startsWith` | `refactor: use startsWith for the prefix check` |
| 2 | Replace the hand-rolled word-boundary scan with `title.split(/\s+/u)` and `.findIndex` | `refactor: split words with a regex instead of scanning by hand` |
| 3 | Replace the manual stable-insertion scan with collect, `.sort`, `.map`; drop `insertByRank` | `refactor: rank with sort instead of insertion` |

Step 3 is the one to slow down on. It is the only step that changes *how* the ranking
order is produced, not just how a value is computed, and it is the step most likely to
silently disagree with the old algorithm on a tie. See `WALKTHROUGH.md`.

---

Where it lands:

```ts
export function searchTitles(
  catalogue: readonly CatalogueEntry[],
  query: string,
): CatalogueEntry[] {
  return rankedMatches(catalogue, query)
    .sort((a, b) => a.rank - b.rank)
    .map((match) => match.entry);
}

function rankedMatches(catalogue: readonly CatalogueEntry[], query: string): Match[] {
  return catalogue
    .map((entry) => ({ entry, rank: firstMatchingWord(entry.title, query) }))
    .filter((match) => match.rank !== -1);
}

function firstMatchingWord(title: string, query: string): number {
  const lowerQuery = query.toLowerCase();
  return title
    .split(/\s+/u)
    .findIndex((word) => word.toLowerCase().startsWith(lowerQuery));
}
```

Three functions instead of four, none of them a loop you wrote — a map, a filter (folded
into one pass), a sort, a split, a findIndex, a startsWith. Every one of those is a
promise about behaviour that the standard library has already tested more thoroughly than
this exercise's ten cases ever will.
