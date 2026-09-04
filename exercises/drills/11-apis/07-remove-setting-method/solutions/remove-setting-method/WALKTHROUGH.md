# Walkthrough — a private field the constructor is the only writer of

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost, and
where the two tools TypeScript gives you for this — `readonly` and `#private` — each stop
being enough. Read it after you have your own version, not before.

---

## What `setId` actually claims

```ts
export class Ticket {
  #id: string;
  // ...
  constructor(details: TicketDetails) {
    this.#id = "";
    // ...
  }

  setId(id: string): void {
    this.#id = id;
  }
}
```

A setter is not just a method. It is a claim about the object's lifecycle: *this field can
change after the object exists.* `Ticket.setId` makes that claim about the one field in this
class for which it is false. A ticket's serial is printed on a physical stub the moment the
ticket is issued. It is scanned at the door against that same value. It is the key
`TicketOffice` looks tickets up by for a refund. Nothing about this domain ever revisits it —
except the one method sitting on the class inviting exactly that.

`TicketOffice.issueTicket` is the only caller today, and it calls `setId` exactly once,
immediately after building the ticket:

```ts
issueTicket(details: TicketDetails): Ticket {
  const ticket = new Ticket(details);
  this.#ticketsById.set(ticket.id, ticket);
  ticket.setId(this.#printer.nextSerial());
  return ticket;
}
```

That "immediately, once" pattern is exactly what the book's *Remove Setting Method*
describes: a setter whose only real job is standing in for a constructor argument that
was not available yet at construction time. The method's *signature* does not know that,
though. `setId(id: string): void` is public, permanent, and callable by anyone holding a
`Ticket` at any point in its life — a reconciliation script written eight months from now,
a well-meaning bug fix that wants to "correct" a typo'd serial, a test double that doesn't
bother building a printer. The setter is not dangerous because of how it is used today. It
is dangerous because of everything it still permits.

## The bug this setter enables, right now

It is not even hypothetical here. Look at the order of operations in `issueTicket`:

```ts
const ticket = new Ticket(details);          // #id is ""
this.#ticketsById.set(ticket.id, ticket);    // filed under ""
ticket.setId(this.#printer.nextSerial());    // #id becomes "GALA-1" - too late
```

The map is keyed by whatever `ticket.id` was *at the moment of insertion*, and `setId`
does not — cannot — reach back and re-key an entry that has already been written under the
old value. The ticket that comes back from `issueTicket` reports the right id, so a caller
who only reads the return value never notices. Ask the registry to find that exact ticket
by that exact id one line later, though, and `findById` comes back `undefined`. A second
`issueTicket` call makes it worse: the next ticket also gets filed under `""`, silently
overwriting the first ticket's entry before either one is keyed correctly. This is the
scenario `tests-fixed/` pins — it can't live in the shared suite, because the shared suite
has to stay green against this exact challenge code too, and against this code the correct
answer is `undefined`.

## Why this order

Add the new constructor parameter before touching a single caller. Move the caller onto it
before deleting anything. Delete `setId` only once nothing calls it. Each step is either
purely additive or purely subtractive — never both in the same commit — so if the suite
goes red you know which kind of mistake you made.

The alternative — deleting `setId` first and fixing the resulting compile error — works for
a one-caller class like this one. It stops working the moment there are three callers, and
building the habit on the easy case pays off on the hard one.

## Step 1 — the constructor learns to accept an id

```ts
// before
constructor(details: TicketDetails) {
  this.#id = "";
  ...
}
// after
constructor(id: string, details: TicketDetails) {
  this.#id = id;
  ...
}
```

`setId` is still here, still exported, still unused by anything but the (now redundant)
placeholder logic. The suite is green because nothing calls the constructor with a real id
yet — this step is pure addition.

**On the name.** The constructor takes `id` before `details`, not folded into
`TicketDetails` alongside `performanceId`, `priceCents`, and `holderName`. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — is the reason: `TicketDetails`
is what a customer supplies when a ticket is bought. The id is not a detail the customer
requests; it's assigned by a printer the customer never sees. Putting it in the same bag as
the customer-facing fields would have been a passable first draft and a small lie about
where each value comes from.

## Step 2 — the caller learns to ask first

```ts
// before
const ticket = new Ticket(details);
this.#ticketsById.set(ticket.id, ticket);
ticket.setId(this.#printer.nextSerial());
// after
const ticket = new Ticket(this.#printer.nextSerial(), details);
this.#ticketsById.set(ticket.id, ticket);
```

This is the step that changes behaviour, and it is the entire fix: ask the printer for the
serial *before* the ticket — and the map entry — exist, instead of after. There is no longer
a window where the ticket's id and the map's key can disagree, because there is no longer a
version of the ticket that has the wrong id. Run `SOLUTIONS=1 npx vitest run` here and watch
`tests-fixed/` turn green for the first time.

## Steps 3–4 — deleting what nothing needs

`setId` and the `this.#id = ""` placeholder both go. There is no caller left to break,
which you establish the same way `drill-11-01`'s step 6 did: by reading `ticket-office.ts`,
not by asking the compiler — an exported method with zero local callers still compiles,
because something outside this module could still import the class and call it.

## Step 5 — `readonly`, once it can finally tell the truth

```ts
readonly #id: string;
```

This only compiles now. Try adding `readonly` back in step 1, with `setId` still in the
class, and TypeScript refuses: *"Cannot assign to '#id' because it is a read-only
property,"* pointed at `setId`'s own body. `readonly` cannot coexist with a method whose
entire job is violating it — which means removing the setter isn't a nice-to-have on top of
marking the field `readonly`. It's the only way `readonly` gets to be true.

## `readonly` versus `#private`, and why `id` gets more than `performanceId` does

Every field on this class ends the exercise non-writable from outside. Two different tools
do that job, and they are not the same strength.

`performanceId` and `priceCents` are plain `readonly` public fields — compiler-enforced,
compiler-erased. At runtime they are ordinary, writable object properties; TypeScript's
`readonly` never emits a single byte of runtime protection. The compiler catches
`ticket.performanceId = "x"` at every call site *it can see*. It has no opinion about
`(ticket as unknown as { performanceId: string }).performanceId = "x"`, `Object.assign`, or
any code written in plain JavaScript that never passed through `tsc` at all. For these two
fields, that gap is one I'm comfortable leaving open: nothing in this codebase treats a
`Ticket` as `any`, and if `performanceId` were ever wrong, the next screen that renders it is
where you'd find out — a loud, local, easy-to-trace failure.

`#id` is different, and it is different for one specific reason: it is a map key
somewhere else. A silent corruption of `performanceId` shows up the next time someone reads
it. A silent corruption of `#id` shows up as a *different* ticket going missing from the
registry, possibly minutes or files away from whatever touched it, which is a much worse
class of bug to track down. That is why `#id` earns the stronger tool: a true private field,
with only a getter and no setter, enforced by the JavaScript runtime itself — not by
`tsc`, and not erased when the code leaves the compiler. Try the same bypass:

```ts
(ticket as unknown as { id: string }).id = "forged";
```

Against a plain `readonly id: string` field, this compiles (the cast defeats the type
checker) and *runs* — silently, successfully, no error, id corrupted. Against `#id` exposed
only through `get id()`, the same line still compiles, but at runtime it throws: assigning
to a property that has only a getter is a `TypeError` in strict mode, which every ES module
runs in by default. `readonly` fails silently when bypassed. A getter-only accessor over a
`#private` field fails loudly. That gap — silent versus loud — is the entire argument for
paying the extra ceremony on exactly one field and not the other four in this drill.

**Say plainly where each is enough.** `readonly` is enough whenever a value never crosses an
`any`-typed or untyped boundary and a corrupted value fails fast and locally if it ever
happened anyway. `#private` earns its cost when a value backs a hidden invariant somewhere
else — a map key, a cache entry, an index — where a corrupted value fails silently, late,
and far from the field that caused it. Reaching for `#private` on every field "to be safe"
is not free: it is a getter and a field for every property instead of one line, and a
reader has to notice that the extra ceremony is deliberate rather than habitual. This drill
tries to earn that ceremony rather than assume it.

## The setter that stays

```ts
transferTo(newHolderName: string): void {
  this.#holderName = newHolderName;
}
```

`holderName` keeps a public mutator, unrenamed in spirit from a plain setter, because the
claim it makes is true: a ticket's holder is allowed to change after the ticket exists — a
patron passing a ticket to a friend before the show is an ordinary, expected event, not an
edge case to guard against. The four questions from `NAMING.md` still apply to it:
`transferTo` over `setHolderName` is question 3 (does it read at the call site? —
`ticket.transferTo("Wale Osei")` reads as an action a box office performs; `ticket.
setHolderName("Wale Osei")` reads as a field write and hides that this is a real event a
real caller decided to do) and question 1 (a bare setter name says nothing about *why* the
field is changing, and here there is exactly one reason it ever does).

The lesson of this drill is not "delete every setter." It's "a setter should be exactly as
permanent as the truth it's telling." `setId` lied about the ticket's lifecycle. `transferTo`
doesn't.

## What it cost

Once `setId` is gone, there is no way to correct a wrongly numbered ticket in place — no
method left to call. In a real box office that's not automatically the right trade: if a
printer double-prints a serial, or a staff member fat-fingers a manual override, the fix
under this design is to void the ticket and issue a new one, not to patch the one you have.
This drill does not build that voiding workflow, so I can't show you it's actually fine —
I can only tell you it's the honest cost of the refactor, and it's the reason
`solutions[0].tradeoff` in this drill's `meta.json` says so instead of pretending the
refactor is free.

I am also not fully sure `#private` is worth it for `id` specifically versus leaving it
`readonly` like the other two fields and calling the bug fixed by step 2 alone — step 2 *is*
the actual fix; the `#private` upgrade in step 5 only closes a bypass nothing in this
exercise's tests exercises. I kept it because the map-key argument above is real, but a
reviewer who called that over-engineering for a four-field class would not be wrong.

## If you took a different route

- **Making the constructor itself private**, so only `TicketOffice` (via a factory method
  on `Ticket`) can build one. Legitimate, and it's exactly the move the next exercise,
  [`08-replace-constructor-with-factory-function`](../../../08-replace-constructor-with-factory-function/README.en.md),
  is about — I left `Ticket`'s constructor public here so this drill stays about the setter.
- **Keeping `setId` but renaming it as if underscore-prefixed or `@internal`.** Worse than
  deleting it: TypeScript's access modifiers are compile-time only, same as `readonly`, so a
  convention enforced by a comment is weaker than the enforcement argued for above.
- **Passing the printer's serial into `TicketDetails` instead of as a separate constructor
  parameter.** Defensible; I kept it separate for the reason in the step 1 naming note.

What is *not* a matter of taste: leaving any public method — under any name — that can
reassign `#id` after construction. That is the one thing this exercise exists to remove, and
it is not done while it survives under a different name.

## Where TypeScript changes this from the book

Fowler's own treatment of this refactoring doesn't have a runtime-enforced private field to
reach for — the underlying language just doesn't have one. TypeScript's `#private` fields
(a JavaScript feature TypeScript adopted, not a TypeScript-only annotation) are the
difference: they are the one access-control mechanism in this entire codebase that survives
being compiled away, cast around, or read from plain JavaScript. Every other guarantee this
repository leans on — `readonly`, `private`, `protected`, even the type system's `Seat |
null` versus `void` distinction in `drill-11-01` — is a promise `tsc` makes and stops making
the moment its output runs. `#id` here is the one place in this drill where the promise is
made by the language runtime instead, and it is worth noticing exactly how rare that is.
