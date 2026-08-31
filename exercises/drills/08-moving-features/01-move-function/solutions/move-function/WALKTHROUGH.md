# Walkthrough — delivery distance moves in with the route

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: count what the function touches

Before moving anything, list two columns: which fields of `Order` does
`deliveryDistanceKm` read, and which fields of `Route`? Not call sites, not lines of code —
fields.

- **`Order`:** `customerId`. One.
- **`Route`:** `stops`, `returnLegKm`, `loopsBackToDepot`. Three.

Three votes for `route.ts`, one for `order.ts`. That is about as lopsided as this gets, and
it is exactly what **Feature Envy** names: a function that is proportionally more
interested in another module's data than its own belongs with the data it is interested
in, not with the data that happens to be its first parameter's type. `order.ts` even pays
for this in its import list before you change a line — it has to `import type { Route }`
just to give the function's second parameter a type, which is a smell in its own right.
A module that has to import another module's type to describe what its own function needs
is usually hosting a function that isn't really its own.

**What do you do when the count comes back even** — two fields of each? The count alone
will not decide it, and pretending it does is how an exercise ends up with two defensible
answers, which the contributing rules here call a kata, not a drill. When it is a genuine
2-2 tie, ask a second question the field count cannot answer: which side changes more
often, and which side's callers are already holding the object they'd want this logic
next to? A function reading two `Route` fields and two `Order` fields, called only from
code that already has a `Route` in hand and reaches for the `Order` second, belongs with
the caller's habits, not the raw tally. If neither question breaks the tie, that is data
too — it usually means the function is doing two things wearing one name, and the move you
actually want is *Extract Function* first, so each half gets its own honest count.

## The pivot: what `index.ts` is doing for you

This is the first drill in the repository where a refactoring moves code **between
files**. Every earlier drill in chapters 6 and 7 shuffled code around inside a single
module; this one changes which file `deliveryDistanceKm` is *defined in*, and the reason
`tests/delivery-distance.spec.ts` never notices is `index.ts`.

The test file imports exactly one thing from this exercise:
`import { deliveryDistanceKm, type Order, type Route } from "@exercise"`. The `@exercise`
alias in `tsconfig.json` points at `src/index.ts` (or, under `SOLUTIONS=1`, at
`solutions/move-function/index.ts`) and nowhere else — the test has no idea `order.ts` or
`route.ts` exist. `index.ts` is a re-export list, not a module with logic of its own, and
that is deliberate: it is the public boundary the brief describes, and everything on the
far side of it is free to move.

Step 3 is the entire trick. One line changes:

```diff
-export { deliveryDistanceKm } from "./order";
+export { deliveryDistanceKm } from "./route";
```

and every test that was green a moment before is green after, because nothing they import
changed — only what it resolves to underneath. If this drill did not freeze the public
surface — see the chapter 11 drills, where `apiFrozen: false` and the tests exercise
callers instead of a fixed export list — you would not get this for free: you would have to
find every caller and repoint each one yourself. A frozen boundary is what turns "move this
function" from a repository-wide search-and-replace into a one-line edit at the seam.

## Why this order

Copy first, delete second, never the reverse — and never both in one step. If you delete
`deliveryDistanceKm` from `order.ts` before `route.ts`'s copy exists and is wired through
`index.ts`, every test fails at once, and the failure tells you nothing about which part of
the move went wrong: is the new copy broken, or did you forget to repoint the export? Two
working copies for one commit, mid-move, is not untidiness — it is what keeps step 3 a
one-line, low-risk change instead of a leap of faith.

## Step 1 — copy, don't cut

```ts
// route.ts, appended, unchanged from order.ts
import type { Order } from "./order";

export function deliveryDistanceKm(order: Order, route: Route): number {
  const index = route.stops.findIndex((stop) => stop.customerId === order.customerId);
  const distanceToStop = route.stops
    .slice(0, index + 1)
    .reduce((total, stop) => total + stop.legDistanceKm, 0);
  const isLastStop = index === route.stops.length - 1;
  return route.loopsBackToDepot && isLastStop
    ? distanceToStop + route.returnLegKm
    : distanceToStop;
}
```

Nothing calls this copy yet — `index.ts` still points at `order.ts` — so the suite is green
for a reason that has nothing to do with the new code being correct. That is fine. This
step is plumbing, not proof.

**On the name.** I kept `deliveryDistanceKm` unchanged across the move, on purpose. It
would be tempting to rename it here — you are already touching every line — but that
conflates two refactorings in one commit, and if something breaks you would not know
whether the move or the rename caused it. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — still says yes:
this is still a delivery distance, in kilometres, computed for one order. I did reject
`routeDistanceKm` as an alternative while drafting: inside a file already named `route.ts`,
a caller reading `route.deliveryDistanceKm` — or, once step 4 lands, a neighbour like
`stopIndexFor` — would see "route" twice, once from the module and once from the name. The
same stutter the `contactLine`/`preferredLine` example in `drill-07-05`'s walkthrough
describes. `deliveryDistanceKm` says what the caller gets without repeating where it lives.

## Step 2 — the delegation

```ts
// order.ts
import { deliveryDistanceKm as routeDeliveryDistanceKm } from "./route";
import type { Route } from "./route";

export function deliveryDistanceKm(order: Order, route: Route): number {
  return routeDeliveryDistanceKm(order, route);
}
```

This is the step people are tempted to skip straight past — go from "two copies" to "one
copy, re-exported" in a single commit. Don't. `order.ts`'s function still has its full body
one step ago; now it has none. If a caller somewhere reached `order.ts`'s
`deliveryDistanceKm` directly instead of through `index.ts` — nothing in this exercise
does, but a real codebase might — this is the commit where you would find out, because the
delegation still exists to catch that call and hand it to the new implementation. Deleting
the old body without first proving that everything still routes through it is the
un-recoverable version of this step.

## Step 3 — the pivot

```diff
- export { deliveryDistanceKm } from "./order";
+ export { deliveryDistanceKm } from "./route";
```

and, in the same commit, delete the delegation and its two imports from `order.ts`:

```diff
- import { deliveryDistanceKm as routeDeliveryDistanceKm } from "./route";
- import type { Route } from "./route";
-
- export function deliveryDistanceKm(order: Order, route: Route): number {
-   return routeDeliveryDistanceKm(order, route);
- }
```

These two edits are grouped in one commit, not two, because splitting them would leave a
moment where either nothing exports `deliveryDistanceKm` (if the delegation goes first) or
two things do (if the re-export goes first) — and the second of those is a duplicate-export
compile error, not a soft warning. Grouped, the diff reads as one sentence: "the delivery
distance calculation now lives in `route.ts`."

**On the name.** No renaming happened here, but a shape decision did: I deleted
`order.ts`'s `Route` import along with the delegation rather than leaving it in case
something else in `order.ts` might want it later. Question 4 again — a type import that
names a dependency the module does not have is a small lie about what `order.ts` actually
needs, the same reasoning `drill-07-05`'s walkthrough applies to a constructor argument.
Speculative imports are speculative generality with worse tooling support: nothing flags
them as dead until the day someone tries to use the type and finds it was never really
wired to anything.

## Step 4 — naming what was inline

```ts
function stopIndexFor(route: Route, customerId: string): number {
  return route.stops.findIndex((stop) => stop.customerId === customerId);
}

function addsReturnLeg(route: Route, index: number): boolean {
  return route.loopsBackToDepot && index === route.stops.length - 1;
}
```

Nothing about *Move Function* requires this step — the moved function was eight lines and
well inside the strict profile's 12-line cap before this split. I did it anyway, because
now that the function lives beside `Route` and `Stop`, it can share a home with helpers
that name pieces of the calculation instead of leaving them as anonymous expressions in a
ternary. This is the same thing `drill-06-01`'s README says explicitly about *Extract
Function*: "you will need it in a couple of places... that is normal, the catalog entries
are moves, not chapters." A refactoring rarely arrives alone.

**On the name.** I rejected `isFinalStop(route, index)` for the second helper — the name
that comes to mind first. Question 4: is it true? Being the final stop is necessary but not
sufficient; a final stop on a route with `loopsBackToDepot: false` does not add a return
leg, so `isFinalStop` would overpromise what the boolean actually decides. `addsReturnLeg`
names the thing the caller uses it for, not a fact about the stop's position that the
caller would then have to combine with `route.loopsBackToDepot` again anyway. Question 3 —
does it read at the call site? — is what confirms it:
`addsReturnLeg(route, index) ? distanceToStop + route.returnLegKm : distanceToStop` reads
as a sentence; `isFinalStop(route, index) && route.loopsBackToDepot ? ... ` reads as an
explanation.

I also considered `findStopIndex` for the first helper and rejected it — question 1, "find"
names the mechanism (a linear search), not the result. `stopIndexFor(route, customerId)`
survives a swap to a `Map` lookup later without becoming a lie.

## What it cost

The honest part. Two things:

- **`order.ts` loses a calculation that is, by convention in a lot of codebases, exactly
  the kind of thing that gets attached to the "owning" record.** Someone who has worked in
  this codebase for a year and remembers "delivery distance lives on the order" will look
  in the wrong file first. That cost does not go away because the move was correct — it is
  the price of correctness disagreeing with habit, and the fix is a changelog entry or a
  short-lived redirect comment, not skipping the move.
- **The parameter order.** Unfrozen, I would flip the signature to
  `deliveryDistanceKm(route: Route, order: Order)` once it lives in `route.ts` — the
  primary subject reads first. I could not: the tests call `deliveryDistanceKm(order, route)`
  directly, `apiFrozen` is `true` for this drill, and reordering the arguments would be an
  API change disguised as a Move Function. So the function now lives in the module least
  represented in its own parameter list, and that reads slightly off every time I open the
  file. I do not see a better option inside this drill's constraints, but I would not fault
  a reviewer who called it out.

## If you took a different route

- **Passing `order.customerId` instead of the whole `order` object.** Genuinely
  defensible, and arguably the better long-term seam — `route.ts` would then depend on a
  `string`, not on `Order`'s shape, and its `import type { Order }` would disappear
  entirely. I kept the full `order` parameter because the frozen public signature is
  `deliveryDistanceKm(order: Order, route: Route)`, and narrowing it would be a second
  refactoring riding on top of this one. Worth doing once the API is allowed to move.
- **Skipping step 4.** Also fine. The un-extracted eight-line version passes the strict
  profile with room to spare, and "leave it as one function" is a legitimate call for code
  this short. I would not insist on the split for a function this size in a real codebase;
  I kept it here mainly because the two rejected names in step 4 were worth walking
  through.
- **Making `Route` a class with `deliveryDistanceKm` as a method, `route.distanceTo(order)`.**
  The more thorough version of this move. I did not take it because every module in this
  repository up to chapter 8 models data as plain interfaces, and introducing a class here
  would mix "moving a function" with "introducing a class" in one drill — the second half
  of that move is what `drill-07-05` already teaches on its own terms.

What is *not* a matter of taste: leaving `order.ts` importing `Route` after the function
that needed it is gone, or leaving two live copies of `deliveryDistanceKm` past a single
commit. Either one is a move that was started and not finished.

## Where TypeScript changes this from the book

Fowler's *Move Function* is written against JavaScript, where "does anything still need
this import" is a question you answer by reading the file, because nothing else will tell
you. Here, `tsconfig.base.json` sets `verbatimModuleSyntax`, which forced a decision at
every import in this move: is `Route` used as a *type* (parameter and return annotations)
or as a *value* (something actually called or constructed)? `order.ts`'s delegation in step
2 needed both — `import type { Route }` for the parameter, plus a value import of
`deliveryDistanceKm` itself from `route.ts` — and TypeScript would not let me blur the two
into one `import { ... }` line the way plain JavaScript happily would.

That distinction paid for itself at step 3. Deleting the delegation and asking "does
`order.ts` still need anything from `route.ts`?" was not a question I had to answer by
re-reading the file — `noUnusedLocals` in the base config answers it for you. Remove the
function, forget to remove `import type { Route }`, and `tsc --noEmit` fails immediately,
naming the exact line. The book's mechanics list "remove the source function" as a step you
perform and then verify by running the tests; here the compiler checks a strictly narrower
but immediate thing — whether every import you kept is still load-bearing — before the
tests even get a chance to.
