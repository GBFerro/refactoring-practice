# Walkthrough — buyoutCreditsCents lives on LeaseToOwnRental only

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the type system does and does not catch
for you, and where I am not fully sure I made the right call. Read it after you have your
own version, not before.

---

## Before anything: a field the base cannot explain

`InstrumentRental` declares `buyoutCreditsCents: number | null`. Ask it what the field
means and the honest answer is "nothing, on its own" — it means "credit accrued toward
buying this instrument," which only makes sense for a `LeaseToOwnRental`. Every
`TrialRental` that has ever existed sets it to `null` in its constructor, not because some
trials happen to have no buyout credit yet, but because a trial has no purchase option at
all. There is no future in which a `TrialRental`'s `buyoutCreditsCents` is anything but
`null`. A field with exactly one subclass that can give it a real value, and every other
subclass forced to supply a placeholder for a concept that does not apply to them, is
*Temporary Field* — temporary not in the sense of short-lived, but in the sense of "only
sometimes has anything to say."

**The tell, in this codebase specifically:** grep the challenge for `?? 0` and
`=== null`. Both appear exactly where `buyoutCreditsCents` is read — `rentalLine` and
`totalBuyoutCreditsCents` — and nowhere else in the file. Every other field on
`InstrumentRental` is read with no such guard, because every other field means the same
thing for every subclass. That asymmetry, not a line count or a code smell checklist, is
the actual evidence.

## Why this order

Fowler's Push Down Field, read plainly, is one move: declare the field on the subclass that
needs it, remove it from the superclass. In JavaScript that is close to true — nothing
stops a `TrialRental` instance from momentarily having no `buyoutCreditsCents` property at
all while you edit, because nothing checks that it should.

TypeScript will not let you do that in one step here, and the reason is worth stating
plainly because it is the most TypeScript-specific thing in this drill. The moment
`buyoutCreditsCents` leaves `InstrumentRental`, every function typed to accept an
`InstrumentRental` and read that field off it stops compiling — not at runtime, not in a
test, at `tsc`. `rentalLine` and `totalBuyoutCreditsCents` both do exactly that. So the
field cannot move until every reader has already stopped needing it to be there, which
means the readers have to change *first*, while the field is still exactly where it was.
That ordering constraint is the entire reason this drill has two steps instead of one.

## Step 1 — narrow before you move anything

```ts
// before
export function rentalLine(rental: InstrumentRental): string {
  const base = `${rental.studentName} - ${rental.instrumentName} (...)`;
  if (rental.buyoutCreditsCents === null) return base;
  return `${base}, ${formatCents(rental.buyoutCreditsCents)} credited toward buyout`;
}

// after
function isLeaseToOwnRental(rental: InstrumentRental): rental is LeaseToOwnRental {
  return rental instanceof LeaseToOwnRental;
}

export function rentalLine(rental: InstrumentRental): string {
  const base = `${rental.studentName} - ${rental.instrumentName} (...)`;
  if (!isLeaseToOwnRental(rental)) return base;
  return `${base}, ${formatCents(rental.buyoutCreditsCents)} credited toward buyout`;
}
```

The field has not moved yet — `InstrumentRental` still declares it, still `number | null`.
Nothing observable changes; the suite passes for the same reason it passed before, not a
new one. What has changed is that both readers now ask "is this a `LeaseToOwnRental`?"
instead of "is this field null?" — two questions with the same answer today, but only one
of them stays askable once step 2 removes the field from the type both readers are
narrowing away from.

**On the name.** `isLeaseToOwnRental`, not `hasBuyoutCredits` or `canBuyout`. Question 4
from [`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — `hasBuyoutCredits`
would currently read as true for exactly the same rentals, which is what makes it tempting,
but it describes a fact about the *field's value*, and the whole point of this predicate is
to stop being a statement about the field's value and become a statement about the
*rental's kind*. Once step 2 lands, `hasBuyoutCredits` would not even type-check as a
description of what the function does — there is no longer a `buyoutCredits` to have or not
have on the type being asked about. `isLeaseToOwnRental` was true before step 2 and stays
true after; that is question 4 doing its job before the fact.

## Step 2 — move the field, delete the defenses

The state step 1 leaves behind: `LeaseToOwnRental` still has *no* declaration of its own;
`buyoutCreditsCents` is still `InstrumentRental`'s field, still nullable, and
`remainingBuyoutCents` is still guarding against a null it happens never to see:

```ts
// before (end of step 1)
remainingBuyoutCents(): number {
  return Math.max(0, this.purchasePriceCents - (this.buyoutCreditsCents ?? 0));
}

// after (step 2)
readonly buyoutCreditsCents: number; // declared here now, not inherited
remainingBuyoutCents(): number {
  return Math.max(0, this.purchasePriceCents - this.buyoutCreditsCents);
}
```

`InstrumentRental` loses the field and the constructor parameter. `TrialRental` loses the
`buyoutCreditsCents: null` it was passing to `super` for a concept it never had an opinion
on. The `?? 0` in `remainingBuyoutCents` deletes itself, the same way the reference
exercise's `?? 0` fallbacks deleted themselves once `isFinisher` proved they were
unreachable — except here the unreachability was true from the start, and it took the type
finally agreeing to make the dead code visible enough to remove with confidence.

**On the name.** I kept `buyoutCreditsCents` unchanged through both steps. I considered
`accruedBuyoutCents` when I noticed the field would soon live somewhere its meaning was
finally unambiguous, thinking a better name might be earned along with the better home.
Question 1 from `NAMING.md` — does it say *what*, not *how*? — `buyoutCreditsCents`
already does; `accruedBuyoutCents` says the same thing with an extra word describing how the
value came to be, which belongs in the doc comment above the field, not the identifier. Not
every move earns a rename, and manufacturing one here would have been solving a problem the
name did not have.

## What did not change, and why that is worth noticing

`LeaseToOwnRental.remainingBuyoutCents()`'s external behavior is identical before and after
this drill — same inputs, same outputs, for every rental the tests construct. What changed
is what the type system will let a *future* caller get away with. Before this drill, nothing
stopped a bug from constructing a `LeaseToOwnRental` — or, worse, a `TrialRental` — with a
non-null `buyoutCreditsCents` that meant something inconsistent with how the rest of the
code used the field. After, `TrialRental` has no `buyoutCreditsCents` slot to misuse, and
`LeaseToOwnRental.buyoutCreditsCents` is a plain `number` — there is no longer a `null` state
for a caller to forget to handle, because there is no longer a class for which `null` was
ever the right answer. That is the actual win: not shorter code — step 2 nets out at roughly
the same line count — but a state space with one fewer way to be wrong.

## What it cost, and what I am unsure about

**The cost that is easy to state:** `totalBuyoutCreditsCents` used to be a single `reduce`
with a `?? 0` fallback; it is now a `filter` followed by a `reduce`, over the same data, to
reach the same number. Two passes over the array instead of one, and two lines of
boilerplate — the predicate's declaration — that a single optional field did not need. For
a school's rental roster, sized in the dozens, that cost is not real; I would not make the
same trade without measuring first on a collection sized in the millions.

**What I am not sure about:** whether `isLeaseToOwnRental` earns being a named, exported-
from-nowhere-but-used-twice helper, or whether two independent `instanceof` checks inline
would have been just as honest and one function shorter to maintain. I chose the named
predicate because both call sites are asking the identical question and a rename of
`LeaseToOwnRental` should only require finding one `instanceof`, not two. A reviewer who
values fewer indirections over that guarantee could reasonably keep the inline checks.

## If you took a different route

- **Giving `InstrumentRental` a `buyoutCreditsCents(): number` method that returns `0` by
  default and is overridden on `LeaseToOwnRental`.** This works, keeps every call site as a
  single expression with no narrowing, and is the more conventional object-oriented answer
  to "a superclass needs to be askable about something only one subclass really has." I did
  not take this route because a "buyout credit" of `0` for a trial rental is not just a
  convenient default — it asserts that trials *have* a buyout balance, and it happens to be
  zero, which is the exact lie Push Down Field exists to stop the base class from telling.
  Defensible, and worth trying if you want to see the alternative shape.
- **Leaving `remainingBuyoutCents`'s `?? 0` in place** even after step 2, on the theory that
  defensive code costs nothing. It costs nothing to run and something to read: a `?? 0`
  guarding a value the type system already guarantees is never null tells the next reader
  there is a case they need to worry about, and there is not one anymore.

What is *not* a matter of taste: constructing a `TrialRental` that still sets
`buyoutCreditsCents` to anything, even `null`, once the field has moved. If a subclass has
no opinion on a field, the type should say so by not declaring it, not by declaring it and
always disagreeing with itself.

## Where TypeScript changes the shape of the problem

This is the drill where the gap between the book's Java and this repository's TypeScript is
largest. In Java, a nullable field on a superclass is a landmine you step on at runtime — a
`NullPointerException` the day some code path forgets the check, discovered in production or
not at all if that path is rare enough. TypeScript's strict null checks turn that landmine
into a compile error: `rental.buyoutCreditsCents` on an `InstrumentRental`-typed value is
`number | null`, and using it as a `number` without narrowing does not compile, full stop.
That is why the smell here is *loud* rather than *latent* — every reader of the field was
already being forced, by the compiler, to write a null check they could never explain the
reason for. Compare drill-12-02: pulling a field *up* changed nothing about what compiled,
because the union type there already exposed the field regardless of which class declared
it. Pushing a field *down* is the direction where TypeScript's null-checking makes the
before-and-after visible in the type signatures themselves, not just in the prose.
