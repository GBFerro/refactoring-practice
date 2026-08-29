[🌐 English](./README.en.md)

# Substitute Algorithm

`Chapter 7` · `Substitute Algorithm` · `●●○` · ~35 min

## Context

The Marlowe Community Library's catalogue search box does one thing: as a member types,
it finds every book whose title has a word starting with what they typed, closest matches
first. It has worked this way since before anyone remembers, on a catalogue that used to
be small enough that nobody worried about how the search actually found anything.

## The smell

**Loops**, and specifically loops standing in for work a language or library already does
more directly. `firstMatchingWord` walks a title one character at a time to find word
boundaries, then compares a candidate word to the query one character at a time to check a
prefix. `searchTitles` scans the catalogue once, inserting each match into a growing sorted
list by hand. None of this is *wrong* — it is correct, and the tests prove it — but every
loop here is reimplementing something `String.prototype.split`, `.startsWith`, and
`Array.prototype.sort` already do, more plainly and with fewer places to get an edge case
wrong.

## The target

**Substitute Algorithm**: replace the whole hand-rolled scan with a shorter one built from
`split`, `findIndex`, `startsWith`, and `sort`, producing the exact same ranked results —
including the two behaviours nobody designed on purpose. Unlike the rest of this module,
you cannot check this one by reading the before and after side by side; the two algorithms
share no structure. `WALKTHROUGH.md` says plainly what that means for how you have to work.

## Done when

- `searchTitles` produces identical results to the old algorithm, for every case in
  `tests/title-search.spec.ts` — none of them may be edited to make the move easier.
- No hand-written loop remains in `src/` that only compares characters, finds word
  boundaries, or maintains sort order — those are exactly the jobs the standard library
  takes over.
- `npm run lint:strict -- exercises/drills/07-encapsulation/09-substitute-algorithm/solutions`
  is clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

The prefix comparison, `matchesPrefix`. It is the smallest piece, depends on nothing else
in the file, and `String.prototype.startsWith` already does exactly what its loop does —
including the length check it has to do by hand first.
</details>

<details>
<summary>The results come out in a different order after I collapse the ranking loop.</summary>

Check what `insertByRank` actually guarantees when two entries tie on rank, and check that
whatever replaces it — almost certainly `Array.prototype.sort` — guarantees the same thing.
One test in this suite exists to catch exactly this if you get it wrong; if it is green,
trust it, but know *why* it would have failed if the guarantee had not held.
</details>

<details>
<summary>Everything passes, but I'm not sure I actually preserved the empty-query
behaviour on purpose.</summary>

Trace what the old `matchesPrefix` does when `lowerQuery` is `""`, before you look at
whether the new one agrees. If you can't say in one sentence why the old code returns
everything for an empty query, you don't yet know what you're substituting — go back and
read `src/` again before writing the replacement.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Substitute Algorithm*; chapter 3, *Loops*.
