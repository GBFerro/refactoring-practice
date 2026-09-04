# Walkthrough — one function, no ceremony

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost,
and the test I used to decide this class had earned nothing. Read it after you have your
own version, not before.

---

## The test, stated plainly, before touching any code

A command earns its keep when the operation has enough internal structure that turning
its temps into fields lets you break it into methods — **and** when nothing about doing
that costs more than it buys, or when you want to build the operation now and run it
later, run it twice, undo it, or inspect it mid-flight. A function is right when none of
that is true, which is most of the time.

`CalculateHandlingFeeCommand` fails every clause of that test at once, which is rarer than
it sounds — usually a needless class fails on structure but you can at least imagine
someone wanting to hold it and run it later. Here nobody does that either.
[`drill-11-09`](../../../09-replace-function-with-command/README.en.md) is the same test
applied to a case that passes; read the two side by side, because they were written to
argue with each other.

## What `CalculateHandlingFeeCommand` actually is

```ts
export class CalculateHandlingFeeCommand {
  constructor(private readonly order: Order) {}

  execute(): number {
    const base = BASE_FEE_POUNDS + PER_SEAT_FEE_POUNDS * this.order.seatCount;
    const withRush =
      this.order.hoursUntilShowtime < RUSH_WINDOW_HOURS
        ? base + RUSH_SURCHARGE_POUNDS
        : base;
    return Math.min(withRush, MAX_FEE_POUNDS);
  }
}
```

One field, and it is the constructor's own argument, unchanged, never reassigned. One
method, and it runs start to finish in a single pass — no phase reads a value a previous
phase wrote, because there is only one phase. Every caller uses it the same way, in the
same breath: `new CalculateHandlingFeeCommand(order).execute()`, construct and run,
never held, never run twice, never inspected in between.

That last sentence is the whole diagnosis. A class is a promise that there is something to
hold between "build" and "run," or something worth reading off the object afterward. This
class keeps neither promise. It is **Lazy Element**: a piece of structure that is not
pulling its weight, spending a constructor and a method name on what a single function
signature already says in full: `(order: Order) => number`.

## Why this is the easy direction, and why that's worth saying

[`drill-11-09`](../../../09-replace-function-with-command/README.en.md) is the harder
sibling: seven values, three phases, a real reason each temp needed to become a field. This
drill has none of that, and the walkthrough for it would be dishonest if it pretended
otherwise by inventing tension that isn't there. Sometimes the right amount of commentary
on a decision is "there is nothing to weigh here" — and saying that plainly is more useful
than performing a struggle for the sake of matching the shape of a harder exercise.

The one thing that *is* worth walking through carefully is exactly how little changes at
each call site, because "little" is not "nothing," and the difference is where the lesson
lives.

## Step 1 — a function next to the command, not instead of it yet

```ts
export function calculateHandlingFee(order: Order): number {
  const base = BASE_FEE_POUNDS + PER_SEAT_FEE_POUNDS * order.seatCount;
  const withRush =
    order.hoursUntilShowtime < RUSH_WINDOW_HOURS ? base + RUSH_SURCHARGE_POUNDS : base;
  return Math.min(withRush, MAX_FEE_POUNDS);
}

export class CalculateHandlingFeeCommand {
  constructor(private readonly order: Order) {}
  execute(): number {
    return calculateHandlingFee(this.order);
  }
}
```

Same migration discipline as
[`drill-11-09`](../../../09-replace-function-with-command/README.en.md)'s step 1, run in
the opposite direction: introduce the new shape, have the old shape delegate to it, change
nothing a caller can observe. The suite is green here for the least interesting possible
reason — nothing has moved yet.

**On the name.** `calculateHandlingFee`, not `handlingFee` or `getHandlingFee`. Question 1
from [`NAMING.md`](../../../../../../docs/NAMING.md) — what, not how — might seem to argue
for the shorter noun-phrase form, the way this repository's conventions table prefers
`averagePace` over `calculateAveragePace` for something that only answers a question. I
kept the verb here on purpose: `handlingFeeFor`, the caller two steps below, is the noun
version, and having both a noun-shaped caller and a noun-shaped calculation in the same
file would fail question 2 — either could be mistaken for the other at a glance. The verb
form marks this one as the calculation underneath, not the thing a checkout screen asks
for.

## Steps 2–4 — moving three callers that cannot actually disagree

```ts
// handlingFeeFor, before
return new CalculateHandlingFeeCommand(order).execute();
// after
return calculateHandlingFee(order);
```

Compare this to [`drill-11-01`](../../../01-separate-query-from-modifier/README.en.md),
where moving a caller onto a new query changed what two of the three callers actually
returned. Nothing like that can happen here: `CalculateHandlingFeeCommand.execute()` was
already implemented as "run the calculation once, return the number," so replacing the
object with a direct call is behaviourally inert by construction, for all three callers,
every time. I still moved them one at a time and ran the suite after each — not because I
expected a red result, but because the whole discipline of this repository is that "I
don't expect this to break anything" is a prediction, not a proof, and the three-commit
trail is what you'd want to read if step 3 were the one that turned out to be wrong.

**On the name.** `handlingFeeFor`, unchanged across the refactor. Worth noting *because* it
didn't change: question 3 — does it read at the call site? — was already satisfied before
this drill started, and Replace Command with Function doesn't touch a caller's name, only
what it calls. A refactoring that changes a name it didn't need to touch is doing two
things in one commit, which is its own kind of smell.

## Step 5 — deleting the class

Once step 4 lands, `CalculateHandlingFeeCommand` has no callers in `src/`. Same check as
every other module in this chapter: TypeScript won't flag an unused export on its own,
because something outside the module could still import it, so this is established by
reading `callers.ts`, not by the compiler. Delete it, run the suite, still green.

## What it cost, honestly

Almost nothing, and saying so is the point of this exercise rather than a way of avoiding
one. The only real, nameable cost: `calculateHandlingFee` cannot be built now and run
later the way an un-executed `CalculateHandlingFeeCommand` object technically could — you
could have constructed one at the top of a request handler and called `execute()` at the
bottom, deferring the actual arithmetic. Nothing in this module ever did that, and I looked
for a plausible reason a fee calculator would want to before writing this off — a delayed
execute() would only matter if `order` could change shape between construction and running,
and an `Order` here is an immutable snapshot of a booking at one moment, not a mutable
object something else might still be filling in. If a future version of this box office
needed to prepare a fee calculation before all its inputs were known, that would be a real
reason to reach for a command again — it just isn't a reason that exists yet.

The decision I am least sure about is keeping `handlingFeeFor` at all once it's a one-line
pass-through to `calculateHandlingFee`. In a codebase without this repository's testing
convention, I would inline it and let callers reach `calculateHandlingFee` directly — that
is arguably its own small `Lazy Element`, one function forwarding to another with nothing
added. I left it because this drill's suite, like every `apiFrozen: false` drill in this
module, is written against caller names that have to stay stable across the challenge and
the solution; `handlingFeeFor` is that stable name here, the same role
`sectionHasAvailability` plays in `drill-11-01`. In real code with no such constraint, I
would not keep it, and I want to say that plainly rather than let the exercise's own
scaffolding read as a design recommendation.

## If you took a different route

- **Inlining `handlingFeeFor` into `calculateHandlingFee` and updating every external
  caller to the new name.** The more thorough answer, and probably the right one outside
  this exercise's constraints — see above.
- **Keeping the field name `order` on the function's parameter rather than renaming it.**
  I did keep it; a plausible alternative is a shorter parameter name now that there's no
  `this.` in front of it. I didn't rename it, because `order` already passes all four
  naming questions and renaming it would be change for the sake of change.
- **Deleting `CalculateHandlingFeeCommand` in the same commit as moving the last caller.**
  Defensible for a change this small; I kept it as its own step anyway; for consistency
  with the rest of this module's drills, and because "the class exists but nothing calls
  it" is itself a fact worth a commit that says so, however briefly it lives.

What is *not* a matter of taste: keeping the class once every caller has moved off it. A
class with a constructor that only stores its arguments and a single method that only
consumes them is not an occasional bad idea depending on preference — it costs a reader a
constructor call and a method dispatch to learn nothing a function signature wouldn't have
told them for free.

## Where TypeScript changes this from the book

Fowler's own note on this refactoring is that it usually undoes a Replace Function with
Command performed too eagerly, or one whose motivating case never actually arrived. In
JavaScript, spotting that a command has degenerated to one field and one method is a
matter of reading the class. In TypeScript, the signature makes the argument more visible
before you open the body at all: `execute(): number` next to a constructor typed
`(order: Order)` is, structurally, already the type of the function you're about to write —
`(order: Order) => number` — and a reader who never looks past the class's declared shape
can still notice that the constructor parameter and the method's only dependency are the
same value. That doesn't prove the class is unnecessary — `drill-11-09`'s command has a
matching-looking constructor and genuinely earns its keep — but it's a visible hint here
that JavaScript would have made you read the body to find.
