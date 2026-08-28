# Walkthrough — a DateRange the report can ask questions of

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what each name had to earn, and the one
decision I went back and forth on. Read it after you have your own version, not before.

---

## Why `apiFrozen: false`, and what that changes

`tests/callers.spec.ts` only imports `renderSeasonToDate`, `renderMonthReport`, and
`renderCustomReport` — the three functions the club's own tooling calls. It says nothing
about `renderReport`, `renderRangeLine`, `racesInRange`, or `renderTotals`: those are
private to the module, so nothing outside `src/` can be broken by changing them.

That is why this drill can declare `apiFrozen: false` safely. Introduce Parameter Object is
a signature change by definition — you cannot collapse two parameters into one without
changing every function that took the two — so a drill built around it either freezes the
boundary and tests through it, or has nothing left to test. Freezing the three entry points
lets the suite pin *behaviour* (what a report says) while leaving *shape* (how the window
gets from caller to renderer) entirely up to you. If you designed `DateRange` differently
from mine and the suite is still green, you did the exercise correctly.

## Why this order

Two questions before anything: **where does the pair already exist as a pair**, and **what
does each function actually do with it once it has it**?

`from` and `to` arrive together at exactly one place: `renderCustomReport`, which receives
them from outside. Everywhere else they are *derived* — `renderSeasonToDate` builds `to`
from `today` and `from` from `season.opensOn`; `renderMonthReport` builds both ends from a
`yyyy-mm` string. That asymmetry decides step 1: build the empty `DateRange` at the one
place that already has a natural pair, before chasing it through the rest of the file.

The second question — what happens to the pair once a function has it — decides steps 3
and 4. `racesInRange` compares a date against both ends. `renderRangeLine` and
`renderTotals` both compute `(Date.parse(to) - Date.parse(from)) / MS_PER_DAY + 1` — the
same expression, twice, because there was nowhere for it to live except at each call site.
Neither is incidental. They are the reason the Data Clump is worth turning into a type at
all, and they only become visible once step 2 has put `range` in front of you at every call
site simultaneously.

> Looking for behaviour to extract *before* collapsing the parameters would mean extracting
> from four different two-string signatures instead of one. Same destination, more
> friction. Introduce the object first; let it show you what it should do second.

## Step 1 — the empty class

```ts
export class DateRange {
  readonly from: string;
  readonly to: string;

  constructor(from: string, to: string) {
    this.from = from;
    this.to = to;
  }
}
```

Nothing else yet. Fowler's mechanics call this out explicitly: create the structure, test,
*then* start moving functions onto it. Skipping straight to "class with methods" tempts you
into designing the interface before you have seen what needs it.

**On the name.** `DateRange`, not `Period` or `Window`. `Period` is a real accounting term
in this domain (a season has periods too, eventually) and would collide; `Window` reads
fine in prose but not at a call site — `new Window(from, to)` sounds like a UI concern.
`DateRange` says what it is without describing how it is stored (question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md)), and it will not go stale if the internal
representation ever stops being two ISO strings.

## Step 2 — threading it through the pipeline

This is the step that has to move four functions in one commit, because
`renderReport(season, from, to)` has three callers and all three break the moment its
signature changes.

```ts
// before
export function renderReport(season: Season, from: string, to: string): string { ... }

// after
export function renderReport(season: Season, range: DateRange): string { ... }
```

`renderRangeLine`, `racesInRange`, and `renderTotals` follow the same shape — one parameter
in place of two, `range.from`/`range.to` wherever `from`/`to` used to be. In `reports.ts`,
`renderCustomReport` now builds `new DateRange(from, to)` and passes it on; the other two
callers build one from their own derived strings. Nobody outside the module can tell the
difference — that is what `apiFrozen: false` bought.

This step is deliberately *only* the signature change. `racesInRange` still writes
`race.date >= range.from && race.date <= range.to`, reaching into the fields instead of
asking a question. That is next.

## Step 3 — `includes`, and where the comparison belongs

```ts
// before, in racesInRange
races.filter((race) => race.date >= range.from && race.date <= range.to)

// after: DateRange gains `includes(date) { return date >= this.from && date <= this.to; }`
races.filter((race) => range.includes(race.date))
```

The comparison did not change; where it lives did. Before this step, "is this date inside
the range" was knowledge every caller needed and every caller could get slightly wrong — a
stray `>` instead of `>=` at either end is an off-by-one that only shows up at the boundary
dates. After this step there is exactly one place that can be wrong, and the boundary test
in the suite (`includes races on both end days and excludes the days either side`) pins it
there once instead of at every call site that might reimplement the check.

**On the name.** `includes`, not `contains` or `isWithin`. This is question 3 — check the
call site: `range.includes(race.date)` reads as one clause, borrowing the shape everybody
already knows from `Array.prototype.includes`. `contains` is a fine synonym in isolation but
adds nothing; `isWithin(date, range)` inverts subject and object and reads worse at every
call site that has `range` already in hand.

## Step 4 — `days`, and deleting the duplicate

```ts
// before, in both renderRangeLine and renderTotals, verbatim
const days = (Date.parse(to) - Date.parse(from)) / MS_PER_DAY + 1;

// after: DateRange gains `get days() { return (Date.parse(this.to) - Date.parse(this.from)) / MS_PER_DAY + 1; }`
```

Both call sites become `range.days`, and `MS_PER_DAY` moves out of `season-report.ts`
entirely — it was never that module's constant to own. This is the step that makes the
whole exercise worth doing: two identical expressions collapse into one property that
cannot drift out of sync with itself, the same way `formatDuration` did in the Extract
Function drill. The difference is the trigger. There the duplication was visible on the
page, ten lines apart. Here it was only visible *after* step 2 put both call sites behind
the same `range` — before that they were two-string computations in two files that did not
look like copies of each other at all.

**On the name.** `days`, not `length` or `spanDays`. `length` is a lie here — question 4 —
it suggests an array or a string, and this is neither. `spanDays` is truer but redundant:
the type is already called `DateRange`, so `range.days` already says "days, of a range" at
the call site without repeating it in the property name.

## Step 5 — `weeks`, and the decision I am not sure about

```ts
// before, in renderTotals
`Weekly average: ${formatKm(totalKm(races) / (range.days / 7))}`

// after: DateRange gains `get weeks() { return this.days / DAYS_PER_WEEK; }`
```

I added this getter, and I want to be honest that I flip-flopped on it. Against: `range.days
/ 7` has exactly one caller. There is no duplication for `weeks` to remove, unlike `days`,
which existed in two places before it had a name — a getter with one call site is a coin
flip away from what the `meta.json` review focus warns about: "a parameter object over
values that do not always travel together is ceremony" applies to *methods* added for their
own sake, not only to the fields.

For it — the argument I ended up finding more convincing — `renderTotals` already reads
as a list of *questions about the range and the races in it* — `totalKm(races)`,
`longestRace(races)` — and `range.weeks` sits at the same level as its neighbours.
`range.days / 7` is a detail (why seven?) leaking into a function that otherwise reads as a
plain list of facts.

Neither argument is decisive. Leaving `weeks` out and writing `range.days / 7` inline is a
legitimate answer to this exercise. What is *not* defensible is duplicating the `days`
arithmetic again instead of reusing the getter from step 4 — that re-introduces the exact
duplication step 4 removed, under a different name.

## Step 6 — `monthOf`, and the moment the type starts pulling weight

```ts
// before, in reports.ts: renderMonthReport computes year/ordinal/lastDay itself,
// then calls renderReport(season, `${month}-01`, lastDay.toISOString().slice(0, 10))

// after
export function renderMonthReport(season: Season, month: string): string {
  return renderReport(season, monthOf(month));
}
```

The four lines of `Date.UTC` arithmetic move, unchanged, into `date-range.ts` as
`monthOf(month): DateRange`, exported beside the class.

This is the step the exercise is really about, more than steps 1 and 2 are. Collapsing two
parameters into one object is mechanical — a class with two fields is barely more than a
tuple with better field names, and by itself it does not earn the cost in `meta.json`'s
trade-off. What earns it is that once `DateRange` exists, code that was *about* date ranges
— the boundary check, the day count, and now "what range is this calendar month" — has
somewhere to go that is not the caller. `monthOf` was never really `renderMonthReport`'s
logic; it was date-range arithmetic written inside a report function because there was
nowhere else for it to live yet.

The test to apply, in general: **a parameter object earns its keep when the values travel
together everywhere they appear, and when at least one caller was doing the object's job
for it.** `DateRange` passes both. If `from` and `to` had shown up together in only one
signature, or if nothing downstream had ever compared or derived from them, this would have
been a class with two fields, a constructor, and zero methods — a record wearing an object's
syntax, the exact failure mode the review focus asks about. The three methods this type
picked up were not designed in; they were found, one un-inlining at a time, by asking
"whose job was this really."

**On the name.** `monthOf`, not `DateRange.forMonth` as a static method. Question 3 again:
`monthOf(month)` reads as a sentence fragment at the call site —
`renderReport(season, monthOf(month))`. `DateRange.forMonth(month)` is not wrong, but makes
every caller name the type twice: once to reach the factory, once implicitly in what it
returns. TypeScript does not push you toward static factories the way Java does — a
module-level function beside a class is just as encapsulated, and chapter 11's *Replace
Constructor with Factory Function* is explicitly about freeing the factory from having to be
a method on the class it builds. I used that freedom here.

## What this cost

Three things worth naming plainly:

- **A type to construct at every entry point.** All three functions in `reports.ts` now
  build or obtain a `DateRange` before they can call `renderReport`. For a report with one
  consumer this is not a real cost. For a report with fifty scattered callers, that is
  exactly the kind of thing Preserve Whole Object (chapter 11) exists to make easier — pass
  the object through from wherever it is first available, instead of re-deriving it at
  each boundary.
- **A standing invitation.** `DateRange` will attract a `format()`, an `overlaps()`, the
  moment anyone needs one. Some will be step 4 again — genuine duplication with nowhere
  else to live. Some will be step 5 again — one caller's convenience dressed up as the
  type's responsibility. The type itself cannot tell you which; only counting callers can.
- **The `weeks` getter**, named above, is the one I would not be surprised to see reverted
  in review.

## Where TypeScript makes this different from the book

Fowler's examples are JavaScript classes with no static typing, so a field like `from` is a
convention, not a guarantee — nothing stops a caller reassigning `range.from` after
construction. Here, `readonly from: string; readonly to: string;` makes that a compile
error: `DateRange` is handed to four functions, and none needs to worry about the others
mutating it. Getters (`get days()`, `get weeks()`) are similarly stronger than a plain-JS
computed property — `range.days` type-checks as `number` everywhere, so the collapsed
arithmetic could not have turned into a duplicated *bug*: the compiler catches a
`days: string` slip immediately, where the equivalent JavaScript fails only once a template
string somewhere produces `NaN`.

## If you took a different route

Several real alternatives, roughly in order of how defensible they are:

- **Leaving `weeks` out**, discussed above. Fully defensible; arguably the more
  conservative choice.
- **`monthOf` as a plain function in `reports.ts`** that happens to return a `DateRange`,
  instead of living in `date-range.ts`. Also defensible — it is calendar arithmetic, and
  you could argue it belongs closer to where months get parsed than where ranges get
  compared. I put it beside the class because it returns the type and nothing about it is
  specific to reports, but this is a judgment call, not a rule.
- **A static `DateRange.forMonth` instead of a free `monthOf`.** Discussed under step 6.
  House style more than correctness.
- **Doing step 2 as four small commits instead of one.** More cautious, same destination.
  In a real codebase with slow CI or per-function review, that is probably the better call;
  I bundled it here because all four functions live in one 57-line file and the risk of an
  inconsistent mid-state is low.

What is *not* a matter of taste: leaving the day-count arithmetic duplicated after
`DateRange` exists, or leaving the inclusion check as a raw string comparison at the call
site instead of a method — the two things this exercise exists to remove.
