[🌐 English](./README.en.md)

# Separate Query from Modifier

`Chapter 11` · `Separate Query from Modifier` · `●●○` · ~30 min

## Context

The Halliday Box Office runs seat holds for one show at a time: a customer asks for a
section, the box office finds the next best open seat and holds it while checkout
finishes. The same lookup also backs a kiosk display that quotes the next available seat
before anyone commits, and a "sold out?" check the booking page runs before it even shows
the section.

## The smell

**Mysterious Name.** `findSeatAndReserve` reads, to a caller who trusts the first half of
its name, like a lookup: pass it a section and get back the next open seat, or `null`. It
also holds that seat for whatever customer id it was handed — every single time it is
called, including the two call sites that only wanted the answer. `nextSeatQuote` and
`sectionHasAvailability` both invent a placeholder customer id to feed a parameter they
have no real value for, which is the second symptom of the same problem: a caller that has
to counterfeit a customer to ask a question was never really asking about a customer.

## The target

**Separate Query from Modifier**: split the lookup into a query that only answers — `Seat
| null`, nothing written — and a modifier that only holds a seat it is handed. The one
caller that genuinely wants both calls them in sequence, explicitly, instead of getting the
pairing hidden inside a function whose name only advertised half of it.

## Done when

- `nextAvailableSeat` never assigns to a seat's `status` or `heldBy`, in any branch.
- `nextSeatQuote` and `sectionHasAvailability` no longer pass a placeholder customer id to
  anything — there is nothing left that needs one.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/11-apis/01-separate-query-from-modifier/src`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. `tests/callers.spec.ts` imports only the three
callers — `holdNextAvailableSeat`, `nextSeatQuote`, `sectionHasAvailability` — and never
the seat lookup by name, because renaming and reshaping that lookup is the entire point.
It also does not pin whether a quote or an availability check leaves a seat held
afterwards — the challenge and a correct solution disagree there on purpose, and the
proof that the solution is right lives in `tests-fixed/`, which only ever runs against
solutions. Read it once you're done; it spells out exactly what was wrong.

## Hints

<details>
<summary>Where do I start?</summary>

Not by moving a caller. Add `nextAvailableSeat` next to `findSeatAndReserve` first, copying
the search it already does, and have `findSeatAndReserve` call the new function instead of
repeating the search inline. Nothing a caller sees can change yet — you have only given the
search a name. Do the same for the mutation before you touch a single caller.
</details>

<details>
<summary>Which caller do I move first?</summary>

Save `nextSeatQuote` and `sectionHasAvailability` for last, not first. `holdNextAvailableSeat`
wants both pieces anyway, so moving it onto the query and the modifier directly cannot
change what it returns — it's the same safe kind of step as the extraction. The other two
are where the behaviour actually changes, and each is safer to move alone, one commit each,
so a red suite points at exactly one caller.
</details>

<details>
<summary>What do I do with the placeholder customer ids?</summary>

Delete them along with the call sites that invented them. `"quote"` and
`"availability-check"` were never real customers — they existed only because
`findSeatAndReserve` demanded a third argument even from callers that had no seat to hold.
Once those two callers call the query instead, there is no parameter left to fill.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 11, *Separate Query from Modifier*; chapter 3,
*Mysterious Name*.
