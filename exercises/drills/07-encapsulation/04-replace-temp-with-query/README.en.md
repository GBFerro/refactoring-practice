[🌐 English](./README.en.md)

# Replace Temp with Query

`Chapter 7` · `Replace Temp with Query` · `●●○` · ~25 min

## Context

Once a month, the Marlowe Community Library runs a billing job that walks every loan and
works out one line for the printed run: how many days late it is, whether the grace period
covers it, and what the fine comes to once the item's daily rate and the per-loan cap are
applied. The function has grown one policy detail at a time — first the day count, then a
grace period, then a rate that varies by item, then a cap — and each addition left behind
a variable that the rest of the function has been carrying ever since.

## The smell

**Long Function**, and specifically the shape of it: `overdueNotice` computes `late`,
`chargeable`, `dailyRateCents`, `rawFineCents`, and `wasCapped` all near the top, for use
in branches and a return statement well below. None of these temps is reused across calls
— each is read only within the one function that computes it — but within that function,
several of them live far longer than the couple of lines that actually need them.

## The target

**Replace Temp with Query**: turn each long-lived temp into a small function that
recomputes the same answer from `loan` and `today` on demand. When you are done, nothing
in `overdueNotice` is assigned once and read three branches later — every value is asked
for exactly where it is used.

This trades memory for time: a temp pays for its value once and every later read is free; a
query pays on every call and never pays up front. `WALKTHROUGH.md` is explicit about where
that trade is free here and where the exact same move would be the wrong call.

## Done when

- `overdueNotice` reads its values from named queries (`daysLate`, `chargeableDays`,
  `fineCents`, `fineWasCapped`), not from temps computed at the top of the function.
- Every query takes `(loan, today)` and computes its answer independently — none of them
  is passed an already-computed value from a sibling query.
- `npm run lint:strict -- exercises/drills/07-encapsulation/04-replace-temp-with-query/src`
  is clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

`formatCents` first — it depends on nothing and is not even a temp, just a small
`Extract Function` warm-up. Then work up from `daysLate`, which every other query in this
file eventually depends on.
</details>

<details>
<summary>Do I need to pass `late` into `chargeableDays`, so it does not have to
recompute it?</summary>

No — that is the one habit this drill is trying to break. A query recomputes from its
parameters; if `chargeableDays` took the already-computed `late` as an argument, you would
have turned a temp into a parameter instead of removing it, and the two would be free to
drift out of sync the day someone changes one call site and not the other.
</details>

<details>
<summary>This seems wasteful — the same date arithmetic runs more than once per notice.</summary>

It does, and that is worth noticing rather than shrugging off. Trace how many times
`daysBetween` actually runs for one call to `overdueNotice` once every query is in place.
Whether that count is a real cost depends entirely on what `daysBetween` is doing — see
`WALKTHROUGH.md` for the answer this drill gives, and for what would change it.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Replace Temp with Query*; chapter 3,
*Long Function*.
