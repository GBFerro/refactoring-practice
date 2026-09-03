# Walkthrough — one rider record, trips that point at it

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why the move, why now, what the name had to earn, and why this drill's own test
suite cannot show you the bug it fixes. Read it after you have your own version, not before.

---

## Before anything: what is a rider, actually?

`Rider` has an `id`. That single fact settles the whole drill before you write a line of
code. An `id` is a promise that this record refers to one specific person, the same person
every time you look it up - which is a very different promise from `Fare` in
[`drill-09-04`](../../../04-change-reference-to-value/README.en.md), where two `Fare`
objects with the same `cents` are simply, unremarkably, the same fare. Nobody asks "is this
the *same* $2.50, or a different $2.50 that happens to match?" Everybody asks "is this
Priya Shah's phone number, or someone else's?" - and the answer has to stay correct no
matter how many trips Priya has taken.

`src/` gets the identity right and the ownership wrong. `bookTrip` looks up the correct
`Rider` from the directory and hands it to `toTrip`, which calls `snapshotRider` to copy
its four fields into a brand new object before attaching it to the trip. The lookup is
fine. The copy is the smell: the moment that copy exists, it is a second, independent
answer to "what is Priya's phone number," with no mechanism keeping it in step with the
first.

```ts
function snapshotRider(rider: Rider): Rider {
  return { id: rider.id, name: rider.name, phone: rider.phone, email: rider.email };
}
```

This is **Shotgun Surgery**, and it's worth being precise about which half of the smell
lives where. The book's usual picture is a single conceptual change scattered across many
*functions*. Here it's scattered across many *records*: correcting one rider's phone number
conceptually means "fix it everywhere Priya's number appears," and after `bookTrip` this
means every trip she has ever taken holds its own copy, each one a separate site that would
need to be found and edited by hand if anything in this codebase tried to keep them in
sync - which, notably, nothing here does. `correctRiderPhone` fixes the directory's own
record and stops there, which is exactly the amount of fixing the smell describes: the one
copy that's reachable gets corrected, and the rest are wrong until someone remembers them.

## Why this order: there is only one order

Most drills in this repository have a "why leaves first" or "why the read-side before the
write-side" section, because the refactoring decomposes into several genuinely orderable
moves. This one doesn't, and saying so plainly is more honest than inventing structure
that isn't there. `toTrip` has exactly one place that creates the problem -
`rider: snapshotRider(rider)` - and exactly one place is where the fix goes. Step 1 *is*
the refactoring. Step 2 is bookkeeping.

The thing worth deciding, and the reason `snapshotRider` exists as its own named function
in `src/` rather than an inline object literal, is what the *shape* of the smelly code
looks like before you fix it. A real codebase rarely writes `{ id: rider.id, name:
rider.name, phone: rider.phone, email: rider.email }` inline at a call site - it extracts a
`snapshotRider` or `toRiderSnapshot` helper, because copying four named fields by hand
reads like something that deserves a name. That the helper has a name is what makes this
drill's un-refactor read like *real* code instead of a contrived one-liner: someone
genuinely thought about this copy, named it, and still got the ownership wrong.

## Step 1 - the pivot, and the step no test can see

```diff
   return {
     id: tripId,
-    rider: snapshotRider(rider),
+    rider,
     fromStationId: input.fromStationId,
     toStationId: input.toStationId,
   };
```

One field. Before this line, `trip.rider` is a *copy* - a `Rider`-shaped object that
happens to match the directory's record at the moment of booking and never again touches
it. After this line, `trip.rider` **is** the directory's record: the exact same object
`findRider` returned, the exact same object `correctRiderPhone` will later reach into and
mutate.

You will not see this step change a single assertion in `tests/rider-trips.spec.ts`. That
is deliberate - read "Why the shipped suite cannot see the fix," below, before assuming the
spec file is missing something.

**On the name.** `rider`, not `riderRef` or `sharedRider`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md) - does it say *what*, or does it say *how*?
- is exactly why no adjective survives here. `Trip.rider` was always supposed to mean "the
rider on this trip"; a name like `riderRef` would document the *mechanism* (a reference,
not a copy) inside a field whose meaning to every caller is unchanged. Nobody reading
`trip.rider.phone` needs to know or care whether `rider` is a shared object or a private
copy - and that a caller cannot tell the difference by reading the name is the entire point
of this refactoring. The field's type was `Rider` before this step and stays `Rider` after
it; only what gets assigned to it changes.

## Step 2 - deleting `snapshotRider`

```diff
-/** A trip's own copy of the rider's details, taken at booking time. */
-function snapshotRider(rider: Rider): Rider {
-  return { id: rider.id, name: rider.name, phone: rider.phone, email: rider.email };
-}
-
 function requireRider(directory: RiderDirectory, riderId: string): Rider {
```

Nothing calls `snapshotRider` after step 1. Deleting it changes nothing a test can observe -
which is exactly why it belongs in its own commit, separate from step 1's actual behaviour
change, the same discipline `drill-09-03`'s walkthrough argues for with its own dead
increment.

**On the name.** No rename here either, but it's worth asking why `snapshotRider` earns
deletion rather than being kept around for some future caller that might want an
intentional copy. The answer is that nothing in this domain has ever asked for one. A
"give me a frozen point-in-time copy of this rider, on purpose, for an audit log" feature
would be a legitimate reason to keep a snapshot helper - but that is a different, deliberate
decision with its own name and its own tests, not a side effect a trip's booking path
should default to. `Lazy Element` almost applies to a zero-caller function like this one,
except the more precise diagnosis is that it never should have been load-bearing in the
first place. Delete it; reintroduce it explicitly if a real need shows up.

## Why the shipped suite cannot see the fix

You might expect a test like:

```ts
const directory = openDirectory();
registerRider(directory, { id: "RIDER-1", name: "Priya Shah", phone: "555-0100", email: "..." });
const trip = bookTrip(directory, "TRIP-1", { riderId: "RIDER-1", ... });

correctRiderPhone(directory, "RIDER-1", "555-0199");

expect(trip.rider.phone).toBe("555-0199"); // does the *existing* trip see it?
```

`tests/rider-trips.spec.ts` deliberately has no such test, and its top comment says so.
Understand why before assuming it's an oversight.

The same spec file runs against `src/` (`npx vitest run --project drill-09-05`) and against
this solution (`SOLUTIONS=1 npx vitest run`). Against `src/`, `trip.rider` is a snapshot
taken at booking time - `correctRiderPhone` reaches into the directory's own record and
never touches it, so the true answer is "555-0100," unchanged. Against this solution,
`trip.rider` **is** the directory's record, so the true answer is "555-0199." No single
expected value satisfies both, so no such test can live in a suite required to grade both
variants identically. `drill-09-03` and `drill-09-04` hit the identical wall for their own
bugs; three drills in one module landing on the same constraint is not a coincidence - it's
what "this refactoring fixes a real, previously-untested bug" looks like from the outside,
every time.

What the suite tests instead - and what actually earns its keep - is everything *around*
that gap: booking pulls the rider's *current* details (works in both, since both read the
directory fresh at booking time); a correction is visible on a trip booked *afterwards*
(also works in both, for the same reason); a correction never leaks to a *different*
rider's trip (works in both, since different `id`s never alias regardless of version). Each
of those is a real regression guard. None of them, individually or together, can prove that
an *already-booked* trip sees a later correction - that specific claim is the one thing
`src/` gets wrong, and it is exactly the one claim a shared suite cannot pin to one number.

## What it cost

Every `Trip` now depends on the `RiderDirectory` that issued its rider. Before this
refactor, a `Trip` was a fully self-contained record - four fields, no outside references,
trivially serializable, constructible in a test with a plain object literal. After it, a
trip's `rider` field is only as trustworthy as the directory that's still holding onto that
`Rider` object; if that directory ever went away - garbage collected, or simply never
passed to whatever code inspects the trip later - the trip would still have *a* `Rider`
object, but nothing could correct it anymore, silently. This drill's tests never exercise
that scenario, because Riverline in this exercise never discards a directory, but it's the
honest edge this refactoring introduces and I want it named rather than glossed over.

The decision I'm least sure about: `RiderDirectory` stores riders in a plain `Map`, and
`registerRider` called twice with the same `id` silently replaces the old `Rider` object
with a brand new one - any trip still holding the old object would stop seeing corrections
made through the new one. I treated `registerRider` as "create," used once per rider, and
`correctRiderPhone` as the only path for updates, which is what every test in this suite
assumes. Nothing in the type signature enforces that discipline, and a caller who
re-registers an existing rider by mistake would reintroduce this drill's exact bug through
a side door. A stricter version would make `registerRider` throw on a duplicate `id`, or
split it into separate `register` and `reregister` operations - I left it permissive because
nothing in this domain currently needs re-registration, and I'd rather a reviewer ask "should
this throw?" than have me guess at a policy the exercise doesn't test either way.

## If you took a different route

- **A `RiderId` newtype instead of holding the `Rider` object directly on `Trip`.** Store
  `riderId: string` on `Trip` and call `findRider(directory, trip.riderId)` wherever the
  rider's current details are needed, instead of `trip.rider`. This is arguably *more*
  correct - it makes "go ask the directory" explicit at every call site instead of implicit
  in what `trip.rider` happens to alias - and it's a real, defensible variant. I didn't take
  it because it changes the shape of `Trip` itself (no more `rider` field, no more direct
  `trip.rider.phone`), which reads as a second decision riding on top of *Change Value to
  Reference* rather than the refactoring itself; the book's own recipe centers on making
  the reference shared, not on relocating where callers reach for it.
- **Giving `Rider` an `updatePhone` method instead of `correctRiderPhone` reaching in and
  assigning the field directly.** Legitimate, and closer to how `drill-07-01`'s
  `Encapsulate Record` would shape this if the two drills were combined. I kept `Rider` as
  a plain, directly-mutable interface because encapsulating it is a different refactoring
  with its own justification, and folding it in here would blur which move this suite is
  actually guarding.
- **Storing riders in an array instead of a `Map`.** Works, and for a handful of test
  riders you'd never notice. A `Map` keyed by `id` is the more honest choice the moment you
  admit that "look up a rider by id" is the directory's entire reason to exist.

What is *not* a matter of taste: anything in the booking path constructing a `Rider`-shaped
object of its own instead of using the one `findRider` returned. Any code path that builds
a new object with the same fields, no matter how faithfully it copies them, has silently
reintroduced this drill's bug - the type checker cannot catch it, because
`{ id, name, phone, email }` and the directory's own `Rider` object satisfy the exact same
interface.

## Where TypeScript changes this from the book

Fowler's own example for this refactoring - duplicated customer data across orders - is
JavaScript, where "does this order hold the same customer object as that one" is a fact you
can only check at runtime, with `===`, and only if you think to ask. Structurally, nothing
here changes with TypeScript: `Rider` and a hand-copied `{ id, name, phone, email }` object
type-check identically, because the compiler reasons about shape, not provenance. `tsc
--noEmit` on this exercise passes against both `src/` and the solution, for the same
reason the shared test suite can't distinguish them - from the type system's point of view,
step 1's entire diff is invisible. The guarantee TypeScript actually gives you here is
narrower and still real: `Rider`'s fields are typed (`phone: string`, not `phone: any`), so
a copy that dropped or mistyped a field would fail to compile. It has nothing to say about
whether the copy should have existed at all. That judgement - identity versus value, one
owner versus many - is a modeling decision no type system makes for you, in TypeScript or
in Fowler's JavaScript alike, which is the reason this pair of drills exists.

## See also

[`drill-09-04`](../../../04-change-reference-to-value/README.en.md) runs this drill's logic
in reverse: a `Fare` that needs to be safe to copy freely, where the fix is to strip away
the ability to mutate it rather than give it a single shared owner. Neither direction is
the default - `Fare` and `Rider` sit on opposite sides of the same question, which this
pair asks twice on purpose: does this data have an identity that must stay correct
everywhere it's seen, or is it a value where any two equal copies are already
interchangeable?
