# Walkthrough — fare corrected by replacement, not mutation

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and why this
drill's own test suite cannot show you the bug it fixes. Read it after you have your own
version, not before.

---

## Before anything: what does "the same fare" mean?

`Fare` shows up in two places in `src/`: `bookTrip`, which allocates one fresh `Fare` per
trip, and `bookRoundTrip`, which allocates **one** `Fare` and hands the same object to both
the outbound and inbound leg - they cost the same, so why build two.

That sharing is not the bug. Two trips genuinely can cost the same amount, and there is
nothing wrong with representing "the same amount" as one object instead of two, *as long as
nothing can tell the difference by mutating it*. The bug is `Fare.adjustBy`, which mutates
`this.cents` in place, combined with `adjustTripFare`, which calls it on whichever `Fare`
object a trip happens to be holding - without knowing, or caring, whether anything else is
holding the same one.

Read `bookRoundTrip` and `adjustTripFare` side by side before you touch either:

```ts
// bookRoundTrip - one Fare, two legs
const fare = new Fare(input.cents);
return {
  outbound: leg({ id: outboundId, fromStationId: out, toStationId: ret, fare }),
  inbound: leg({ id: inboundId, fromStationId: ret, toStationId: out, fare }),
};

// adjustTripFare - mutates whatever Fare it's handed
export function adjustTripFare(trip: Trip, deltaCents: number): void {
  trip.fare.adjustBy(deltaCents);
}
```

Call `adjustTripFare(outbound, 100)` on a round trip booked this way, and `inbound.fare`
changes too - not because anything touched `inbound`, but because `outbound.fare` and
`inbound.fare` were never two things. That is **Mutable Data** in its purest form: a value
that looks owned by one variable is actually shared, and a change through either name is
visible through both.

## Why this order: fix the mutator before touching the sharing

It would be tempting to "fix" `bookRoundTrip` first - give each leg its own `Fare`
allocation, and the immediate danger looks gone. Resist that. It treats the symptom at one
call site and leaves the actual defect - a mutable `Fare` with an in-place `adjustBy` -
free to bite the next place two trips end up holding the same instance, whether through a
cache, a shared "current promo fare" constant, or a group booking feature nobody has
written yet. `bookRoundTrip` is not the only plausible place this pattern shows up; it's
just the one already in this file.

So the order goes: make `Fare` incapable of being mutated first (steps 1-4, all inside
`fare.ts` and `adjustTripFare`), and only then ask whether the sharing in `bookRoundTrip`
is still a problem. Spoiler: it isn't, and that's the point - see "What this refactoring
actually buys you" below.

## Step 1 - `adjustedBy`, added beside `adjustBy`

```ts
adjustedBy(deltaCents: number): Fare {
  return new Fare(this.cents + deltaCents);
}
```

A pure sibling to the existing mutator, added without touching a single caller. This is the
same parallel-change shape `drill-06-06` uses for `Encapsulate Variable`: add the safe path
first, migrate callers onto it, delete the unsafe path last. Nothing calls `adjustedBy` yet,
so this step cannot change behaviour - it's a pure addition, and the suite staying green
proves nothing except that the file still compiles.

**On the name.** `adjustedBy`, not `adjusted` or `plus`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md) - does it say *what*, or *how*? -
`adjustedBy(deltaCents)` reads as "this Fare, adjusted by this many cents," which survives
however the arithmetic inside is eventually written. I considered `withCents(newCents)`,
taking the absolute amount instead of a delta, and rejected it: every caller in this domain
corrects a fare by an *amount* (a fee, a credit, a dispute adjustment), never by stating the
new total outright, so a delta-taking name matches how the type is actually used. `plus`
was the other candidate, and question 3 killed it - `trip.fare.plus(deltaCents)` at the call
site reads like arithmetic on a number, not like correcting a priced object, and hides that
a negative argument is a legitimate credit rather than an edge case.

## Step 2 - the pivot, and the step no test can see

```diff
 export function adjustTripFare(trip: Trip, deltaCents: number): void {
-  trip.fare.adjustBy(deltaCents);
+  trip.fare = trip.fare.adjustedBy(deltaCents);
 }
```

One line. This is the entire refactoring, mechanically - everything before it was setup,
everything after it is cleanup. Before this line, correcting a trip's fare mutates whatever
object `trip.fare` currently points at. After it, correcting a trip's fare replaces the
trip's *own* pointer with a freshly-built `Fare`; whatever `trip.fare` used to point at is
never touched, so anything else still pointing at it - `inbound`, if `trip` was `outbound`
from a round trip - is unaffected.

You will not see this step change a single assertion in `tests/fare.spec.ts`. That is
deliberate, not a gap - read the comment at the top of the spec file, and see "Why the
shipped suite cannot see the fix," below, before assuming the test file is missing
something.

**On the name.** `adjustTripFare` itself does not change name here, and that omission is a
decision. Question 4 - is it true? - is what licenses leaving it alone: the function always
meant "correct this trip's fare by this many cents," and that was true whether the
correction happened by mutation or by replacement. The name was never about the mechanism;
it survives the mechanism changing underneath it, the same way `drill-09-03`'s
`totalFareCents` survives switching from a cached field to a live sum.

## Step 3 - deleting `adjustBy`

```diff
-  /** Adjusts this Fare's amount in place. */
-  adjustBy(deltaCents: number): void {
-    this.cents = this.cents + deltaCents;
-  }
-
   equals(other: Fare): boolean {
```

Nothing calls `adjustBy` after step 2. Deleting it is pure removal of dead code - it cannot
change what any test observes, which is exactly why it's safe to do in its own commit
instead of folding it into step 2's diff.

**On the name.** Not a rename, but worth noting why `adjustBy` earns deletion rather than a
rename to something like `deprecatedAdjustBy`: nothing in this codebase calls it, and
nothing outside `fare.ts` could have, since `Fare` was never exported with a matching
mutator elsewhere. A method with zero callers is not a naming problem - `Lazy Element`,
maybe, if it survived - and no name improves that. Delete it.

## Step 4 - `cents` becomes `readonly`

```diff
 export class Fare {
-  cents: number;
+  readonly cents: number;
```

The last step, and the one that turns "nothing currently mutates `cents`" into "nothing
*can*." Every prior step made this true in practice; this step is the compiler agreeing to
enforce it. `noUnusedLocals` and friends in `tsconfig.base.json` are pedantic about
correctness, but only `readonly` actually forbids a future `fare.cents = x` from
compiling - a comment saying "don't mutate this" is a request; `readonly` is a wall.

**On the name.** No name to earn here, but it's the clearest place in this drill to say
where TypeScript changes the exercise from the book. Fowler's own worked example for
*Change Reference to Value* is JavaScript, where "this field is never reassigned after
construction" is a fact about the code's behaviour that you verify by reading every call
site by hand - there is no `readonly` keyword to lean on. Here, step 4 converts that
behavioural fact into a structural one: after this commit, `tsc --noEmit` fails the build
if anyone, anywhere in this module, ever writes `someFare.cents = x` again. The type system
doesn't know the assignment would be *wrong* in a domain sense - it only knows the field was
declared immutable - but that's a stronger guarantee than the book's version gets for free,
and it's why step 4 comes last: it locks in a promise the earlier steps already kept.

## Why the shipped suite cannot see the fix

You might expect a test like:

```ts
const { outbound, inbound } = bookRoundTrip("T1", "T2", { ...same fare... });
adjustTripFare(outbound, 100);
expect(inbound.fare.cents).toBe(/* unchanged */);
```

`tests/fare.spec.ts` deliberately does not have one, and the comment at the top of that
file says so. Understand why before assuming it's an oversight.

The same spec file runs against `src/` (`npx vitest run --project drill-09-04`) and against
this solution (`SOLUTIONS=1 npx vitest run`). Against `src/`, that test's true answer is
"changed" - `inbound.fare` is the same object `outbound.fare` was, and `adjustBy` mutated
it. Against this solution, the true answer is "unchanged" - `adjustTripFare` replaced
`outbound`'s own pointer and never touched the object `inbound.fare` still refers to. No
single expected value satisfies both, so no such test can live in a suite that has to grade
both variants identically. `drill-09-03`'s walkthrough makes the identical argument for a
different bug shape; this is the second time this module hits the same wall, which is a
sign that it's a real property of this category of refactoring, not a coincidence.

What the suite tests instead - and what actually earns its keep - is the *safe* half of the
same story: two trips booked **separately**, at the same fare amount, stay independent once
one is corrected (see the "never changes a separately booked trip's fare" test). That
passes identically against `src/` and this solution, because `bookTrip` never shares a
`Fare` instance between unrelated trips in either version. It's a real regression guard - it
would catch a future "let's cache `Fare` objects by amount" optimization reintroducing
aliasing where none exists today - but it is not, and cannot be, a test that the
`bookRoundTrip` aliasing bug itself is fixed. That fix is real, and it's visible by reading
`adjustTripFare`'s one-line diff at step 2; it is simply not the kind of thing an automated
suite shared between the buggy and fixed versions can assert.

## What this refactoring actually buys you

Here's the payoff promised above: **`bookRoundTrip` needed zero changes.** It still builds
one `Fare` and hands it to both legs, identically in `src/` and in this solution. Before the
refactor, that line was a landmine. After it, the exact same line is completely safe,
because nothing can mutate a `Fare` once it exists - sharing one is now precisely as
harmless as generating two equal ones would have been, and cheaper.

This is worth sitting with, because it cuts against the instinct to "fix" the sharing
directly. The sharing was never the mistake. `Fare` objects being *mutable while shared* was
the mistake, and once that's gone, the sharing goes back to being a reasonable, minor
allocation-saving decision instead of a hazard. If your first instinct on reading
`bookRoundTrip` was "give each leg its own `Fare`," that instinct was solving the wrong
half of the problem - a real fix, just not this one, and not the cheapest one.

## What it cost

Every correction now allocates a new `Fare` object instead of editing one. For a bike-share
system correcting a handful of fares a day, that allocation is free. I would not make the
same call for a hot path correcting thousands of fares a second without measuring first -
the honest version of `drill-07-04`'s and `drill-09-03`'s caching arguments applies here in
reverse: recomputation-by-replacement has a real cost, just one small enough here to not be
worth a walkthrough section defending it further.

The thing I'm genuinely unsure about: `Fare.equals` existed, unchanged, in both `src/` and
this solution the whole time - it was never part of the route. I kept it because a value
type without a way to compare two instances by content is only half a value type, and the
tests use it to make the "interchangeable" half of this drill's lesson explicit. But adding
`equals` *is* part of Fowler's own recipe for this refactoring, and folding it into the
route (rather than treating it as already present) would have been equally defensible - I
chose not to, because a `.equals()` that only ever compared numbers didn't feel like it
needed its own step to justify. A reviewer could reasonably want it broken out.

## If you took a different route

- **Fixing `bookRoundTrip` to allocate two `Fare` objects instead of fixing `Fare` itself.**
  This does make the specific bug in this file go away, and for a one-off patch under time
  pressure it's a defensible triage move. It is not this drill's answer, because it leaves
  `adjustBy` in place - mutable, in-place, callable on any `Fare` from anywhere - ready to
  bite the next place two trips (or two anything) end up sharing one.
- **`Object.freeze(fare)` instead of a `readonly` field and a rewritten mutator.** Legitimate
  in plain JavaScript, and it's roughly what the book reaches for since it has no
  `readonly` keyword to lean on. In TypeScript, `Object.freeze` is a runtime guard the
  compiler mostly can't see through for narrowing purposes, whereas `readonly` is a
  compile-time promise checked on every assignment, including ones inside this file. I
  chose the stronger, statically-checked version because it was available for free; a
  codebase that needed genuine runtime immutability (values crossing a serialization
  boundary, say) might want both.
- **Giving `Fare` a private constructor and a `Fare.of(cents)` factory**, closer to how some
  value-object guides recommend gating construction. Not necessary here - `new Fare(cents)`
  never does anything `Fare.of` would improve on, since there's no validation or caching to
  centralize - but it's the kind of addition that earns its place the moment `Fare` grows a
  constraint (say, `cents` must be non-negative).

What is *not* a matter of taste: leaving `Fare.cents` mutable after `adjustBy` is deleted.
A field with no method left that's supposed to change it, but no `readonly` saying so
either, is worse than either extreme - it looks safe to reassign and isn't, right up until
someone tries.

## See also

[`drill-09-05`](../../../05-change-value-to-reference/README.en.md) runs this drill's logic
in reverse: a `Rider` copied into every trip, where the fix is to give the data an identity
and *share* it, not strip the sharing away. Reading both back to back is the point of the
pair - the question is never "reference or value, which is better," it's "what does this
particular piece of data actually need to be."
