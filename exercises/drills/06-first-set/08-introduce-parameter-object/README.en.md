[🌐 English](./README.en.md)

# Introduce Parameter Object

`Chapter 6` · `Introduce Parameter Object` · `●○○` · ~25 min

## Context

Silverbrook Athletics Club prints a season report for any window a secretary asks for:
everything since the season opened, one calendar month, or a custom `from`/`to` range
typed at the prompt. All three end up building the same report over the same window.

## The smell

**Data Clumps**, with **Long Parameter List** as the symptom. `from` and `to` are always
passed together — they never travel alone — and they are threaded through `renderReport`,
`renderRangeLine`, `racesInRange`, and `renderTotals`. Two of those functions also
recompute the same span-in-days arithmetic, once to print it and once to divide by it,
because there is nowhere for that calculation to live except at each call site.

Two strings that are only ever meaningful together, re-derived instead of shared, are the
tell: the data wants to be one thing, not two.

## The target

**Introduce Parameter Object**: collapse `from` and `to` into one `DateRange`. Mechanically
that is most of the exercise, but it is not all of it — a bag with two fields and a
constructor is not much of a win by itself. The second half of the move, in the book's own
mechanics, is looking for behaviour that belongs on the new type: the inclusion check, the
day count, the month-window builder. Not every candidate is worth taking; part of the
exercise is deciding which ones are.

## Done when

- `from` and `to` no longer appear as a pair anywhere in `src/`; every function that needs
  the window takes one `DateRange`.
- The day-count arithmetic exists in exactly one place.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/06-first-set/08-introduce-parameter-object/src`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. The three functions the club's tooling actually
calls — `renderSeasonToDate`, `renderMonthReport`, `renderCustomReport` — keep their
signatures; the suite in `tests/callers.spec.ts` only pins those three. Everything below
that boundary, every place `from` and `to` are threaded through today, is yours to
redesign. That is the point of the exercise: `DateRange` is invisible from outside the
module, so nothing stops you from introducing it, and nothing forces a particular shape on
it either.

## Hints

<details>
<summary>Where do I start?</summary>

`renderCustomReport` is the only function that already receives `from` and `to` as a pair
from outside. Build the empty `DateRange` there first — fields and a constructor, nothing
else — and let it sit unused by anything but that one caller before you chase it through
the rest of the file.
</details>

<details>
<summary>I've replaced every `from`/`to` pair with `range`. Now what?</summary>

Look at what each function does with `range.from` and `range.to` once it has them.
`racesInRange` compares a date against both ends — that comparison is `DateRange`'s to
make, not the caller's. Two other functions compute the same span in days. Whenever the
same expression appears twice on either side of `range`, that is the signal, not a
stylistic preference.
</details>

<details>
<summary>Should `weeks` be a getter, or is that overreaching?</summary>

There is no single right answer here, which is why the walkthrough spends a paragraph on
it. Ask what `days` earned that `weeks` would not: is the expression duplicated anywhere,
or does it appear exactly once? A method with one caller is not automatically ceremony, but
it is not automatically justified either.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Introduce Parameter Object*; chapter 3, *Data
Clumps* and *Long Parameter List*.
