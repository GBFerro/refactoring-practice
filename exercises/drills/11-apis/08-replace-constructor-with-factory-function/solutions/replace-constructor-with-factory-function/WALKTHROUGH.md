# Walkthrough — a private constructor behind three named factories

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost, and
where this drill stops short of one it is often mistaken for. Read it after you have your
own version, not before.

---

## What `new Ticket("premium", 4000, null)` actually asks you to trust

```ts
constructor(type: TicketType, faceValueCents: number, authorizedBy: string | null) {
  this.type = type;
  this.faceValueCents = faceValueCents;
  if (type === "comp" && (authorizedBy === null || authorizedBy === "")) {
    throw new Error("a comp ticket needs the staff member who authorized it");
  }
  this.authorizedBy = type === "comp" ? authorizedBy : null;
  if (type === "premium") { /* ... */ } else if (type === "comp") { /* ... */ } else { /* ... */ }
}
```

Every call to `new Ticket(...)` looks identical at the call site, regardless of which of
three genuinely different things it is about to build, and regardless of whether it is
about to succeed, silently drop a field, or throw. `new` is a language keyword: it cannot
have a name of its own, cannot decide to hand back something other than a fresh `Ticket`,
and cannot fail any way but throwing. A constructor doing type-code-driven work inherits
all three of those limits whether or not it wanted them, which is exactly what a factory
*function* does not inherit.

## What a factory buys here, concretely

**A name that says what you're making.** `Ticket.premium(4000)` tells a reader what kind of
ticket this is without them opening the definition. `new Ticket("premium", 4000, null)`
buries the same information in a string argument indistinguishable, by its type, from a
typo — `"premuim"` compiles right up until it reaches a branch that doesn't recognize it.

**Failing without throwing.** `Ticket.comp` returns `Ticket | null`. A constructor cannot
return `null` — it either hands back an instance or throws — so the old code's only way to
say "this input doesn't make a valid ticket" was an exception, which is why
`importTickets` had to wrap every single row in a `try`/`catch` just to keep processing the
rest of the batch after one bad row. The new `createTicket` reads the outcome off a return
value instead.

**A different concrete type, or a shared instance, when that's the shape of the problem.**
Neither applies here, and it's worth saying so rather than pretending it does: every ticket
kind in this drill is data, not divergent behaviour, so all three factories return the same
`Ticket` class, and nothing about this domain benefits from two tickets sharing an
identity. A factory earning this benefit looks like `10-conditional-logic/04`'s
`createAppointment`, which returns a different subclass per type because the three
appointment kinds compute their duration and fee differently, not just with different
numbers plugged into the same formula.

## Why this order

Build the new shape next to the old one before deleting anything, the same migration
mechanic as `drill-11-01` and `drill-11-07`. Steps 1–3 only add call sites for the new
factories and move callers onto them one at a time; nothing about `Ticket`'s own
construction changes yet, so each of those steps is either purely additive or moves exactly
one caller. Only step 4 touches the constructor's body, and only step 5 removes the escape
hatch back to `new Ticket(...)`. Doing the escape-hatch removal last means every caller has
already been proven to work through a factory before the door closes behind them.

## Steps 1–3 — building the factories, moving the easy callers

```ts
static standard(faceValueCents: number): Ticket {
  return new Ticket("standard", faceValueCents, null);
}
```

At this point `Ticket.standard` is a thin wrapper — it still goes through the unchanged
constructor, still does its branching internally. That's fine; this step is purely
additive; the suite can't tell the difference yet. `sellStandardTicket` and
`sellPremiumTicket` move onto their factories next, and neither call site's own signature
changes, only its one-line body.

`issueCompTicket` is the interesting one:

```ts
// before
export function issueCompTicket(faceValueCents: number, authorizedBy: string | null): Ticket | null {
  try {
    return new Ticket("comp", faceValueCents, authorizedBy);
  } catch {
    return null;
  }
}
// after
export function issueCompTicket(faceValueCents: number, authorizedBy: string | null): Ticket | null {
  return Ticket.comp(faceValueCents, authorizedBy);
}
```

The `try`/`catch` disappears because `Ticket.comp` already returns `null` on its own. This
is the step where "fail without throwing" stops being a slogan and starts being a line
count: four lines of exception handling collapse into one line that reads exactly like what
it does.

**On the name.** `issueCompTicket`, not `sellCompTicket` — question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md): is it true? A comp ticket is free; nothing
is sold. `sellStandardTicket` and `sellPremiumTicket` keep "sell" because money changes
hands. This is the kind of naming decision that has nothing to do with the refactoring
itself and everything to do with reading the domain carefully while you're in the file.

## Step 4 — where the work actually moves

```ts
static comp(faceValueCents: number, authorizedBy: string | null): Ticket | null {
  if (authorizedBy === null || authorizedBy === "") {
    return null;
  }
  return new Ticket({ type: "comp", faceValueCents, priceCents: 0, perks: COMP_PERKS, authorizedBy });
}
```

The validation that used to throw from inside the constructor now runs *before* the
constructor is ever called, and the constructor itself shrinks to five assignment
statements with no branch in it. This is the actual "replace constructor with factory
function" move — not adding a wrapper around unchanged work, but moving the work somewhere
that can say no without throwing.

**On the name.** `TicketFields` — the object each factory hands the constructor — is not
called `TicketProps` or `TicketData`. Question 2: could it be the name of something else in
this file? `Data` and `Props` are categories, not names, and this repository's naming table
rules them out by construction. `Fields` says specifically "the values that become this
object's fields," which is all it is.

## Step 5 — the constructor stops being an option

```ts
private constructor(fields: TicketFields) { /* ... */ }
```

This is the step this drill exists to teach, and it is the one place TypeScript gives you
something the book's plain JavaScript examples cannot: a *compiler-enforced* private
constructor. After this line, `new Ticket(...)` anywhere outside `ticket.ts` is not a
convention someone might forget — it does not compile. Static methods on the same class can
still call it, because TypeScript's `private` scopes to the class declaration, not to the
call site's location in the file; that is precisely why the three factories have to be
`static` methods on `Ticket` rather than free functions in `callers.ts` — a free function,
even in the same file, cannot reach a private constructor of a class it isn't part of.

## Step 6 — the one dispatch point that survives

```ts
const FACTORY_BY_TYPE: Record<TicketType, Factory> = {
  standard: (faceValueCents) => Ticket.standard(faceValueCents),
  premium: (faceValueCents) => Ticket.premium(faceValueCents),
  comp: (faceValueCents, authorizedBy) => Ticket.comp(faceValueCents, authorizedBy),
};
```

`importTickets` is the one caller that never gets to know its ticket kind until it reads a
row off a spreadsheet — it has a `TicketType` string at runtime, not a name it can write in
source. Something in this module still has to turn that string into a choice, and this is
where that choice lives: one table, one place, instead of a branch repeated at every call
site that also only has a runtime string. I used an object lookup rather than a `switch`
that pattern-matches `type`; both are the same idea, and I picked the lookup because
`createTicket`'s own body then fits in one line under this repository's 12-line cap without
fighting the formatter over how a `switch` gets printed — a small, honest reason, not a
design principle.

## What it cost

Four call sites used to write `new Ticket(...)` and know it would work. Now three of them
write a named factory, and the fourth reads a table. That is a net increase in names a
reader has to learn — `Ticket.standard`, `Ticket.premium`, `Ticket.comp`, and
`FACTORY_BY_TYPE` are four things where `new Ticket(type, ...)` was one — and a fourth
ticket kind, if one ever arrives, now touches the class, the table, and every place that
enumerates ticket kinds by name, instead of one `case` in one constructor. For three
ticket kinds this is a fair trade for a constructor that no longer throws unexpectedly and
call sites that read their own intent. I would not make this trade for a class with one
kind and no choices to make — `Loan` in `07-encapsulation/01` has a plain public
constructor and should keep it, because there is no type code deciding anything and no
caller a factory would help.

I am genuinely unsure whether `TicketFields` pulls its weight as a fourth file-level type,
versus just giving each factory method its full parameter list directly. It exists only to
keep the private constructor under the three-parameter limit; a reviewer who inlined it
back into five constructor parameters and dropped the limit for this one case would be
trading one kind of clutter for another, and I don't think either answer is clearly right.

## Where this drill stops, on purpose

`Ticket.comp`, `Ticket.premium`, and `Ticket.standard` still compute a *number* and a
*list of strings* differently per kind — they do not *behave* differently. Nothing about
this drill's `Ticket` has a method whose logic diverges by kind the way
`10-conditional-logic/04-replace-conditional-with-polymorphism`'s `Appointment` subclasses
do, where `durationMinutes()` is a genuinely different calculation on `CheckupAppointment`
than on `BloodDrawAppointment`. If a fourth ticket kind ever needed its *own* pricing
formula that couldn't be expressed as "plug a different number into the same math," or its
own validation rules beyond "requires an authorizer," that would be the signal to stop
adding branches to this drill's factories and instead give each kind its own class — at
which point `FACTORY_BY_TYPE` stops being a lookup of formulas and becomes exactly
`createAppointment`'s job: the one switch (or table) left standing after the conditional
moves into polymorphism. This drill's factory is where that switch would end up living if
this domain ever grew into needing it. It doesn't yet, and forcing subclasses onto three
kinds that only differ by two numbers and a list would be over-engineering, not
progress.

## If you took a different route

- **A `switch` instead of `FACTORY_BY_TYPE`.** Equivalent in every way that matters; I
  picked the table for the line-count reason above, not a stronger one.
- **One `createTicket(type, ...)` factory function and no named per-kind methods.** Closer
  to the book's minimal recipe, and a fair answer — you'd lose the readability win at the
  three call sites that already know their kind, which is the whole reason I kept both
  layers.
- **Not making the constructor private.** The refactoring still "works" without step 5 —
  callers that were moved onto the factories stay moved — but nothing then stops the next
  contributor from writing `new Ticket(...)` again next month. I think the enforcement is
  worth the one extra step; a reviewer prioritizing a smaller diff could reasonably disagree.

What is *not* a matter of taste: a caller that still needs a `try`/`catch` around ticket
construction, or a factory that throws under the same conditions the old constructor did.
Both mean the refactor didn't actually finish.

## Where TypeScript changes this from the book

A private constructor with public static factory methods either isn't expressible, or is
only enforced by a linter, in most of the languages the book was written against. In
TypeScript it's a real compiler feature: `private` on a constructor is checked at every call
site the compiler can see, the same as any other `private` member. It is still the
compile-time-only kind of enforcement this module's other exercises are candid about —
`drill-11-07`'s walkthrough shows a cast that defeats `readonly` at runtime, and the same
cast defeats a private constructor too, since nothing about `private` survives into the
emitted JavaScript. What it does buy you, and what the book's own examples couldn't lean on,
is that ordinary, un-cast, well-typed code — which is nearly all of it, in this repository
and probably in yours — gets a compiler error instead of a working-but-wrong call, the
moment someone tries to go around the factories.
