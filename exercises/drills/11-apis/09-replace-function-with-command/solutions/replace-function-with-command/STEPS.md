# Steps — seven fields, three private methods

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost of it — is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a function has enough internal structure — several phases,
several local values threaded between them — that turning its temps into fields is what
lets you break it into methods at all. Not because you need to build it now and run it
later, run it twice, undo it, or inspect it mid-flight — none of that applies here, and
this drill doesn't pretend it does. See [`drill-11-10`](../../../10-replace-command-with-function/README.en.md)
for the case where none of it is true and a function is the honest answer.

**What it costs:** a class with a constructor and five methods where there was one
function. Every caller that only wants the total now instantiates an object to get it.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-09     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Create `ScoreSeatBlockCommand`; move `scoreSeatBlock`'s body into `execute()` unchanged, referencing `this.block`/`this.request`; have `scoreSeatBlock` delegate to it | `refactor: wrap scoreSeatBlock in a command shell` |
| 2 | Promote the seven local values to private fields (`centerOffset`, `orphanedSingles`, `touchesAisle`, `locationScore`, `fragmentationPenalty`, `priceScore`, `aisleBonus`); `execute()` assigns `this.x = ...` in the same order as before | `refactor: replace temps with fields` |
| 3 | Extract the three phases into zero-parameter private methods — `readLayout`, `weighFactors`, `combine`; `execute()` becomes three calls and a return | `refactor: extract phase methods now that nothing needs a parameter` |
| 4 | Add `breakdown()`, returning the four weighed fields as a `ScoreBreakdown` | `refactor: add breakdown() for callers that want the parts` |
| 5 | Move `rankSeatBlocks` onto `new ScoreSeatBlockCommand(block, request).execute()` directly | `refactor: move rankSeatBlocks off scoreSeatBlock` |
| 6 | Move `explainTopBlock` onto `execute()` + `breakdown()` instead of the whole-object return | `refactor: move explainTopBlock onto execute() and breakdown()` |
| 7 | Delete `scoreSeatBlock` and `SeatScore` — nothing calls either | `refactor: delete scoreSeatBlock` |

Steps 1 and 2 are separate on purpose: step 1 only changes *where* the code lives, not
what any value is called or how it's stored, so it cannot change behaviour. Step 2 is the
one that actually turns temps into fields, and it is still safe because every field is
written in the same order execute() always computed it in, before anything reads it.

Step 3 is the payoff step — see the walkthrough for exactly what it unblocks.

---

Where it lands:

```ts
execute(): number {
  this.readLayout();
  this.weighFactors();
  return this.combine();
}

private combine(): number {
  return Math.max(
    0,
    this.locationScore + this.priceScore + this.aisleBonus - this.fragmentationPenalty,
  );
}
```

Three phases, three methods, zero parameters between them — because there is nowhere left
for a parameter to go.
