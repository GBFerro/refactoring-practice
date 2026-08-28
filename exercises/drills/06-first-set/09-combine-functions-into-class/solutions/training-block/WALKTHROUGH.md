# Walkthrough — one TrainingBlock the sheet asks questions of

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and — because
this refactoring has a named sibling that looks almost identical from a distance — why
this domain wants a class and not the transform that
[`drill-06-10`](../../../10-combine-functions-into-transform/README.en.md) reaches for.
Read it after you have your own version, not before.

---

## Before anything: what the eight functions have in common

`runnerName`, `raceName`, `totalWeeks`, `totalDistanceKm`, `weekLabel`,
`targetDistanceKm`, `targetPaceSecondsPerKm`, and `isRecoveryWeek` each take
`(runner: Runner, plan: TrainingPlan)`, and four of them also take `week: number`. None of
the eight names is bad — this is not `06-01`'s problem, and it is not `06-10`'s either.
There is no duplicated logic to find here: every function computes something genuinely
different from the last. Run `./rp names 06-09` against the challenge code and it comes
back clean, same as `06-10` — a second confirmation that this repository's smells do not
always show up as bad names or copy-pasted bodies.

What they share is narrower and easier to miss: **half of them do not use half of the
pair.** `raceName` never reads `runner`. `runnerName` never reads `plan`. `totalWeeks` and
`weekLabel` and `isRecoveryWeek` never read `runner` either. Yet every one of these
functions carries both parameters, because that is what a function in this file looks
like — the pair travels together whether or not a given traveller needs both halves of it.
That is chapter 3's *Data Clumps* exactly: a group of data seen together often enough that
the group itself is a concept nobody has named yet.

The challenge code marks the unused half with a leading underscore —
`raceName(_runner: Runner, plan: TrainingPlan)` — because `tsconfig.base.json` in this
repository turns on `noUnusedParameters`. That underscore is not decoration. It is the
compiler telling you, at five separate call signatures, that something is present without
being needed. **Five leading underscores across eight functions is the tell**, in exactly
the way this repository's `06-01` walkthrough treats a stray `?? 0` as the type system
pointing at a seam.

## Why the lopsided functions move first

I move `runnerName` before anything else, then `raceName` and `totalWeeks` together, then
the two that need both fields, then the two that need `plan` and `week`, then the one that
depends on other methods rather than raw fields, and only then fold the shared `weekAt`
helper into the class.

The alternative — starting with `targetDistanceKm`, which needs the whole pair and looks
like the "real" work — buries the lede. Moving `runnerName` first proves the smallest,
starkest case: a function that used 50% of its parameter list gains a home where it needs
to state 0% of it. Everything after that is the same proof restated with more fields
involved. If you start with the busiest function, the reader never sees that stark
before/after, because `targetDistanceKm` genuinely needed both parameters and its
before/after only looks like a parameter list shrinking by two, not evaporating.

## Step 1 — `runnerName`

```ts
// before, in training-block.ts
export function runnerName(runner: Runner, _plan: TrainingPlan): string {
  return runner.name;
}
// after, as the class's first member
get runnerName(): string {
  return this.runner.name;
}
```

The `_plan` is simply gone. Not renamed, not left as a documented no-op — gone, because a
getter on a class that already holds `plan` has no reason to mention it at all. This is the
whole argument for the refactoring in one line: the parameter wasn't wrong, it was homeless.

**On the name.** `runnerName`, not `name`. Question 2 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — could it be the name of something else in
this file? — is the reason. `TrainingBlock` ends up with `raceName` right next to it, and
`name` would collide: which name, whose? `runnerName` reads at the call site
(`` `${block.runnerName} - ${block.raceName}` ``) without a trip back to the declaration.

## Step 2 — `raceName` and `totalWeeks`

Same shape, the other unused half:

```ts
export function raceName(_runner: Runner, plan: TrainingPlan): string {
  return plan.race;
}
export function totalWeeks(_runner: Runner, plan: TrainingPlan): number {
  return plan.weeks.length;
}
```

become two getters reading `this.plan` and nothing else. I batch these two because they are
the same move at the same cost, the way this repository's `06-10` walkthrough batches
`ageInSeason` and `bestPace` — not every step earns its own paragraph, and pretending one
does teaches the reader to expect drama that isn't there.

## Steps 3 and 4 — the two that actually need both

```ts
targetDistanceKm(week: number): number {
  return Math.round(this.runner.weeklyBaseKm * this.weekAt(week).loadFactor);
}
targetPaceSecondsPerKm(week: number): number {
  return this.runner.thresholdPaceSecondsPerKm + this.weekAt(week).paceOffsetSecondsPerKm;
}
```

These are the two functions with a genuine reason to see both `runner` and `plan` — a
target distance is the runner's own baseline scaled by the plan's load factor for that
week; a target pace is the runner's own threshold offset by the plan's adjustment for that
week. Moving them proves something steps 1 and 2 could not: *this class is not simply
hiding an unused-parameter problem.* It also collapses two records into one call site for
the functions that need both — the other half of what this refactoring buys, not just
fewer unused parameters but one lookup instead of two per caller.

**On the name.** `targetDistanceKm`, not `distanceFor` or `plannedDistance`. Question 4 —
is it true? — is why `planned` lost: nothing about this value has been recorded as a plan
yet in the sense the rest of the codebase uses "plan" (the `TrainingPlan` record). "Target"
is this club's own word for what a training week asks a runner to hit, and reusing the
domain's vocabulary beats inventing an adjacent one that means almost, but not quite, the
same thing.

## Step 5 — `weekLabel` and `isRecoveryWeek`

Both read only `plan` and `week`, through `weekAt`, which is *still a free function at this
point in the build* — the two new methods call `weekAt(this.plan, week)`, not
`this.weekAt(week)`. I am deliberately not folding `weekAt` into the class yet: two
functions in `training-block.ts` still call it directly, and TypeScript's `private` is a
compiler-enforced boundary, not the book's convention-only privacy — mark it `private`
while anything outside the class still calls it and the project stops compiling, full
stop, not a lint warning to clean up later. That is why this step is ordered where it is:
**the last external caller has to move in before the helper it calls can be sealed off.**

## Step 6 — `totalDistanceKm`, last among the getters

```ts
get totalDistanceKm(): number {
  let total = 0;
  for (let week = 0; week < this.totalWeeks; week++) {
    total += this.targetDistanceKm(week);
  }
  return total;
}
```

This is the only member of the class that calls *other members* rather than reading a raw
field, which is exactly why it moves last among the getters: `this.totalWeeks` and
`this.targetDistanceKm(week)` only compile once both already exist on the class. Move this
one first and you either delay it with a stub, or write it against the free functions and
rewrite it again two steps later — a step operating on more code than it needs to, which is
the same complaint `06-01`'s walkthrough makes about starting from the top of a long
function instead of the leaves.

**On the name.** I keep `totalDistanceKm` as a getter, not a method — no parentheses at the
call site, `block.totalDistanceKm`. Question 3 — does it read at the call site? — decides
this one differently for `totalDistanceKm` than for `targetDistanceKm(week)`, even though
both are computed and neither is stored. `total` asks a question about the whole block with
nothing left to supply; `target` asks a question *about a specific week* and needs `week`
to mean anything. The convention table in `NAMING.md` calls a value-answering function a
noun phrase, and a getter is TypeScript's way of making a zero-argument query read like the
noun phrase it already is at the call site, rather than like a function that happens to
take no arguments.

## Step 7 — sealing `weekAt`

```ts
private weekAt(week: number): TrainingWeek {
  const found = this.plan.weeks[week];
  if (found === undefined) {
    throw new RangeError(`Week ${String(week)} is out of range for this plan.`);
  }
  return found;
}
```

Only now, with every one of its callers already a method on the same class, does `weekAt`
fold in as `private`. The bounds check itself — `plan.weeks[week]` typed as
`TrainingWeek | undefined` rather than silently `TrainingWeek` — is `noUncheckedIndexedAccess`
in this repository's `tsconfig.base.json`, another place where the TypeScript config is
doing work the book's JavaScript examples never had to: Fowler's array indexing just
returns `undefined` and moves on; here the compiler refuses to let that `undefined` reach
`.label` or `.loadFactor` unchecked, so the throw was never optional.

**On the name.** `weekAt`, not `getWeek` or `lookupWeek`. Question 1 — what, or how? —
rules out `lookupWeek`, which names the mechanism (a lookup) rather than the result.
Question 2 rules out `getWeek`: `get` is the one prefix in this codebase's own convention
table that fits every method equally and therefore identifies none of them. `weekAt` reads
like indexing — "the week at this position" — which is exactly what it is, and it echoes
the standard library's own `Array.prototype.at`, a name this codebase did not have to
invent from nothing.

## Step 8 — `training-sheet.ts` stops threading the pair

```ts
// before
weekLines(runner, plan)  // and inside, renderWeek(runner, plan, week)
// after
const block = new TrainingBlock(runner, plan);
weekLines(block)  // and inside, renderWeek(block, week)
```

Once every derived value lives on `TrainingBlock`, `renderTrainingSheet` builds one
instance and every helper below it takes `block` instead of the pair. This is the payoff a
reader can actually see: `renderWeek` goes from three parameters describing raw data to two
— one object, one loop index — and the eight now-empty free functions in
`training-block.ts` have no callers left to delete them for.

## What it cost — and the one decision I am not sure about

A `new` where there used to be a plain function call, and a boundary someone has to defend:
the moment a maintainer adds a `formatPace` call inside `TrainingBlock` because "it's right
there," the class has started swallowing the renderer, and nothing in the type system stops
that — only the reviewer does. `training-block.ts`'s own doc comment
(`// stays honest if either one changes while the block is still in someone's hand`) is a
promise, not a guarantee: nothing stops a caller from mutating the `runner` object a
`TrainingBlock` was built from and getting a `totalDistanceKm` that reflects the change on
the next call but not one already printed to a page. Every getter recomputes on every
access — the moment someone "optimizes" one into a cached field, the promise breaks
silently for that value alone while its neighbors keep their word.

The decision I am least sure of: whether `targetDistanceKm` and `targetPaceSecondsPerKm`
should keep taking a raw `week: number`, four call sites deep, rather than the class
handing out a small `WeekView` per week so a caller asks `block.week(2).targetDistanceKm`
once instead of re-passing the same `2` twice. That would remove a number that recurs
across `renderWeek` the same way `(runner, plan)` used to recur across this whole file —
arguably the same smell one level down. I did not make that move because `week` is not, on
its own, a record anyone carries around the rest of the codebase the way a `Runner` or a
`TrainingPlan` is — it never appears anywhere except as an index into `plan.weeks` — so it
does not clear the bar this exercise's smell is about. A reviewer who disagrees would not
be wrong.

## If you took a different route

- **Folding `weekAt` in first, before any of its callers.** Workable only if you keep it
  non-`private` until its last external caller moves in, then tighten the visibility as a
  separate, final step. Two steps instead of one, for the same reason step 7 is ordered
  where it is here.
- **A `WeekView` per week**, discussed above. Defensible; I did not take it.
- **Skipping the batch in step 2** and moving `raceName` and `totalWeeks` as two separate
  commits. Also fine — the batch is a judgment call about how much narration one row of
  `STEPS.md` needs, not a claim that they must move together.

What is *not* a matter of taste: leaving any getter still declaring a parameter it never
reads once it has a home on the class, or leaving `weekAt` reachable from outside
`TrainingBlock` once nothing outside needs it. Those are the two things this exercise
exists to remove.

## Class or transform — which does this domain actually want?

`06-10`'s own walkthrough raises this exact question from the other side, about a
different data clump in a different module: *"A transform is the right call when the
enrichment is consumed once and thrown away; a class earns its keep once the enrichment
needs to outlive the moment it was computed."* Read `renderTrainingSheet` on its own and it
looks exactly like `renderProfileCard` — synchronous, one call in, one string out, the
`TrainingBlock` never outliving the function that built it. On that evidence alone, a
transform would work here too, and would cost less: no `new`, no boundary to defend, just
an `enrichTrainingBlock(runner, plan)` returning a plain object with the same eight fields.

The reason I reach for the class anyway is what a training plan *is*, not what today's one
caller does with it. A runner profile enriches settled facts — a race already run, a
membership record already on file — at the moment of printing; nothing about a profile
card invites a human to revise the underlying results while looking at it. A training block
is the opposite kind of object: it exists so a coach can tune it — retest a runner's
threshold pace after a good time trial and watch every target pace shift, adjust one week's
`loadFactor` for a taper and watch that week's target distance change without re-running an
export. That is a plan-editing session, not a print job, and a far more expected next
feature for *this* domain than a live-editing UI would be for squad selection. A cached,
snapshotted `TrainingBlock` would answer yesterday's question correctly and today's
question wrongly the moment a record changed while the coach still had it open — which a
transform, by construction, cannot notice.

I want to be honest that this is a bet on how the training block gets used next, not a
property the current code already proves. If nobody ever builds that editing view, and
`renderTrainingSheet` stays the block's only caller forever, the transform would have been
the cheaper, equally correct choice — the `new` and the defended boundary would have bought
nothing. I chose the class because a coach revising a plan while looking at it is close to
certain for this specific domain, not because a class is the more sophisticated answer in
general. It usually is not.
