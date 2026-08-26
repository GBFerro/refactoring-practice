# Solution — one function per named intention

## When to choose this

Always, for this shape of problem. A long procedure whose blocks are announced by
comments has exactly one good answer, and that is why this is a drill and not a kata:
there is a right move, and the point is to learn its mechanics until they are boring.

## What it costs

Ten functions where there was one, all of which need names — and naming is the expensive
part of the job. The top-level function stops reading as a procedure you can follow line
by line and starts reading as a table of contents. That is a trade, not a free win: when
you genuinely need to know the order in which the pieces run, you now have to open them.

---

## The route

Ten steps, leaves first. Run `npm test` after every one, and commit after every one — at
the end, `git log --oneline` should look like this file.

Test command for all of them:

```bash
npx vitest run --project drill-06-01
```

### Step 1 — extract `pad2`

```
Before:  String(minutes).padStart(2, "0")
After:   pad2(minutes)
```

Why first: it is the smallest thing in the file, it has no dependencies, and it appears
four times. Starting at the leaves means every later step operates on smaller code.

→ 4 passed · `refactor: extract pad2`

### Step 2 — extract `formatDuration`

```
Before:  the six lines that build h:mm:ss, twice — once in the loop, once for "Fastest:"
After:   formatDuration(seconds)
```

This is the Duplicated Code the brief asked you to find. Extract from the first
occurrence, run the tests, then delete the second occurrence and call the new function.
**Two separate runs of the suite** — replacing the second copy is its own step, and it is
the one that can silently change behaviour if the copies were not identical.

→ 4 passed · `refactor: extract formatDuration`

### Step 3 — extract `formatPace`

```
Before:  String(Math.floor(rounded / 60)) + ":" + pad2(rounded % 60) + "/km"
After:   formatPace(secondsPerKm)
```

Note the seam: `formatPace` takes seconds-per-kilometre and returns a string. Rounding
belongs *inside* it — the caller should not have to know that paces are rounded before
they are printed.

→ 4 passed · `refactor: extract formatPace`

### Step 4 — extract `paceSecondsPerKm`

```
Before:  const secondsPerKm = seconds / race.distanceKm;
After:   paceSecondsPerKm(race, finisher)
```

An Extract Variable that already happened, promoted to a function. Now the pace
calculation has a name, and the loop no longer needs `race.distanceKm` in scope.

→ 4 passed · `refactor: extract paceSecondsPerKm`

### Step 5 — extract `isFinisher` as a type predicate

```
Before:  if (entry.seconds !== null) { finishers.push(entry) }
After:   entries.filter(isFinisher)   // isFinisher(e): e is Finisher
```

This is the step that removes every `?? 0` from the file. Those were not noise: they were
the type system pointing at the tangle. Once the predicate narrows `Entry` to `Finisher`,
the functions downstream take a runner who provably has a time.

→ 4 passed · `refactor: extract isFinisher predicate`

### Step 6 — extract `sortedFinishers`

```
Before:  the push loop plus the sort
After:   const finishers = sortedFinishers(race.entries);
```

Ranking is one idea. It now has one name and one line.

→ 4 passed · `refactor: extract sortedFinishers`

### Step 7 — extract `titleOf` and `renderHeader`

```
Before:  const title = race.name + " - " + race.date;  // + two pushes
After:   renderHeader(race)   →  [title, "=".repeat(title.length)]
```

`titleOf` stays separate because the footer rule needs the title's *width* further down.
Two callers, one definition — that is what keeps the two rules the same width forever.

→ 4 passed · `refactor: extract renderHeader`

### Step 8 — extract `renderFinisher` and `renderDidNotFinish`

```
Before:  the string concatenation inside each loop
After:   finishers.map((f, i) => renderFinisher(race, f, i + 1))
```

The column layout becomes a named array of columns joined by a space. The `position`
counter disappears — `map` already carries the index, and a mutable counter that exists
only to be incremented is one less thing to reason about.

→ 4 passed · `refactor: extract line renderers`

### Step 9 — extract `averagePace` and delete the accumulator

```
Before:  paceTotal accumulated in the loop, divided 40 lines later
After:   averagePace(race, finishers)
```

This is the step the second hint was pointing at, and it only became easy *after* steps 4
and 6. The accumulator was a temp that spanned the whole function; now the average is
computed where it is used, from data that is already at hand. (In the book's vocabulary
you have just done *Replace Temp with Query* — chapter 7 — as a side effect. Refactorings
come in flocks.)

→ 4 passed · `refactor: replace paceTotal with averagePace query`

### Step 10 — extract `renderSummary`, and read what is left

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

Six lines that name the six parts of a results sheet. Nothing here says *how* a pace is
formatted, and that is the whole point.

→ 4 passed · `refactor: extract renderSummary`

---

## Afterwards

Two things worth noticing, because they generalise:

**The comments are gone and nothing was lost.** Every one of them became a function name.
If you find yourself keeping a comment after an extraction, the name is not carrying its
weight yet.

**The order mattered more than the moves.** Leaves first, then the loop, then the
top-level function. Had you started by extracting `renderFinisher`, you would have
dragged the formatting, the pace maths and the `?? 0` noise inside it, and every later
step would have been a re-extraction. When a refactor feels like it is fighting you, it is
usually the order, not the move.
