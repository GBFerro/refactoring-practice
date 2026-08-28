# Walkthrough — one transform, one enriched record

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and the
trade-off the whole refactoring commits you to. Read it after you have your own version,
not before.

---

## Before anything: what the four functions have in common

`ageGroupOf`, `bestPaceOf`, `handicapOf`, and `isSelectableOf` each take the same
`RunnerRecord` and hand back one fact about the runner for this season. None of the four
names is bad. `bestPaceOf` says exactly what it returns; `isSelectableOf` reads at every
call site. If you ran `./rp names` against the challenge code it would come back clean,
and that is the point worth sitting with: **this exercise's smell is not a naming
problem.** Duplicated Code can live entirely at the level of well-named functions, and a
reviewer who only checks names will walk straight past it.

What the four share is that each re-derives the same two intermediate facts —
"which of this runner's results qualify," and "how old are they this season" — from
scratch, from the raw record, every single time. `handicapOf` needs the runner's best
qualifying pace to compute a handicap, so it repeats the qualifying-results filter that
`bestPaceOf` already has. It also needs the runner's age, so it repeats the age
calculation that `ageGroupOf` already has. Trace the two facts and you can draw arrows from
almost every function to almost every other one — that tangle of shared inputs, computed
independently each time, is what *Combine Functions into Transform* targets. Duplicated
logic is the symptom; a base record with several independent, overlapping readers is the
disease.

## Why extract the duplication before combining anything

The tempting shortcut is to jump straight to `enrichRunner` and write the whole thing in
one sitting. I did not, for the same reason `06-01`'s walkthrough gives for extracting
`pad2` before `renderFinisher`: **each step should operate on strictly less code than the
one before it.**

Steps 1–3 remove the *literal* duplication first — one `qualifyingResults`, one
`ageInSeason`, one `bestPace`, each called from wherever it used to be inline. This does
not fix the actual problem yet. The module still exports four functions, and
`renderSquadSheet`'s sort comparator still calls `bestPaceOf(runner)` once per comparison
and `renderSquadRow` calls it again per row — the same record, asked the same question,
twice, just with less code doing it. But it makes step 5 nearly mechanical: once
`qualifyingResults`, `ageInSeason`, and `bestPace` exist as named, singular sources of
truth, `enrichRunner` is just a function that calls each of them once and assembles the
results. Combining first, while the duplication is still spelled out three times over, is
how you get the tangle wrong.

## Steps 1–3 — the shared intermediates

```ts
// before, inside isSelectableOf
const qualifying = runner.results.filter(
  (result) =>
    result.season >= QUALIFYING_FROM_SEASON && result.distanceKm >= QUALIFYING_DISTANCE_KM,
);
```

This exact filter appears in `bestPaceOf`, `handicapOf`, and `isSelectableOf`. Extracting
it is safe and immediate — it takes `results`, returns `results`, and every call site is
already doing precisely this.

**On the name.** I called it `qualifyingResults`, not `eligibleResults`. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — is the reason. "Eligible" is
already a word this module uses for something else: `isSelectableOf` decides whether a
runner is *eligible for selection*, which depends on tenure as well as on qualifying
results. A runner can have two qualifying results and still not be selection-eligible
because they joined this season. Calling the filtered array `eligibleResults` would make
two different kinds of eligibility share one word, and the reader would have no way to
tell which one a given `eligible` meant without opening the function. "Qualifying" is the
term this club's own rules use — a result qualifies a runner for the *pace calculation*,
nothing more — and it does not collide with anything else in the file.

`ageInSeason` and `bestPace` follow the same shape: pull the repeated computation out,
name it for what it returns, call it from every site that used to inline it. Nothing
interesting happens in either — which is itself worth noticing. Not every extraction earns
a paragraph, and a walkthrough that invents drama for a plain step is worse than one that
says "this one was easy."

## Step 4 — the pure functions were already there

`ageGroupFor(age)`, `handicapFor(pace, age)`, and `meetsSelectionRules(joinedSeason, count)`
do not touch `RunnerRecord` at all — they take primitives and return a value. They existed
inside the four `*Of` functions all along, just interleaved with the record-walking code
that fed them. Separating "get the inputs from the record" (steps 1–3) from "compute the
answer from the inputs" (step 4) is what makes step 5 a pure reassembly instead of a
rewrite: by this point every piece `enrichRunner` needs already has a name and a single
call site pattern.

## Step 5 — the transform

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

Two things worth slowing down for.

First, `qualifying` and `bestPaceSecondsPerKm` are each computed once and reused —
`handicapFor` takes the already-computed pace rather than re-deriving it, and
`meetsSelectionRules` takes `qualifying.length` rather than re-filtering. This is the
actual payoff: not shorter code, but each raw fact touched exactly once per runner,
regardless of how many derived fields depend on it.

Second, `...runner` before the four new fields. `RunnerProfile extends RunnerRecord`, so
the return type demands every field of the original record plus the four new ones. This is
not optional plumbing — a caller who reads `profile.name` or `profile.results` is reading
straight through to the original data, unchanged. The transform enriches; it does not
replace.

**On the name.** `enrichRunner`, not `buildProfile` or `deriveProfile`. Question 4 again.
"Build" suggests constructing something from parts with no particular relationship to an
existing whole — reasonable for a factory, wrong here, because the output is *mostly* the
input. "Derive" undersells it even more: it implies computing something new from a source,
not carrying the source through unchanged. "Enrich" is the only one of the three that is
honest about both halves of what this function does — copy the record, then add to it —
and it happens to be Fowler's own name for the pattern, which is a good sign that it is
the word the idea actually needs.

**On the type name.** `RunnerProfile`, not `EnrichedRunner` or `RunnerView`. Question 2 —
could it be the name of something else in this file? "EnrichedRunner" names a process
(something got enriched) rather than a thing, and reads oddly at every call site:
`renderPace(profile)` is fine, `renderPace(enrichedRunner)` describes an event that already
happened rather than a kind of record. "RunnerView" was the more serious candidate, and I
rejected it because this codebase has no view layer distinct from the `render*` functions
— introducing "view" as a synonym for "enriched data" would hand the reader a second word
for a concept that already has one, `profile`, which is also the word the club's own
paperwork uses for this printout. Reusing the domain's own vocabulary won over inventing a
more "technical"-sounding one.

## Steps 6–7 — callers stop asking four times

```ts
// before
export function renderSquadSheet(runners: readonly RunnerRecord[]): string {
  const title = `Silverbrook Squad Sheet - ${String(SEASON)}`;
  const rows = [...runners].sort(byBestPace).map(renderSquadRow);
  // byBestPace calls bestPaceOf(runner) per comparison;
  // renderSquadRow calls bestPaceOf(runner) again per row.
  return [title, "=".repeat(title.length), ...rows].join("\n");
}

// after
export function renderSquadSheet(runners: readonly RunnerRecord[]): string {
  const title = `Silverbrook Squad Sheet - ${String(SEASON)}`;
  const rows = runners.map(enrichRunner).sort(byBestPace).map(renderSquadRow);
  return [title, "=".repeat(title.length), ...rows].join("\n");
}
```

This is where step 5 pays for itself. Before, `bestPaceOf` ran twice per runner just to
print one squad sheet — once to sort, once to render — and `handicapOf` reran its whole
qualifying-and-age calculation inside both `renderProfileCard` and `renderSquadRow` for
whichever runner each was called with. After, every runner is enriched exactly once, up
front, and `byBestPace` and `renderSquadRow` both read a field off the same
`RunnerProfile` instead of asking the record a question. The repeated *derivation* — the
actual target of this refactoring — is gone, not just the repeated *filter expression*.

## Step 8 — deleting the four functions

`ageGroupOf`, `bestPaceOf`, `handicapOf`, `isSelectableOf` have no remaining callers once
steps 6–7 land. Deleting them is the step people are tempted to skip — "someone might want
one of these standalone" — but a function with no caller is not a convenience, it is a
second, silently drifting implementation waiting to happen the next time someone changes
`QUALIFYING_DISTANCE_KM` and only remembers to update `bestPace`. If a future caller
genuinely needs just the age group, they can call `enrichRunner(runner).ageGroup` — the
transform is strictly more capable than the four functions it replaced, at the cost of
computing three fields nobody asked for. For a runner record, that cost is not worth
measuring.

## What it cost — the trade-off this refactoring makes

`RunnerProfile` is a *copy*, taken at one instant, of a record that can keep changing.
`enrichRunner` runs once per call, and nothing about its output stays connected to the
`RunnerRecord` it was built from. That is fine, right now, because of how this module is
actually used: `renderProfileCard` and `renderSquadSheet` both take records in, produce a
string out, synchronously, in one call. No `RunnerProfile` outlives the function that
created it, so "can the profile go stale?" has a boring answer: no, because nothing holds
onto it long enough to find out.

That answer would change the moment a caller started keeping a `RunnerProfile` around.
Picture a live results desk at a meet: squad sheets are enriched once when the day starts,
then re-displayed continuously as results come in and get appended to each runner's
`results` array behind the scenes. The cached `RunnerProfile.bestPaceSecondsPerKm` was
computed from whatever `results` looked like at enrichment time — it will not notice a
new personal best recorded five minutes later, because nothing about a plain object
listens for changes to the array it was copied from. Even the shallow copy makes this
subtler than it looks: `{ ...runner, ... }` copies the top-level fields, but `results`
itself is the *same array reference*, just typed `readonly` on the way out. TypeScript
will stop a caller from pushing into `profile.results` directly; it will not stop someone
who still has the original mutable array from pushing into it, which quietly invalidates
`profile.bestPaceSecondsPerKm` without touching `profile.results` at all — the one field
that looks like a warning sign stays perfectly innocent-looking while the field next to it
lies.

If that scenario were real, I would reach for *Combine Functions into Class* instead, the
same move `06-09`'s `TrainingBlock` makes for a different data clump: a `RunnerProfile`
class holding a `RunnerRecord` by reference, with `ageGroup()`, `bestPace()`,
`handicap()`, and `isSelectable()` as methods computed from the live record on every call
rather than fields baked in once. That would fix the staleness completely — a mutation to
`results` is visible on the very next method call — at exactly the price `06-09` already
names: a `new` where this module currently has none, and a boundary the class has to
defend so the renderer does not migrate its formatting logic inside it. A transform is the
right call when the enrichment is consumed once and thrown away; a class earns its keep
once the enrichment needs to outlive the moment it was computed.

The decision I am least sure of: `isSelectable` is a plain `boolean` field on the profile,
computed eagerly, rather than a method or a getter the caller invokes only if it needs it.
For a render-once module like this one it costs nothing — the boolean is cheap and always
used. If this type were ever exported for other modules to build on, I would want a second
opinion on whether baking in a boolean that says "at the moment this was built" is honest
enough, or whether it should read `isSelectableAsOf: number` instead. I did not change it,
because nothing in this module needs that precision yet, and a field nobody reads is not
worth inventing ahead of the need.

## If you took a different route

- **Extracting the pure functions (step 4) before the record-reading ones (steps 1–3).**
  Workable, and arguably cleaner in isolation, but you end up assembling `enrichRunner`
  out of functions that are individually correct while the record-walking code around
  them is still triplicated — the win from step 4 is easy to notice and the win from
  steps 1–3 is easy to skip once you're not looking straight at the duplication anymore.
- **Memoizing the four original functions instead of combining them** — a `WeakMap` keyed
  on the runner record, so a second call to `bestPaceOf(runner)` returns a cached answer.
  This removes the *redundant computation* without removing the *four separate entry
  points*, and it trades a straightforward data flow for a cache with its own
  invalidation question the moment `runner.results` changes. Defensible for a genuinely
  expensive derivation; overkill for arithmetic this cheap.
- **Naming the transform's output `RunnerReport` instead of `RunnerProfile`.** Both are
  honest nouns. I preferred `Profile` because the rendered card is literally titled with
  the runner's name the way a profile is, and `Report` in this codebase's vocabulary
  (`renderRaceReport` in `06-01`) means something closer to a whole printed document than
  one runner's row in it.

What is *not* a matter of taste: leaving the qualifying-results filter duplicated across
three functions, or leaving `handicapOf` re-deriving the best pace inline instead of
calling the one function that already computes it. Those are the two things this exercise
exists to remove — everything else in this walkthrough is a judgement call I would defend
but would not insist on.
