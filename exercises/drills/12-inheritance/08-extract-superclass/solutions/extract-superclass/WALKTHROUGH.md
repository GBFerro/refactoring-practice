# Walkthrough — one Bookable superclass, one method left alone

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, which method never moves and why, and what I
am still not fully sure about. Read it after you have your own version, not before.

---

## Before the move: is this an is-a or a has-a?

Two classes sharing behaviour have two honest answers, not one, and the book's own
preference runs against reaching for inheritance first. Fowler's advice is to look for a
class you can *delegate* to before you look for a class to *extend from* — a superclass is
the right call only once the duplication is real and the abstraction it implies is true, not
merely convenient.

So before touching either class, ask the actual test: does `InstrumentRental` **have** a
billing rate, or **is** it a kind of thing that gets booked out for a period at a rate?

If the answer were "has", the fix would be [`drill-07-05`](../../../../07-encapsulation/05-extract-class/README.en.md)'s move: pull the three shared fields
and the cost formula into a small `BillingRate` value object, and give each class a
`#rate: BillingRate` field it delegates to. That shape earns its keep when the shared part
could plausibly belong to something that is *not* a bookable item at all — a
`LatePenaltyPolicy` that also needs rate math. Composition is the right tool exactly when the
shared part has a life of its own outside the classes currently borrowing it.

That is not what is happening here. Every consumer of a booking — `receiptLine`,
`totalBookingCents`, and any future report Beckworth writes — wants to treat an instrument
rental and a room booking identically: describe it, cost it, add it to a total. That is the
substitutability test the book uses for inheritance, made concrete: if a function can already
be written once, against one type, and handed either class without knowing which one it got,
the classes are not two unrelated things that happen to share a part — they are one *kind* of
thing, described twice. `Bookable` names that kind: something Beckworth lets out for a period
at a rate. An instrument and a room both are one, honestly, not just structurally.

Question 4 from [`NAMING.md`](../../../../../../docs/NAMING.md), is it true, applies to the
*class name* `Bookable` as much as to any method. If instruments and rooms disagreed about
what "cost" means, or what "late" means, forcing them under one name would be lying with a
type system instead of a comment — which is exactly why one of the two "identical-looking"
methods in this exercise stays split. Read on.

## Why this order: shape first, meaning second

I extract the empty superclass and establish `extends` *before* moving a single field, so a
break right after step 1 is definitely `extends` itself, not a member I moved — every later
step then has exactly one thing to verify. And I check the *fields* before the *methods* built
from them, because a method built from wrong fields will look shared even when it is not:
`costCents()` on both classes already reads "rate times units, rounded" before either class's
fields share a name. Pulling up the method text first is how "these two classes look alike"
quietly becomes "these two classes are now forced to be alike," the trap this drill is built
around.

## Step 1 — the empty superclass

```ts
// before: no relationship at all
export class InstrumentRental { /* ... */ }
export class RoomBooking { /* ... */ }

// after
export abstract class Bookable {}
export class InstrumentRental extends Bookable { /* unchanged */ }
export class RoomBooking extends Bookable { /* unchanged */ }
```

Nothing to test yet, which is the point of doing it first and alone — an empty base class
cannot change what either subclass computes. `abstract` here is doing real work even with a
member-less body: it stops anyone from writing `new Bookable()` and getting an object that
answers no meaningful question about itself.

## Step 2 — Pull Up Field, and the vocabulary problem it exposes

Before this step, the two classes' constructors read:

```ts
// InstrumentRental
constructor(props: InstrumentRentalProps) {
  this.#instrumentName = props.instrumentName;
  this.#rentalDays = props.rentalDays;
  this.#dailyRateCents = props.dailyRateCents;
  // ...
}

// RoomBooking
constructor(props: RoomBookingProps) {
  this.#roomName = props.roomName;
  this.#bookedHours = props.bookedHours;
  this.#hourlyRateCents = props.hourlyRateCents;
  // ...
}
```

Three concepts, six names, no overlap in spelling at all — a harder case than
[`drill-12-01`](../../../01-pull-up-method/README.en.md)'s, where `materialsFeeCents` and
`suppliesFeeCents` were at least both trying to name the same fee. The mechanics of moving
each field up — declare it on the superclass, thread it through a shared props object, delete
the subclass's own copy — are exactly that drill's Pull Up Field, not re-explained here. What
is different is inventing the name before the move is even possible, because no existing
spelling on either side is worth defaulting to.

**On the name.** `itemName`, not `instrumentName` or `roomName` promoted to cover both.
Question 2 from [`NAMING.md`](../../../../../../docs/NAMING.md): could this be the name of
something else in this file? Picking `instrumentName` and using it for a room booking would
be actively false the moment someone read `RoomBooking`'s constructor call `itemName:
props.roomName` and had to stop and translate. A genuinely new, neutral word costs one more
name to learn and saves every future reader a small lie.

**On the name, again.** `units`, not `quantity` or `duration`. Question 1: does it survive a
rewrite? `duration` says "a span of time," true for hours but an odd fit for
days-of-possession, and it would read strangely the day Beckworth adds a locker rental billed
by the week. `units` says nothing about what a unit *is*, which is exactly right for a field
two different subclasses fill in with two different meanings on purpose.

**On the name, a third time.** `rateCentsPerUnit`, not `rate` or `priceCents`. Question 3 —
does it read at the call site? `Math.round(this.rateCentsPerUnit * this.units)` reads as a
complete sentence. "Rate" alone invites a second rate to show up later with no name left to
distinguish it (a discounted rate, a rush-rental surcharge) — question 2 again, from a
different angle than the first field.

## Step 3 — Pull Up Method

Once both classes read `this.rateCentsPerUnit` and `this.units`, the two `costCents()` bodies
are not just similar, they are identical, character for character:

```ts
costCents(): number {
  return Math.round(this.rateCentsPerUnit * this.units);
}
```

Move it to `Bookable`, delete both copies. This is the safe, boring half of Extract
Superclass — safe specifically *because* step 2 already did the hard part. Attempting this
first would have meant writing `costCents()` against a field that doesn't exist on the base
yet, or quietly picking one subclass's field name and breaking the other.

## Step 4 — the abstract contract, and what it is *not* claiming

```ts
export abstract class Bookable {
  // ...
  abstract bookingDescription(): string;
}
```

`bookingDescription()`'s two implementations were never textually close — a receipt line
for an instrument names a category and pluralizes a day count; one for a room names a
capacity and never pluralizes an hour count. I did not try to merge them, and declaring the
method abstract on `Bookable` is not claiming they should be. It claims something narrower
and true: every `Bookable` owes the caller *a* description, in whatever shape its own kind of
booking calls for — "can describe itself," one level more general than "describes itself the
same way." [`drill-12-01`](../../../01-pull-up-method/README.en.md)'s `Lesson` uses the same
shape for `invoiceDescription()`: an abstract method is how you say "this varies, and here is
exactly where," the honest middle ground between forcing one implementation and leaving the
method off the superclass entirely.

## Step 5 — the checkpoint, and the method that does not move

`lateFeeCents(unitsOver: number): number` exists on both classes, same name, same parameter
and return type — stronger duplication signal than `costCents()` ever gave, since no renaming
is even needed to line the signatures up. Read the two bodies instead of trusting that:

```ts
// InstrumentRental
lateFeeCents(daysLate: number): number {
  return Math.round(LATE_RETURN_FEE_CENTS_PER_DAY * daysLate);
}

// RoomBooking
lateFeeCents(hoursOver: number): number {
  return Math.round(this.rateCentsPerUnit * Math.ceil(hoursOver));
}
```

These compute different things, for different reasons, and the difference is not
incidental. An instrument late fee is a *deterrent*: a violin three days past its due date
costs Beckworth the same thing regardless of whether the violin is a $50 rental or a $800
one — another student cannot book either one back, and the flat fee exists to make returning
it promptly worth doing. A room-booking overrun is not a deterrent at all, just more of the
same booking: the room is occupied for another half hour, billed the same way the first two
were, at the room's own rate, rounded up because the next booking cannot start on a fraction
of an hour.

Pulling this "up" would have to pick one formula and force it onto the other class, or
declare it abstract and leave two implementations connected by nothing but a shared name and
signature — a promise that "every `Bookable` has one coherent idea of a late fee," which is
false. Nothing here is broken, so nothing here moves. The signature match is the tell that a
naive first pass would flag this as the next obvious Pull Up; finding out it isn't is the
actual exercise, and everything before this step is scaffolding for the moment you look
closely at this one method and stop.

## Step 6 — the union type retires

```ts
// receipt.ts, before
type Booking = InstrumentRental | RoomBooking;
export function receiptLine(booking: Booking): string { /* ... */ }

// receipt.ts, after
export function receiptLine(booking: Bookable): string { /* ... */ }
```

Same shape as [`drill-12-01`](../../../01-pull-up-method/README.en.md)'s step 5: the union
existed only because nothing shared named the members `receiptLine` needed, and once
`Bookable` declares both, the stand-in has nothing left to do. Not required by "done when" —
the union still compiles — but leaving it would mean `receipt.ts` kept advertising a
distinction the module no longer needs to make.

`Bookable` itself is not exported from `index.ts`, in either version: an internal collaborator
that lets `receipt.ts` be written once, not a new public concept. This refactor adds a class
no caller sees, without touching the frozen public surface at all.

## What it cost

The real cost is coupling, not risk: `InstrumentRental` and `RoomBooking` now agree, by
construction, that a bookable thing has exactly one rate and one unit count. If Beckworth
ever adds a rental with a *tiered* rate — the first two days at one price, every day after at
a discount — whoever adds it either extends `Bookable` with a second rate only one subclass
uses (a `Refused Bequest` waiting to happen) or reopens this decision for a third kind of
booking. I think that is a reasonable bet for a two-class codebase today; I would not make it
if tiered pricing were already on Beckworth's roadmap.

The thing I am least sure of is `units` as a field name — exactly what the shared formula
needs, and exactly what I would resist giving to a public API, because `rental.units` at an
outside call site tells a reader nothing about days versus hours. It survives here only
because it is `protected`, and each subclass's own public surface
(`InstrumentRentalProps.rentalDays`, `RoomBookingProps.bookedHours`) still says the true,
specific thing. A reviewer could reasonably ask whether a `protected` field earning a vaguer
name than a `private` one would need is a fair trade; the alternative — two different
protected field names and no shared `costCents()` — is the thing this exercise exists to
avoid, but I would not call the trade free.

## If you took a different route

- **Extracting a `BillingRate` component instead of a superclass.** Discussed above as the
  live alternative, not a strawman — for a codebase where billing math needed to be swapped
  independently of the booking's identity, it would be the better call. I did not find that
  evidence in this domain, which is the actual thing that decides between them.
- **Renaming one subclass's fields to match the other's, instead of inventing new names.**
  Cheaper — one constructor changes instead of both — and rejected because neither
  `instrumentName` nor `roomName` is true of the other class's data, unlike
  [`drill-12-01`](../../../01-pull-up-method/README.en.md)'s field rename, where one existing
  name genuinely was true for both lesson types already.
- **Making `lateFeeCents` abstract on `Bookable` anyway**, purely to document that every
  `Bookable` has *some* notion of a late charge. Defensible as a nudge for future subclasses;
  I decided against it because it would commit `Bookable` to a promise its own two subclasses
  already disagree about the meaning of.

What is *not* a matter of taste: pulling `lateFeeCents` up, in any form, before its two
meanings are read and understood as different — the one mistake this exercise is built to
make attractive and wrong at the same time.

## Where TypeScript changes this from the book

Fowler's Extract Superclass mechanics do not depend on the host language — create the
superclass, pull members up one at a time, verify after each. What TypeScript adds is a
sharper failure mode for step 5's near-miss: `lateFeeCents(unitsOver: number): number` already
matches on both classes with no rename needed, so a structural type checker would happily let
you write a shared abstract signature for it and never complain that the two implementations
mean different things — the type system enforces *shape*, not *meaning*, and shape is exactly
where this method already agrees. `noImplicitOverride` in this repository's
`tsconfig.base.json` catches an accidental override of a real shared member; it cannot catch
an override of a coincidental one, because to the compiler the two look identical. That check
has to happen by reading the two method bodies as prose, the one step here no tool can do for
you.
