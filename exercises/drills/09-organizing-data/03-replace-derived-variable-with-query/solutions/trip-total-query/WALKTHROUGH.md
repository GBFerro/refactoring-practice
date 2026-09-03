# Walkthrough — total fare computed on demand

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and what this
refactoring actually buys you that most refactorings in this repository don't. Read it
after you have your own version, not before.

---

## Before anything: which value is derived, and where does it drift?

`RiderAccount.totalFareCentsCache` is a **derived variable**: nothing about it is new
information, it is entirely computable from `account.trips`. The book's definition is
exact here - a field is derived, not stored data in its own right, the moment its value is
fully determined by other fields that already exist.

The trouble is not that it exists, but that keeping it correct is a promise every future
mutation site has to remember, and nothing in the type system says so. This challenge has
exactly two functions that change what a trip is worth:

- `recordTrip` - adds a trip, and (in `src/`) increments `totalFareCentsCache` to match.
- `applyLateReturnFee` - changes an existing trip's `fareCents`, days after the ride, once
  the dock reports how late the bike came back. It does **not** touch
  `totalFareCentsCache`.

One mutation site remembers the cache. One doesn't. That is not a contrived omission - it
is how these bugs happen in real code. `recordTrip` and the cache were probably written
together, by someone who had "keep the total in sync" in mind the whole time.
`applyLateReturnFee` reads as a small, self-contained edit: find a trip, adjust its fare.
Nothing in that description mentions a second piece of state elsewhere on the object, so
nothing prompts the person writing it to go looking for one.

Run this against `src/` yourself before you refactor anything:

```ts
const account = openAccount("R1", "Test Rider");
recordTrip(account, { id: "T1", riderId: "R1", startStationId: "S1", endStationId: "S2", fareCents: 300 });
applyLateReturnFee(account, "T1", 150);

totalFareCents(account);                                    // 300 - reads the stale cache
account.trips.reduce((sum, t) => sum + t.fareCents, 0);      // 450 - the real total
```

Those two numbers disagree, on code that passes every test this exercise ships. That
disagreement is real, and it is the entire reason this drill exists.

## This is not (only) about readability

Every other drill in this repository up to chapter 8 makes code easier to read without
changing what it computes. This one is different, and it's worth being blunt about why.

**Replacing the temp in `drill-07-04` could never have this bug.** A temp lives inside one
function call; nothing outside that call can mutate it mid-execution, so a temp is
*always* internally consistent for as long as it exists. `RiderAccount.totalFareCentsCache`
outlives any single call, staying alive across every future call to `recordTrip` and
`applyLateReturnFee` for as long as the account exists. Every one of those calls is a fresh
chance for the cache and the trips it describes to fall out of step, and the type system
has no concept of "these two fields must always agree" to enforce it. That is what
**Mutable Data** names here: not that a field changes, but that two pieces of state which
must move together are free to move apart, because keeping them together was never anyone's
enforced job.

`Replace Derived Variable with Query` does not patch the one call site that forgot. It
deletes the second piece of state entirely, so there is nothing left to forget. After the
refactor, `totalFareCents` recomputes from `account.trips` on every call - the same trips
`applyLateReturnFee` just mutated - so there is no category of bug left for a third
mutation site, added next year by someone who has never read this file, to reintroduce.
That is the distinction this walkthrough exists to make sharply: most refactorings in this
repository make correct code read better; this one makes a specific kind of incorrectness
*structurally impossible* rather than fixing the one instance that got caught.

## Why the shipped test suite cannot see the fix

You might expect `tests/trip-totals.spec.ts` to include a test like the snippet above -
`recordTrip`, then `applyLateReturnFee`, then assert on `totalFareCents`. It deliberately
does not - understand why before assuming it's an oversight.

The same spec file runs against `src/` and against this solution (`npx vitest run
--project drill-09-03` and `SOLUTIONS=1 npx vitest run` both execute it). A test asserting
`totalFareCents(account)` after a late fee would need one hard-coded expected number.
Against `src/` the true answer is the stale cached value (300, above); against this
solution it's the corrected sum (450). No single expected value passes both, so no such
test can exist in a suite required to grade both variants identically. That is not a gap in
coverage - it is the bug itself, showing up one level higher, in what a shared suite is even
able to pin down. A regression test for a bug nobody has found yet doesn't exist either, for
the same reason: nobody thought to write it, which is exactly how this bug would ship.

## Why this order

Compute correctly first, delete the dead maintenance second - never the reverse. Deleting
`totalFareCentsCache` before `totalFareCents` had anywhere else to read from would not
compile; deleting the increment in `recordTrip` before switching what `totalFareCents`
reads would make every recorded trip after that point silently stop counting. The read-side
swap first, in its own commit, means step 1 is the only step where behaviour can change for
any caller - steps 2 and 3 are then provably inert, pure deletions of code nothing reads.
`drill-08-01`'s walkthrough makes the mirror-image argument for *Move Function* - copy
before you cut, so the risky moment is isolated to one commit instead of smeared across the
whole move. This drill isolates risk the other way: get the query right while the old field
is still there as a harmless spectator, then clean up the spectator once nothing watches it.

## Step 1 — the pivot

```diff
 export function totalFareCents(account: RiderAccount): number {
-  return account.totalFareCentsCache;
+  return account.trips.reduce((sum, trip) => sum + trip.fareCents, 0);
 }
```

This is the whole refactoring, mechanically. `totalFareCentsCache` is still declared and
still incremented by `recordTrip` after this step - both now write to a field nothing
reads. The suite is green, for the best possible reason this time: the query is actually
correct, not merely untested.

**On the name.** `totalFareCents` keeps its exact name across this step, and that is itself
a decision. Question 1 from [`NAMING.md`](../../../../../../docs/NAMING.md) - does it say
*what*, or *how*? - is why: `totalFareCents` was never named after its mechanism (never
`cachedTotalFareCents`), so swapping the mechanism underneath it costs nothing at any call
site. I considered a transitional `liveTotalFareCents`, to flag the change while both
implementations briefly coexist, and rejected it - it would force a follow-up rename once
the old field was gone, turning one refactoring into two. Question 4 - is it true? - is
what licenses keeping the name unchanged: `totalFareCents` always meant "what this rider
has been charged in total." Before this step that was true only when every mutation site
remembered to maintain the cache - a truth resting on external discipline. After this step
it's true by construction, computed straight from the definition of "total." The name
didn't change; what changed is that it stopped being able to lie.

## Step 2 — the dead increment

```diff
 export function recordTrip(account: RiderAccount, trip: Trip): void {
   account.trips.push(trip);
-  account.totalFareCentsCache += trip.fareCents;
 }
```

**On the name.** No name changes here, but `recordTrip`'s name is worth re-examining, since
this step is what makes it fully true. Question 4 again: before this step, `recordTrip`
silently did two things - record a trip, and maintain a second, unrelated piece of account
state - while its name advertised only the first. A smaller version of the same honesty
problem `NAMING.md`'s `validateEntries`-that-also-normalises example warns about. I did not
rename it to `recordTripAndUpdateTotal` at any point, because the fix here isn't a better
name for what the function does - it's removing the half the name never mentioned. A name
earning back its truth by the code shrinking to fit it beats a name stretched to fit the
code.

## Step 3 — removing the field

```diff
 export interface RiderAccount {
   readonly riderId: string;
   readonly displayName: string;
   readonly trips: Trip[];
-  /** Sum of every trip's fareCents, maintained by hand at every site that changes a fare. */
-  totalFareCentsCache: number;
 }
```

and, in `openAccount`, drop `totalFareCentsCache: 0` from the returned literal.

**On the name.** The field being deleted was named `totalFareCentsCache`, and that name was
honest almost to a fault - the `Cache` suffix told the truth about what it was and invited
exactly the wrong kind of trust anyway. Question 4 asks whether a name is true; a name can
be technically accurate and still mislead, if what it promises ("this is a cache, so it's
kept in sync") isn't backed by anything enforcing the promise. I don't think a better name
would have saved this field - the problem was never what it was called, it's that it
existed as a second copy of a fact the trips array already recorded. Some smells are not
fixed by a better name, because the name was never the thing lying. Removing the field, not
renaming it, is what question 4 demands once the promise it makes can't be kept by naming
alone.

## What it cost

The honest part. Fowler's own mechanics suggest a safety step I did not take: before
deleting the field, temporarily assert that the new query and the old cached value agree on
every call, and only remove the field once that assertion runs clean for a while. I skipped
it, for a reason I'm not fully confident in: asserting on `totalFareCentsCache` here, a
value I already knew could be wrong, would prove nothing against fixtures that never call
`applyLateReturnFee` and then check the total. A real codebase, with real traffic hitting
both paths, is exactly where that temporary assertion would have caught this bug months
before a reader found it by inspection. Skipping it is defensible for a drill with a fixed,
known input space; I would not skip it on the migration this drill is modeled after, and
I'm not fully sure a reader should skip it either just because I did.

## If you took a different route

- **Keep `totalFareCentsCache`, but fix the bug by also updating it inside
  `applyLateReturnFee`.** The tempting shortcut, and explicitly not what this drill
  teaches. It fixes the one instance found. It does nothing for the next mutation site
  someone adds - a bulk fare adjustment, a refund flow - which would have to remember the
  same discipline all over again. The point is removing the category, not the instance.
- **Turn `RiderAccount` into a class with `totalFareCents()` as a method**, closer to how
  the book's own examples are shaped. I kept plain interfaces plus functions because every
  module through chapter 8 does, and a class here would mix this refactoring with
  `Combine Functions into Class` - a second move riding on the first.
- **Memoize the query**, invalidating from inside both mutators, instead of deleting the
  field. See the caching section below for when I'd actually reach for this.

What is *not* a matter of taste: leaving `totalFareCentsCache` half-removed - deleted from
one function's writes but still declared on the type, or vice versa. Steps 2 and 3 land
together or not at all; a field with no maintained value but still declared as if it has
one is worse than either state alone - it looks load-bearing right up until someone reads
it.

## When a cache is actually the right answer

`drill-07-04` makes this trade in the same direction - recomputation over storage - and
reaches the same conclusion: fine here, not free in general. The two agree on the general
shape of the trade-off; they differ in what kind of failure each protects against. A temp
lives and dies within one call, so it can never disagree with its source - the only risk
there is *speed*. A field like `totalFareCentsCache`, surviving across many calls and
mutation sites, carries a second risk that drill never has to think about: *correctness*,
the stored value silently drifting from the truth. Caching a derived field is a bigger
commitment than caching a local computation - it promises to stay correct for the object's
whole lifetime, across every path that touches it, not just one function call.

A cache isn't never right here, only the bar is higher than "this got computed more than
once." Before caching `totalFareCents` I'd want a **measured cost** - a profile showing
`reduce` over `account.trips` taking real, repeated time, for trip counts large enough
(years of daily commuting, not a handful of rides) that an `O(n)` scan shows up next to
everything else the request does - and a **read-heavy access pattern**, the total checked
far more often than trips are recorded or fares adjusted, so maintaining a cache on every
write beats recomputing on every read. A billing job reading the total once a month, the
way `drill-07-04`'s `overdueNotice` runs once per loan, would never clear that bar.

If both held, the shape of the cache matters as much as adding one. The bug in `src/`
happened because *every caller of the source data* was individually responsible for
keeping the cache in sync - `recordTrip` remembered, `applyLateReturnFee` didn't, and
nothing forced agreement between the two. A cache repeating that shape would reintroduce
the exact bug this refactoring removes, just with fewer call sites to audit. The safe
version puts invalidation in exactly one place: behind the same boundary that owns every
write to the underlying data, never scattered across each caller's own discipline.
Concretely, `recordTrip` and `applyLateReturnFee` would need to be the *only* two ways to
change an account's trips - already true here - with invalidation folded into both, in the
same file, reviewed together, instead of trusted to whoever writes the next mutation.
`drill-07-02`'s *Encapsulate Collection* is what makes that guarantee possible at all: you
cannot promise a cache stays honest if the data it derives from is a public array anyone
can push to directly. "Invalidation owned by the writer, not by every caller" means
ownership of the write path - not a comment asking nicely.

## Where TypeScript makes this different from the book

Fowler's own example checks a derived variable's correctness by temporarily asserting the
old and new values agree - a runtime check, because JavaScript's plain objects give the
compiler nothing to check statically. Removing `totalFareCentsCache` from `RiderAccount`
here gets a stronger guarantee for free: once the field is gone from the interface, any
code that still tries to read or write `account.totalFareCentsCache` is a compile error,
not a runtime surprise waiting for the right input. `tsc --noEmit` caught exactly this in
an earlier draft, when I deleted the field before finishing step 2 - a leftover `+=` line
still referenced it, and the compiler stopped me before the test suite even ran.

That guarantee has a real edge, worth naming rather than overselling: the compiler verifies
the field is *gone*, not that removing it was *correct*. Structural typing checks that every
reference to `RiderAccount` still matches its declared shape; it has no way to know that one
shape used to return a stale number and the other doesn't, since both
`totalFareCents(account): number` signatures type-check identically. The compiler will
happily tell you the refactoring is *complete*. It will never tell you it was *worth
doing* - that the number now returned actually changed, for the better, for every account
that ever called `applyLateReturnFee`. That judgement is the one this walkthrough exists to
make instead.
