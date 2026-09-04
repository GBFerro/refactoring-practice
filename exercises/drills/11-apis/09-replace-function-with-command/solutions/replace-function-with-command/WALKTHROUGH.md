# Walkthrough — seven fields, three private methods

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost,
and the test I used to decide this drill needed a class at all. Read it after you have
your own version, not before.

---

## The test, stated plainly, before touching any code

A command earns its keep when the operation has enough internal structure that turning
its temps into fields lets you break it into methods — **and** when nothing about doing
that costs more than it buys. It does not earn its keep just because you *can* wrap a
function in a class; you can always do that, and it is never free. The other half of the
test, the one this drill does not need but its inverse does, is whether you want to build
the operation now and run it later, run it twice, undo it, or inspect it mid-flight. A
function is right when none of that is true, which is most of the time.

[`drill-11-10`](../../../10-replace-command-with-function/README.en.md) is what it looks
like when a class fails this test on both counts: one method, no phases, nothing to
inspect after the fact. Keep both drills' tests next to each other; they were written to
argue with each other on purpose.

## What `scoreSeatBlock` actually looked like

```ts
export function scoreSeatBlock(block: SeatBlock, request: GroupRequest): SeatScore {
  // phase 1: read the raw facts about where this block sits in its row
  const middle = (block.firstSeatNumber + block.lastSeatNumber) / 2;
  const center = (1 + block.row.seats.length) / 2;
  const centerOffset = Math.abs(middle - center);
  let orphanedSingles = 0;
  // ... two more raw facts ...

  // phase 2: turn each fact into weighted points
  const locationScore = Math.max(0, LOCATION_MAX - centerOffset);
  const fragmentationPenalty = orphanedSingles * ORPHAN_PENALTY;
  const priceScore = /* ... */;
  const aisleBonus = touchesAisle ? AISLE_BONUS : 0;

  // phase 3: combine, never letting the aisle bonus rescue a badly fragmented block
  const total = Math.max(0, locationScore + priceScore + aisleBonus - fragmentationPenalty);
  return { total, locationScore, priceScore, aisleBonus, fragmentationPenalty };
}
```

Seven local values — `centerOffset`, `orphanedSingles`, `touchesAisle`, `locationScore`,
`fragmentationPenalty`, `priceScore`, `aisleBonus` — feeding three phases, each phase
consuming the previous one's output. The comments announcing each phase are the same tell
[`drill-06-01`](../../../../06-first-set/01-extract-function/README.en.md)'s `Comments`
smell warns about, and the reflex from that drill is right: extract a function per phase.

## Why that reflex stalls here, concretely

Try it. Phase 1 is fine — it produces three values and needs nothing but `block`, so it
extracts to a function taking one parameter. Phase 2 is where it stops being fine: turning
it into a function means it needs `centerOffset`, `orphanedSingles`, `touchesAisle`,
`block`, and `request` as inputs, and needs to hand back four *outputs* —
`locationScore`, `fragmentationPenalty`, `priceScore`, `aisleBonus` — none of which is
useful by itself. Phase 3, the combine step, then needs those same four values as
parameters, one per weighted factor.

A function taking those four is a function over the strict profile's own three-parameter
cap — the exact rule this repository's "Done when" section checks. You can dodge the
count by bundling the four into a throwaway interface — `PhaseTwoResult` or similar — and
passing that as one parameter. That works, and it is a real alternative; see "if you took
a different route" below. But notice what it is: a type invented so a set of values that
only ever exist for the lifetime of one calculation can be threaded from one function to
the next. **That is what a field is, minus giving the whole thing a name and a lifecycle.**
Replace Function with Command does the same job those bundled parameters would, without
inventing a type to do it — it turns each temp into a field once, and every phase becomes
a zero-parameter method that reads and writes `this.*`.

This is the concrete version of the abstract point: the class is not an improvement in
itself. It is what makes the extraction — the thing `drill-06-01` already taught — cheap
enough to actually do here.

## Steps 1–2 — a shell, then fields

```ts
// after step 1: same body, moved, referencing this.block / this.request
export class ScoreSeatBlockCommand {
  constructor(
    private readonly block: SeatBlock,
    private readonly request: GroupRequest,
  ) {}

  execute(): SeatScore {
    const middle = (this.block.firstSeatNumber + this.block.lastSeatNumber) / 2;
    // ... unchanged otherwise ...
  }
}

export function scoreSeatBlock(block: SeatBlock, request: GroupRequest): SeatScore {
  return new ScoreSeatBlockCommand(block, request).execute();
}
```

Step 1 changes nothing about what runs — it is the same statements, in the same order,
reached through one more hop. That is deliberate: it separates "give the calculation a
home" from "change what it's made of," the same discipline
[`drill-11-01`](../../../01-separate-query-from-modifier/README.en.md) used to split a
function in two without moving a caller yet. The suite cannot tell the difference, because
there isn't one yet.

Step 2 promotes the seven `const`s to fields, assigned with `this.x = ...` in the same
order execute() always computed them. I did this as one commit, not seven, unlike most of
this module's step-by-step splits — each promotion is textually identical in shape and
none depends on any other completing first, so there is no intermediate state worth
freezing a commit at. Splitting `drill-11-01`'s two callers into separate commits was
useful because each could reveal a *different* bug; splitting this into seven would only
find the same bug seven times.

**On the name.** `readLayout`, not `gatherFacts` or `phase1`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — does it say what, or how? — rules out
`phase1`: it describes the method's position in a sequence, not what it does, and that
position is an implementation detail a reader has to hold in their head to make sense of
the name. `readLayout` says what happens: the method looks at where the block sits in its
row. I also rejected `measure` — question 2, could it be the name of something else in
this file? `weighFactors` measures too, in a different sense, and a file with two methods
both plausibly named `measure*` has a naming problem waiting to happen.

## Step 3 — the phases become methods

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

This is the step the whole exercise has been building to. `combine` reads four fields and
takes zero parameters. Compare that to the four-parameter function the same logic would
need as a plain function — this is the extraction `drill-06-01` teaches, made cheap by
step 2 rather than blocked by it.

Notice also what changed about `execute()`'s return type: it used to return the full
`SeatScore` object (total plus every weighed factor); now it returns just `number`, the
total. The breakdown didn't disappear — it moved to a second method, in step 4 — but
`execute()` itself got to shrink to what most callers actually want. A plain function
returning everything to everyone couldn't do that split without either breaking its
existing callers or growing a second return shape bolted onto the first.

**On the name.** `weighFactors`, not `score` — question 4, is it true? `score` at this
point in the file would suggest the method produces *the* score, and it doesn't; it
produces four weighted numbers that a later step combines. `weighFactors` is the accurate,
slightly less punchy name, and question 4 says accuracy wins that tradeoff every time.

## Step 4 — `breakdown()`, and why it is a second method rather than a bigger `execute()`

```ts
breakdown(): ScoreBreakdown {
  return {
    locationScore: this.locationScore,
    priceScore: this.priceScore,
    aisleBonus: this.aisleBonus,
    fragmentationPenalty: this.fragmentationPenalty,
  };
}
```

I could have kept `execute()` returning the full `SeatScore` object, the way the plain
function did, and skipped `breakdown()` entirely. I didn't, because the two callers want
different things: `rankSeatBlocks` calls `execute()` on every candidate block just to sort
them and never looks at the parts; `explainTopBlock` calls it once, on the winner, and
then wants the parts too. Splitting the return means the caller that only sorts reads a
`number` off every call, and the caller that explains pays for `breakdown()` exactly once,
on exactly the one block anybody will read an explanation for. A function returning the
full object every time would hand every caller the same shape whether it wanted the detail
or not — cheap here, at four fields, but the kind of habit that stops being cheap as a
breakdown grows.

**On the name.** `breakdown()`, not `details()` or `parts()`. Question 3 — does it read at
the call site? `command.breakdown()` reads as "the breakdown of the score," where
`command.details()` could be the breakdown of almost anything a command might hold.
`parts()` was my first draft and I rejected it for the same reason `formatPace` beat a
generic name in `drill-06-01`: it fits five different things in this file, and a name that
fits everything identifies nothing — question 2.

## Steps 5–6 — moving the callers, one at a time

```ts
// rankSeatBlocks, before
.map((block) => ({ block, score: scoreSeatBlock(block, request) }))
.sort((a, b) => b.score.total - a.score.total)

// after
.map((block) => ({ block, total: new ScoreSeatBlockCommand(block, request).execute() }))
.sort((a, b) => b.total - a.total)
```

`rankSeatBlocks` only ever wanted the total, so its move is a straight substitution — same
value, one instantiation deeper. `explainTopBlock` is the one worth slowing down for: it
now builds one `ScoreSeatBlockCommand`, calls `execute()` once, and calls `breakdown()` on
the *same instance* afterward.

```ts
const command = new ScoreSeatBlockCommand(top, request);
const total = command.execute();
return renderExplanation(top, total, command.breakdown());
```

This is the shape a plain function returning a bigger struct could not quite match without
recomputing or over-fetching: the object remembers what it just did, and a second message
sent to the same instance reads that memory back instead of asking the calculation to run
again or asking every caller to accept a bigger return type it mostly won't use.

## Step 7 — deleting what nothing calls

Once step 6 lands, `scoreSeatBlock` and the `SeatScore` type it returned have no callers
left in `src/`. As with `drill-11-01`'s step 6, TypeScript will not flag this on its own —
an exported function with zero local call sites still compiles. Confirmed by reading
`callers.ts`, then deleted. Suite still green.

## What it cost, honestly

Five methods and a constructor where there was one function. `rankSeatBlocks` is the
plainest casualty: it used to call one function and get a number back; now it instantiates
an object it discards immediately after reading one field off it. For a module scoring
one candidate at a time that is a small, mostly cosmetic tax. If this box office ever
scored seat blocks by the thousand in a single request — a full-house re-rank — I would
want to know whether allocating one command object per candidate shows up in a profile
before assuming it doesn't; I did not measure it here, because a fixture of a few blocks
in a test file is not evidence either way, and it would be dishonest to claim I know.

The decision I am least sure about is `breakdown()` returning a fresh object on every
call rather than the same cached one. It is simpler, and correct, because nothing about
this command mutates after `execute()` returns — but if a future version of this scorer
grew a phase that ran conditionally, "call `breakdown()` before `execute()` has run"
becomes a live question, and right now it silently answers `0` for every field instead of
telling the caller anything went wrong. I did not add that guard. A reviewer adding one
would not be wrong; I left it out because this drill's `execute()` always runs its three
phases unconditionally, and a guard against a mistake this shape of class cannot currently
make is speculative generality wearing a safety costume.

## If you took a different route

- **Bundling phase 2's four outputs into a `PhaseTwoResult` interface and extracting
  `combine` as a plain function taking one parameter.** A real alternative, discussed
  above — it satisfies the parameter cap and does not require a class. I did not take it
  because the interface would exist for exactly one call site and nothing else, which is
  close to the shape [`drill-07-06`](../../../../07-encapsulation/06-inline-class/README.en.md)
  calls out as not pulling its weight — except here it's a type, not a class, so the
  repository's `Lazy Element` catalogue entry doesn't quite reach it. Defensible either
  way.
- **Six fields instead of seven**, by not storing `touchesAisle` and recomputing
  `sitsAgainstAisle(this.block)` inside `weighFactors`. Also fine; I kept the field because
  `readLayout` is where every other raw fact gets read, and reading facts in two different
  methods depending on which fact it is would be a worse inconsistency than one small
  field.
- **Naming the class `SeatBlockScorer` with a `score()` method instead of `execute()`.**
  Both pass all four naming questions. I used `execute()` because this repository's other
  command-shaped exercises (see `drill-11-10`'s inverse) share that name, and consistency
  across the module is worth a small amount either way.

What is *not* a matter of taste: making `combine` take four parameters to avoid the class,
which is exactly the strict profile's own limit told to look away from itself. And leaving
`rankSeatBlocks` and `explainTopBlock` computing the score two different, hand-written
ways, which is the duplication this refactor exists to avoid regardless of which side of
the parameter-cap argument you land on.

## Where TypeScript changes this from the book

Fowler's own worked example, `ChargeCalculator`, is JavaScript with no compiler watching
the class's shape. Here, `execute(): number` and `breakdown(): ScoreBreakdown` are
signatures a caller can read without opening the class body — `rankSeatBlocks` knows it
gets a `number` back before it ever calls it, and a caller cannot accidentally read
`breakdown()`'s fields as if they were the total, because the two return different types.
The seven private fields are also genuinely private here — `#`-private or TypeScript's
`private` modifier both stop `rankSeatBlocks` from reaching into `command.locationScore`
directly, where the un-typed version relies on convention alone. That is a real advantage
this refactoring gets for free in TypeScript that the book's JavaScript original doesn't:
the fields the class exists to introduce are enforceably nobody else's business.
