# Walkthrough — small queries, not long-lived temps

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and what the
trade this refactoring makes actually costs. Read it after you have your own version, not
before.

---

## Before anything: find where each temp actually lives

`overdueNotice` grew one policy detail at a time — a grace period, a per-item rate, a cap —
and each detail left behind a variable declared near the top and read somewhere below:

```ts
const effectiveDate = loan.returnedOn ?? today;
const late = daysBetween(loan.dueOn, effectiveDate);
// ... two branches later ...
const dailyRateCents = DAILY_RATE_CENTS[loan.itemKind];
const rawFineCents = chargeable * dailyRateCents;
const wasCapped = rawFineCents > FINE_CAP_CENTS;
const fineCents = Math.min(rawFineCents, FINE_CAP_CENTS);
// ... used in the return statement, further still ...
```

`late` is read three times across the function: once to decide "not overdue," once to feed
`chargeable`, once in the final message. None of that requires `late` to be a variable —
it requires `late` to be *answerable*, on demand, by anyone who asks. That distinction is
the whole refactoring.

## Why this order

Extract leaves first, same reasoning as `drill-06-01`: `formatCents` depends on nothing,
`daysLate` depends only on `daysBetween` (already a function), `chargeableDays` depends on
`daysLate`, and so on up the chain. Doing them in dependency order means every step only
ever has to reason about code that already exists, never about a query it is about to
write next.

## Step 1 — `formatCents`

```ts
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
```

Not a temp — a plain `Extract Function`, and the smallest thing in the file. It goes first
for the same reason `pad2` went first in `drill-06-01`: it is a two-line warm-up that
proves nothing risky before the actual temps are touched.

## Step 2 — `daysLate`, and the first temp gone

```ts
export function daysLate(loan: Loan, today: string): number {
  return daysBetween(loan.dueOn, loan.returnedOn ?? today);
}
```

Everywhere `late` was read, it becomes `daysLate(loan, today)`. The function now computes
the same date arithmetic every time it is asked, instead of once and remembered. For one
loan, on one call, that is free — `Date.parse` twice is not a cost anyone will measure.

**On the name.** `daysLate`, not `overdueDays` or `lateBy`. Question 3 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — does it read at the call site — decides
it: `chargeableDays(loan, today)` calling `daysLate(loan, today)` inside reads as one
query built from another; `overdueDays` calling `lateBy` would not tell you which one
composes on top of the other without opening both. Matching the noun (`days...`) across
the two names is doing real work here, not decoration.

## Step 3 — `chargeableDays`

```ts
export function chargeableDays(loan: Loan, today: string): number {
  return Math.max(0, daysLate(loan, today) - GRACE_DAYS);
}
```

The `chargeable` temp is gone the same way `late` was. Notice this function does not take
`late` as a parameter — it recomputes `daysLate` itself. That is deliberate, and it is the
detail the next two steps depend on reading correctly.

## Step 4 — `rawFineCents`, and where the recomputation starts to compound

```ts
function rawFineCents(loan: Loan, today: string): number {
  return chargeableDays(loan, today) * DAILY_RATE_CENTS[loan.itemKind];
}
```

Not exported — nothing outside `fine.ts` needs the pre-cap number. `dailyRateCents` never
became its own query; it was a temp used once, immediately, so it is folded straight into
the expression that used it. Not every temp earns a name of its own — some just evaporate
into the query that was the only reason they existed.

This is the step where the cost becomes visible on paper: `rawFineCents` calls
`chargeableDays`, which calls `daysLate`, which calls `daysBetween`. Three function calls
to answer one number that used to be three temp reads.

## Step 5 — `fineCents`

```ts
export function fineCents(loan: Loan, today: string): number {
  return Math.min(rawFineCents(loan, today), FINE_CAP_CENTS);
}
```

**On the name.** `fineCents`, not `fine` or `amountOwed`. `fine` fails question 2 — it
could be a boolean ("is this loan fined"), a reason string, or the amount, and a reader
cannot tell which without opening the function. Carrying the unit in the name
(`fineCents`, not `fine`) is this repository's own convention for unit-bearing numbers, and
it is doing double duty here: it also stops a future caller from silently comparing this
against a dollar amount.

## Step 6 — `fineWasCapped`

```ts
export function fineWasCapped(loan: Loan, today: string): boolean {
  return rawFineCents(loan, today) > FINE_CAP_CENTS;
}
```

**On the name.** `fineWasCapped`, not `isCapped`. Question 4 — is it true — is why:
`isCapped` reads as a property of the loan itself, as if some loans are permanently
"capped" ones. `fineWasCapped` names it as the outcome of one calculation, for one
`(loan, today)` pair, which is what it actually is — ask again tomorrow and a loan that was
capped today might not be. The `is*` convention this repository otherwise uses is for
states, not for one-off verdicts, and this is a verdict.

`fineCents` and `fineWasCapped` are the two queries that make the recomputation cost
concrete rather than theoretical: both call `rawFineCents`, which calls `chargeableDays`,
which calls `daysLate`, which calls `daysBetween`. By the time `overdueNotice` has called
`daysLate` directly, then `chargeableDays`, then `fineCents`, then `fineWasCapped`, I
instrumented it once out of curiosity: **`daysBetween` runs four times** for one call to
`overdueNotice` when a fine actually applies, computing the same day count on the same two
dates every time. That is the honest number, not a guess — see "What it cost" below for
what to do with it.

## Step 7 — splitting into modules

`loan.ts` keeps the type and the date arithmetic; `fine.ts` gets the money queries;
`format.ts` gets the one formatter; `overdue-notice.ts` composes them. Purely
organisational — nothing here changes what runs, only where the reader finds it once the
function that used to hold everything is four lines of composition.

## What is left, and what it cost

```ts
export function overdueNotice(loan: Loan, today: string): string {
  const late = daysLate(loan, today);
  if (late <= 0) return "Not overdue.";
  const chargeable = chargeableDays(loan, today);
  if (chargeable === 0) return `${late} day(s) overdue, within the grace period - no fine.`;
  const capNote = fineWasCapped(loan, today) ? " (capped)" : "";
  return `${late} day(s) overdue (${chargeable} chargeable) - fine ${formatCents(fineCents(loan, today))}${capNote}.`;
}
```

No variable here outlives the couple of lines it is used in, and every question this
function answers — is it late, by how much, does the grace period cover it, what is owed —
has one place that computes it, callable on its own, independently testable, independently
reusable. `drill-06-01`'s step 10 called this move "worth measuring rather than assuming"
when it turned one accumulator into one query over a small list. This drill is the
opposite case: the recomputation is not free, it compounds, and it is worth being precise
about instead of hand-waving.

**The actual cost, stated plainly.** `Replace Temp with Query` trades memory for time: a
temp pays once, up front, and every later read is free; a query pays on every read, and
never pays anything up front. Here that trade is free in practice — `daysBetween` is two
`Date.parse` calls and some arithmetic, running four times instead of once is not a
duration anyone will notice, and this function runs once per loan on a monthly billing job,
not in a hot loop. I would not make the same call if any of that were different:

- **If `daysBetween` did real work** — a timezone-aware calendar lookup, a call to another
  service, a query against a database — four calls instead of one stops being a rounding
  error and starts being the dominant cost of the function. At that point the right shape
  is closer to `Combine Functions into Transform` or a plain memoisation: compute the
  expensive value once, attach it to something, let every query read the attached value
  instead of recomputing it.
- **If `today` were not a parameter.** Every query here takes `(loan, today)` explicitly,
  which is what makes recomputing safe: `daysLate`, `chargeableDays`, `fineCents`, and
  `fineWasCapped` all agree on what "today" means because they were all handed the same
  value. If any of them instead called `new Date()` internally, a call to `overdueNotice`
  that happened to straddle midnight could have `daysLate` and `chargeableDays` disagree
  about how many days have passed — the exact "source mutates between reads" danger the
  book warns about, self-inflicted by turning a stable parameter into a live clock read.
  Passing `today` down is not incidental to this refactoring being safe; it is the reason
  it is safe.
- **If the loan itself could change underneath the calculation** — a concurrent renewal or
  return landing between two of these query calls — recomputing four times could see four
  different loans, where a single temp read at the top would have seen one consistent
  snapshot. Nothing here does that (`Loan` is read-only data, not a live handle), but it is
  the general shape of the risk: a query is only as safe to repeat as its inputs are stable
  to read twice.

The decision I am least sure about: I did not memoize anything, even though `rawFineCents`
alone is computed twice (once from `fineCents`, once from `fineWasCapped`) on every call
that reaches it. Four `daysBetween` calls for two `Date.parse`-cheap operations felt too
small to justify a cache, but "too small to justify" is a judgement call about a cost I
measured only informally, not with a profiler on real load. If this function were called
per-loan across a large collection loan-by-loan rather than once, I would want to see
actual numbers before deciding this stays as-is.

## If you took a different route

- **Keep `late` and `chargeable` as function-scoped temps inside `overdueNotice`, and only
  extract `fineCents` and `fineWasCapped` as queries.** Defensible — those two are the
  values genuinely reused across the two return branches at the bottom, where `late` and
  `chargeable` are each read close to where they are computed. I extracted all four for
  consistency and because `chargeableDays` and `daysLate` are useful on their own to a
  caller that only wants the day count, not the money.
- **Memoize `daysLate` and `chargeableDays`** — cache by `(loan, today)` inside the module,
  invalidated on nothing since both are pure. Reasonable if the measured cost ever
  justified it; premature here.

What is *not* a matter of taste: leaving a temp that is genuinely read only once, right
after it is declared, un-refactored. Not every `const` is this smell — only the ones whose
declaration and every use are separated by code that has nothing to do with them.

## Where TypeScript makes this different from the book's JavaScript

Nothing about the mechanics changes — `Replace Temp with Query` is language-agnostic. What
TypeScript adds is confidence in the recomputation being *safe* to repeat: `Loan`'s fields
are `readonly`, so the compiler, not just convention, guarantees `daysLate(loan, today)`
returns the same answer on every call within one `overdueNotice` invocation. The book's
JavaScript examples have no such guarantee available to them; a plain object's fields can
be reassigned by anything holding a reference, and Fowler's own caution about a query
"getting a different answer" if the underlying data changes between calls is a real risk
in JavaScript that `readonly` turns into a compile error here before the refactoring even
starts.

Run `./rp review 07-04` if you want a second opinion on the route you actually took — it
builds a packet that deliberately withholds this file from the reviewer, so you get judged
on your own terms rather than on your resemblance to me.
