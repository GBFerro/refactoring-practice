# Walkthrough — Trip renamed, the published log row frozen on purpose

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what each name had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: which rename is this?

Fowler's *Rename Field* mechanic starts with a question: is the record already
encapsulated? If it isn't, and every reader of the field is code the compiler checks for
you, you can rename directly — the type checker turns "did I catch every call site" into a
build failure instead of a code review question. If the record's fields are read by
something the compiler *can't* see — another service, a file on disk, a team in a different
repository — a direct rename is not safe at any speed, because nothing will tell you what
you missed. That case needs `drill-07-01`'s move first: wrap the record behind accessors, so
every read funnels through one place, and only then rename the field the accessor exposes.

This drill is built to make you apply that test field by field, because `Trip` fails it
twice in two different ways for the *same* three fields:

- `fare.ts` and `route-summary.ts` read `trip.dt`, `trip.st`, and `trip.en` directly. Both
  are TypeScript, both live in this package, both get checked by `tsc` on every build. For
  these two, the direct rename is exactly as safe as the book says it is.
- `trip-log.ts` also reads `trip.dt`, `trip.st`, and `trip.en` directly — but it turns
  around and writes them straight back out under a `TripLogRow` whose keys are the CSV
  header already published to Riverline's analytics warehouse. Nothing in this repository
  reads `TripLogRow`; an external batch job does, and it has no idea this package exists,
  let alone that a refactoring ran in it today.

Same field, same file even, two different verdicts. That is the entire judgement call this
drill is built around, and it is why the field-by-field table in `STEPS.md` says
"rename `dt` ... in `Trip`, `newTrip`, and every internal reader" rather than "rename `dt`
everywhere" — `TripLogRow`'s `dt` is not an internal reader of `Trip`'s field. It is a
different field, on a different type, that happens to be spelled the same way today because
nobody has ever had a reason to make it spell differently.

## Why field by field

Three commits, one field each, in the order `dt`, `st`, `en` — the order the fields are
declared in. Nothing about the order is meaningful on its own; what matters is that each
commit is independently bisectable. `fareCents` only reads `dt`, so step 1 alone proves the
whole `fare.ts` side of the rename. `routeSummary` reads both `st` and `en`, so it doesn't
fully settle until step 3 — and if something breaks in `routeSummary` after step 2, you know
immediately that it's the `st` side, not the `en` side, because `en` hasn't moved yet.

A single commit renaming all three would be no less safe here — the compiler catches a
missed site regardless of how many fields move at once — but it would be less useful to a
reviewer, who would have to hold three renames in mind at once to check any one of them.

## Step 1 — `dt` becomes `durationMinutes`

```ts
// trip.ts, before
export interface Trip {
  /** Minutes from unlock to dock. */
  readonly dt: number;
  readonly st: string;
  readonly en: string;
}
export function newTrip(dt: number, st: string, en: string): Trip {
  return { dt, st, en };
}

// trip.ts, after
export interface Trip {
  /** Minutes from unlock to dock confirmation. */
  readonly durationMinutes: number;
  readonly st: string;
  readonly en: string;
}
export function newTrip(durationMinutes: number, st: string, en: string): Trip {
  return { durationMinutes, st, en };
}
```

`fare.ts` changes on the same commit — `trip.dt * centsPerMinute` becomes
`trip.durationMinutes * centsPerMinute` — and `trip-log.ts`'s `dt: trip.dt` becomes
`dt: trip.durationMinutes`. Nothing in `trip-log.ts`'s own `TripLogRow` interface changes;
only the right-hand side of the field it builds does.

**On the name.** `durationMinutes`, not `duration` and not `minutes`. This is
[`NAMING.md`](../../../../../../docs/NAMING.md)'s conventions table applied directly: "a
unit-bearing number: name carries the unit," the same reasoning that gives the repository
`paceSecondsPerKm` rather than `pace`.
`duration` alone fails question 4 — is it true? — the moment someone reads it expecting
milliseconds, which is a completely reasonable expectation for a field with no unit in its
name. `minutes` alone fails question 2: on a record about docking stations and trips,
`minutes` could plausibly be a countdown, a grace period, anything measured in minutes.
`durationMinutes` survives both.

## Step 2 — `st` becomes `startStationId`

```ts
// route-summary.ts, before
const from = stationNames.get(trip.st) ?? trip.st;

// route-summary.ts, after
const from = stationNames.get(trip.startStationId) ?? trip.startStationId;
```

**On the name.** I rejected `origin` and `from` early, for the same reason: question 4.
`stationNames.get(trip.startStationId)` returns a station *name* — `from` genuinely is a
station name by the time it's used three lines later, and having both a field called `from`
and a local called `from` holding different things (an id, then a name) in the same function
would be exactly the kind of lie *Mysterious Name*'s cousin — a name that's true at one
point in the function and false at another — warns about. `startStationId` says what it
holds regardless of where you read it: an id, never the name. I also rejected the shorter
`startId` — question 2, could it be the name of something else? On a bike-share domain with
trips, riders, and fares, `startId` doesn't say an id *of what*; a trip id and a rider id
are both equally plausible completions. `startStationId` is not shorter, but it stops being
ambiguous.

## Step 3 — `en` becomes `endStationId`

```ts
// trip.ts, after both steps
export interface Trip {
  readonly durationMinutes: number;
  readonly startStationId: string;
  readonly endStationId: string;
}
```

Mechanically identical to step 2, so the interesting decision here isn't the name itself —
it's naming it to *match* step 2's shape rather than reaching for a different pattern.

**On the name.** I considered `destinationStationId` on its own merits — arguably more
precise than `endStationId`, since "end" could momentarily be misread as "ends" in the
temporal sense (when the trip ends) rather than the spatial one (where it ends). I rejected
it on question 2, applied to the *pair* rather than either field alone: `startStationId` and
`destinationStationId` no longer look like they belong to the same concept when read side by
side, and a reader scanning `Trip`'s three fields benefits more from `start`/`end` reading as
one obvious pair than from either name being independently more precise. Consistency between
two related names is itself something question 2 is asking about — "could this be the name
of something else" is easiest to answer wrong when the field next to it uses a different
vocabulary for the same kind of thing.

## The boundary that doesn't move

`TripLogRow` is unchanged in every one of the three commits above — deliberately, and it is
worth stating the general rule this exercise is built to teach rather than leaving it
implicit in the diff:

**A one-step rename is fine when the field is your own code, read from one module (or a
handful, all in the same compiler-checked package), and nothing outside your build can see
the name.** All three internal readers here — `Trip` itself, `fare.ts`, `route-summary.ts`
— clear that bar, and `tsc --noEmit` is the proof: run it after any of the three commits
above with a call site left un-renamed, and it fails on that exact line before you'd ever
get as far as running a test.

**It is not fine when the field is published data — serialised to a file, a wire format, an
API response another team's system parses by field name — because nothing in your build can
see whether you broke it.** `TripLogRow` is that case in miniature: nothing in this
repository reads it, so a rename that touched it would compile cleanly, pass every test in
this exercise, and still corrupt every row the external batch job reads from tomorrow's
export. The compiler's silence there is not permission. It's exactly the blind spot
`drill-07-01`'s Encapsulate Record move exists to protect you from when the reader isn't
even in the same codebase to be found by a search.

I did not need to apply `drill-07-01`'s full mechanic here, and it's worth being honest
about why: `tripLogRow` was *already* a translation function, not a pass-through, before
this refactoring touched it. The seam Encapsulate Record would have had to build already
existed. If `trip-log.ts` had instead done `JSON.stringify(trip)` directly — publishing
whatever `Trip`'s own field names happened to be, with no seam in between — this rename
would not be safe to do first. You would need to build that seam, exactly as `drill-07-01`
describes, before a single field of `Trip` could move.

## What it cost

The honest part. Two things:

- **One field now has two names, forever, and someone has to remember why.** `durationMinutes`
  inside the codebase, `dt` on the wire. `tripLogRow`'s doc comment says which is which, but
  a comment is not the compiler — nothing stops a future field from being added to `Trip`
  and forgotten in `tripLogRow`'s mapping, silently dropping it from every published row.
  That risk existed before this refactoring too, just under a name that made the connection
  between `Trip.dt` and `TripLogRow.dt` look closer than it should have.
- **`newTrip`'s three positional parameters read fine today and won't forever.** Three
  primitives in a fixed order is already brushing up against *Data Clumps*, and it is only
  the strict profile's three-parameter cap that stopped me from reaching for a fourth field
  (a rider id, say) without a second thought about `Introduce Parameter Object`. I don't
  think that's a problem this drill needs to solve — it has one smell to fix — but I'd flag
  it to a reviewer as the seam most likely to need attention next.

## If you took a different route

- **One commit renaming all three fields, instead of three.** Just as safe — the compiler
  doesn't care how many fields move in a commit — and defensible for a record this small. I
  split them mainly so each commit stays independently checkable against the test suite; for
  a three-field record the difference is a matter of taste, not safety.
- **Versioning the published row instead of leaving its keys alone** — adding a `dt_v2` key
  alongside `dt`, migrating the external consumer, then dropping `dt` later. A real option
  if `dt`/`st`/`en` were themselves considered bad enough to be worth an external migration.
  I didn't take it because nothing about this exercise's premise says the *warehouse's*
  names are wrong — only `Trip`'s internal names were. Fowler's own point about encapsulated
  records applies here too: the internal and external names never had to match in the first
  place, so there's nothing to fix on the external side.

What is *not* a matter of taste: renaming `TripLogRow`'s keys because they happen to match
`Trip`'s old ones, or trusting a green test suite as proof that an external consumer is
still fine. Neither the tests nor the compiler can see past this repository's boundary —
that's the one thing in this drill that isn't a judgement call.

## Where TypeScript makes this different from the book

Fowler's *Rename Field* mechanic, written for a codebase with no static types, leans hard on
running the full test suite after the rename and trusting it — the tests are the only
mechanical check that every reader was found. Here, `tsc --noEmit` finds every internal
call site of a renamed field before a single test runs, the same way it did in
`drill-08-01`'s move: `trip.dt` after `Trip.dt` is renamed isn't a runtime failure the suite
might or might not exercise, it's a compile error naming the exact file and line.

That is real help, and it's also exactly why `TripLogRow` is dangerous in a way the book's
JavaScript wouldn't make any more or less visible: TypeScript's guarantee is a property of
the *type graph* inside this package, and `TripLogRow` is a separate, independently-typed
interface that merely happens to shadow `Trip`'s old shape. The compiler has no reason to
connect the two — nothing declares that `TripLogRow.dt` came from `Trip.dt`, so nothing
complains when the connection between them changes. A team relying on "the compiler would
have caught it" as their entire safety net is exposed exactly at the one seam where this
drill is built to show that trust runs out: the moment a value crosses out of a `.ts` file
the compiler can see, and into a format someone else's system parses by name.
