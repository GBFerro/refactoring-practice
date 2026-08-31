# Walkthrough — one shared total, computed once

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: lining up the three call sites

`completeRouteStop`, `closeStandingOrder`, and `reprintReceipt` in `src/` each do the same
two things before handing an order to `renderReceipt`: sum the items into a subtotal, then
subtract the order's account credit to get a total. Move Statements into Function exists
for exactly this shape — three copies of the same two lines, in front of three calls to the
same function, is **Duplicated Code**, and the fix is to let the function do it once.

Except the three copies are not quite the same. Two of them read:

```ts
const totalCents = Math.max(0, subtotalCents - order.creditCents);
```

and `reprintReceipt` reads:

```ts
const totalCents = subtotalCents - order.creditCents;
```

No `Math.max`. That is the whole exercise. This refactoring's precondition — the book
states it for the general case, and it is worth stating for this one specifically — is that
every caller is doing **the same thing**. If they are not, moving the statements in does not
preserve behaviour; it silently picks a winner. You cannot see that from running the tests:
none of the six fixtures push an account credit past the order's subtotal, so
`Math.max(0, x)` and plain `x` return the same number for every one of them. The suite is
green on `src/` right now, and it would stay green if you deleted the `Math.max` from the
other two callers instead of adding it to `reprintReceipt`. Reading the three call sites
side by side is the only thing here that catches it — not the compiler, not the suite.

## Why this order

Fix first, move second. If you move first, you have to decide what `renderReceipt` does
about the floor while you are also juggling three call sites and a signature change, and
the decision gets made implicitly by whichever caller's code you happened to paste in. Fix
first and the move becomes mechanical: by the time you touch `renderReceipt`, all three
callers already agree, so there is nothing left to decide — only to relocate.

## Step 1 — floor the reprinted total at zero

```ts
// reprintReceipt, before
const totalCents = subtotalCents - order.creditCents;

// reprintReceipt, after
const totalCents = Math.max(0, subtotalCents - order.creditCents);
```

This is not a refactoring. The output of `reprintReceipt` changes for orders where the
credit exceeds the subtotal — nothing in the current suite exercises that case, but a real
customer with a large enough credit could have seen a negative dollar figure on a reprinted
receipt before this line existed anywhere. I am treating it as a one-line bug fix that
happens to be a prerequisite for the refactoring that follows, and I am keeping it in its
own commit so that "this line's behaviour changed" and "this code moved" are never the same
diff. A reviewer looking at commit 2 should be able to trust that nothing changed.

**On the name.** I did not rename anything in this step, but it is worth stating why the
fixed line reads `Math.max(0, ...)` rather than something like `clampToZero(...)`: at one
call site, spelling out the floor is exactly as readable as naming it, and a named wrapper
for a single `Math.max` call would be Question 2 territory — `clampToZero` could be the name
of any floor in this codebase, and there is only one thing being floored here. That
calculus changes once the expression is shared by three callers instead of one; see Step 2.

## Step 2 — move the computation into `renderReceipt`

```ts
// renderReceipt, before
export function renderReceipt(order: WholesaleOrder, totalCents: number): string[] {
  return [ /* header, item lines */, `Total: ${formatCents(totalCents)}` ];
}

// renderReceipt, after
export function renderReceipt(order: WholesaleOrder): string[] {
  const totalCents = Math.max(0, subtotal(order.items) - order.creditCents);
  return [ /* header, item lines */, `Total: ${formatCents(totalCents)}` ];
}
```

and every caller drops from three lines to one:

```ts
// completeRouteStop, after
export function completeRouteStop(order: WholesaleOrder): string[] {
  return [...renderReceipt(order), "Signed for at the door."];
}
```

This lands as a single commit across all four files, not one commit per caller. The reason
is the signature: `renderReceipt` cannot both take a `totalCents` parameter for two callers
and not take one for a third — TypeScript will not compile a call site that is missing a
required argument, so the switch has to happen everywhere at once. That is a real
difference from a drill like `07-05` (Extract Class), where each method could move
independently because nothing else's signature depended on it.

For three callers, one atomic commit that the suite confirms in one run is the honest
choice. If this function had a dozen callers spread across a larger codebase, I would not
want a dozen-file atomic commit — I would give `renderReceipt` a temporary escape hatch:

```ts
export function renderReceipt(order: WholesaleOrder, totalCentsOverride?: number): string[] {
  const totalCents = totalCentsOverride ?? Math.max(0, subtotal(order.items) - order.creditCents);
  // ...
}
```

and migrate callers one at a time — delete a caller's local computation and its second
argument, confirm, move to the next — before finally deleting the parameter once nothing
passes it. That is genuinely more steps for the same destination, and I decided it was not
worth the extra surface for three callers in one file. See "If you took a different route"
below for when I would change my mind.

**On the name.** `renderReceipt`, not `printReceiptLines` or `buildReceipt`. I want to flag
this one because I wrote `printReceiptLines` first, modeled on what a driver's handheld
terminal literally does with the return value. Question 1 in
[`NAMING.md`](../../../../../../docs/NAMING.md) — does the name say *what*, or *how* —
catches it: nothing in this module prints anything; the function turns an order into lines
of text, and what happens to those lines is the caller's business. `NAMING.md`'s own
convention table settles the replacement: something that turns a piece of the domain into
one or more output lines is `render*`, not `format*` — `format*` is reserved here for one
value going to one string, which is exactly what the module's other function,
`formatCents`, does. Renaming closed the gap between the two functions' names and what they
actually are.

**On the name, again.** The per-item line function has the same question, in miniature: is
it `formatItemLine` or `renderItemLine`? An `OrderItem` is a small domain object, not a bare
value like a duration or a price, so by the convention table it is `render*`. I went back
and forth on this one — a two-field record feels closer to "a value" than "a piece of the
domain" — and settled on `renderItemLine` for consistency with `renderReceipt`: both take a
domain type and return output lines; only `formatCents` takes a primitive. I would not fight
hard for this if a reviewer preferred `formatItemLine`; it is the one naming call in this
drill I would call genuinely 55/45.

**On the name, once more.** The subtotal helper stayed `subtotal`, a noun phrase answering
"how much do the items add up to before the credit" — Question 2's test (could this be the
name of something else in the file?) is easy to pass here, since there is exactly one
subtotal in this module. I rejected `sum`, which fails that same question — a `sum` could
belong to any reduction anywhere — and `calculateSubtotal`, which fails Question 1 by naming
the mechanism (`calculate`) instead of the result.

## What it cost

Two things.

First, the thing I am least sure about: bundling a one-line bug fix into this drill's route
at all. The clean argument for it is in "Why this order" above — you cannot safely do the
move without it. The argument against it is that a reader who came here to practice Move
Statements into Function did not sign up to also practice spotting an off-by-a-guard-clause
bug, and a drill that quietly requires two skills is a worse drill than one that requires
one. I decided the precondition check *is* the skill this drill teaches — the mechanical
move itself is three lines of cut-and-paste — but I would not be surprised if a second
author split this into two drills instead: one where every caller already agrees, and one
that is entirely about the discovery.

Second: no test in this file uses an order where the credit exceeds the subtotal. I could
have added one, run it against `src/`, watched it fail on `reprintReceipt`'s pre-fix
behaviour, and used that as the "safety net catches it" moment. I chose not to, because
doing so would have handed the reader the answer before they had read the three call sites
themselves — the whole point of "floors the total at exactly zero when the credit exactly
covers the subtotal" (the boundary test that *is* here) is to get the reader close enough to
the edge to notice, without crossing it for them. A reviewer could reasonably want the
stronger test added once the drill has been solved once, as a permanent regression guard.

## If you took a different route

- **The override-parameter migration** described in Step 2, for a version of this codebase
  with more than three callers. Fully defensible, more steps, same destination.
- **Deciding the majority is wrong instead of the minority.** Two callers floor, one does
  not — I assumed the two are right and the one is a bug. Reading it the other way (drop the
  floor everywhere, on the theory that a negative total is informative to whoever reads it)
  is not something I would defend for a customer-facing receipt, but it is a coherent
  reading of the same three call sites, and the walkthrough should say so rather than
  pretend the majority automatically wins.
- **Giving `renderReceipt` a `floor: boolean` parameter** instead of resolving the
  disagreement. I did not do this, and this is the one thing here that is not a matter of
  taste: if `reprintReceipt` genuinely needed a total that other callers do not want, the
  two statements were never fully shared behaviour to begin with, and folding them into one
  function with a flag to tell them apart is the wrong direction entirely. See below.

## The sibling: when the code wants to go the other way

This drill's precondition held once the bug was fixed — all three callers wanted the exact
same total. `drill-08-04`, *Move
Statements to Callers*, is what you reach for when they do not: a shared function doing
something that only some of its callers actually want, so the statements belong back out at
the call sites, not further in.

The signal that tells them apart is not "how many lines differ" — it is what fixing the
difference would cost. Here, fixing it cost one word, `Math.max`, and nothing about
`renderReceipt`'s shape had to change to accommodate it. If instead the honest fix had been
"give `renderReceipt` a parameter so `reprintReceipt` can skip the floor, because reprints
are legitimately allowed to show a negative balance as a paperwork trail" — a parameter that
exists to let one caller opt out of behaviour the others want — that is the tell. A shared
function that needs a flag to keep one caller happy is not really shared; it is two
functions wearing one name, and the fix is to split the statements back out to callers, not
to add the flag. Move Statements into Function wants every caller to agree already, or to be
made to agree with a change that costs nothing to the function's shape. Move Statements to
Callers is what you reach for once you notice a caller does not actually want to agree.

## Where TypeScript changes this from the book

Fowler's version of this refactoring is agnostic about what breaks if a caller's copy of
the statements does not match. Here, the compiler enforces one part of the safety
automatically and leaves the rest to the reader. Dropping `renderReceipt`'s `totalCents`
parameter meant TypeScript refused to compile until every call site stopped passing a
second argument — you cannot forget a caller, because the build will not let you. What it
did not catch is the thing that mattered most: that the value each caller *used to* compute
locally was the same value `renderReceipt` now computes internally. Two expressions can be
perfectly well-typed, `number` in and `number` out, and still disagree — the type checker
has no opinion on `Math.max(0, x)` versus `x`. That check was, as in the book, still a
manual read of three call sites side by side.
