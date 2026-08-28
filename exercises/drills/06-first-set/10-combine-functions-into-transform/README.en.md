[🌐 English](./README.en.md)

# Combine Functions into Transform

`Chapter 6` · `Combine Functions into Transform` · `●○○` · ~30 min

## Context

Every autumn, Silverbrook Athletics Club reprints two things from the same membership and
results data: a one-page profile card for each runner, and a squad sheet ranking everyone
for selection. Both need the same four facts about a runner — age group, best qualifying
pace, handicap allowance, and whether they are selectable this season.

## The smell

**Duplicated Code**. Four functions — `ageGroupOf`, `bestPaceOf`, `handicapOf`,
`isSelectableOf` — each take the same `RunnerRecord` and each re-derive the same two
underlying facts from scratch: which results qualify, and how old the runner is this
season. None of the four names is bad; the smell lives one level below naming, in how many
times the same record gets asked the same underlying questions. It hurts here because the
qualifying-results filter is duplicated three times over, and `renderSquadSheet` ends up
calling `bestPaceOf` on the same runner twice just to print one row — once to sort, once
to render.

## The target

**Combine Functions into Transform**: one function, `enrichRunner`, that derives every
qualifying fact once from the raw record and returns an enriched copy — the original
fields, plus the four derived ones. Callers stop asking the record questions and start
reading fields off the transform's output.

## Done when

- `ageGroupOf`, `bestPaceOf`, `handicapOf`, and `isSelectableOf` no longer exist; nothing
  in `src/` derives the same underlying fact (qualifying results, age) more than once per
  runner per call.
- `enrichRunner` returns a `RunnerProfile` that carries every `RunnerRecord` field plus
  the four derived ones, and both `renderProfileCard` and `renderSquadSheet` read from it.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/06-first-set/10-combine-functions-into-transform/src`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not with `enrichRunner`. Find the two facts every one of the four functions needs — which
results qualify, and the runner's age this season — and extract each as its own function
first, called from wherever it is currently inline. Once those two extractions exist, the
transform is close to writing itself.
</details>

<details>
<summary>I've deduplicated the filters, but it still feels wrong.</summary>

Look at `renderSquadSheet`. Even with a single, shared `qualifyingResults` helper, the sort
comparator and the row renderer each call `bestPaceOf(runner)` separately for the same
runner. Deduplicating the *logic* is not the same as deduplicating the *derivation* — a
runner's best pace is still being worked out twice per row. That is what the transform
actually fixes: derive it once, store it, read it twice.
</details>

<details>
<summary>Should `RunnerProfile` copy `results`, or keep the same array?</summary>

Neither choice is free, and the answer matters for what you can safely say about the
result afterward. A shallow copy (`{ ...runner, ...derived }`) is the standard move and
what this exercise expects — but notice what it does and does not protect: the top-level
fields are frozen at enrichment time, while `results` is still the exact same array
reference underneath. Worth sitting with before you decide it doesn't matter here.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Combine Functions into Transform*; chapter 3,
*Duplicated Code*.
