# Walkthrough — a reserve count every caller states, not sets

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost,
and where the opposite direction — [drill-11-05](../../../05-replace-parameter-with-query/README.en.md)
— is the one that's actually right. Read it after you have your own version, not before.

---

## What `sectionHasAvailability` was reaching for

```ts
let reservedSeatCount = 0;

export function setReservedSeatCount(count: number): void {
  reservedSeatCount = count;
}

export function sectionHasAvailability(show: Show, section: string): boolean {
  return openSeatCount(show, section) > reservedSeatCount;
}
```

The Halliday Box Office holds a handful of seats back from public sale in every section —
comps, staff, last-minute VIP requests. `sectionHasAvailability` answers "is there anything
left to offer," but "left after what's held back" depends on *who's asking*: the public
booking page should say no once only the held-back seats remain, but the internal
box-office screen — where staff actually book those seats — should say yes right up until
the section is truly empty. One function, two audiences, one number that has to be
different for each.

The module's answer was a setter: call `setReservedSeatCount` with the audience's number,
then call `sectionHasAvailability`, and trust that nothing ran in between. Two of the three
callers do exactly that:

```ts
export function publicSectionHasAvailability(show: Show, section: string): boolean {
  setReservedSeatCount(PUBLIC_STAFF_HOLD);
  return sectionHasAvailability(show, section);
}
```

This is **Global Data**: `reservedSeatCount` is mutable, shared across every caller in the
module, and correct only as long as everyone calls the setter immediately before they call
the query and nobody else's code runs in between. The third caller,
`sectionAvailabilitySummary`, is where that assumption stops being free:

```ts
export function sectionAvailabilitySummary(show: Show, section: string): AvailabilitySummary {
  setReservedSeatCount(PUBLIC_STAFF_HOLD);
  const publicAvailability = sectionHasAvailability(show, section);
  setReservedSeatCount(NO_STAFF_HOLD);
  const staffAvailability = sectionHasAvailability(show, section);
  return { publicAvailability, staffAvailability };
}
```

To get *both* answers, this function has to set the module variable, read it, set it again,
and read it again — a four-line dance to compute two independent facts, with the module's
shared state doing double duty as the only channel either half of the answer travels
through. Swap the two `setReservedSeatCount` calls, or add an `await` between them once this
code talks to a real datastore, and the two halves of the summary can no longer be trusted
to reflect the reserve count they were each supposed to see.

## Why this order

Adding the parameter with a fallback default in step 1, rather than requiring it
immediately, means every existing call site still compiles the moment the signature
changes — nobody is forced to decide what to pass on day one. That turns "change the
function's shape" and "migrate every caller" into two separate risks, the same expand-and-
contract shape drill-11-01 and drill-11-05 both use for a signature change. Steps 2–4 then
move one caller at a time, in an order that doesn't matter, because none of them can
change what any *other* caller sees — only step 5, deleting the fallback and the module
variable it fell back to, actually removes something, and it's safe by then because
nothing is still leaning on it.

## Step 1 — the parameter, with a way out

```ts
// after step 1
export function sectionHasAvailability(
  show: Show,
  section: string,
  reservedSeatCount: number = getReservedSeatCount(),
): boolean {
  return openSeatCount(show, section) > reservedSeatCount;
}
```

**On the name.** `reservedSeatCount`, not `reserve` or `holdback`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — what, not how — and the unit-bearing
convention in this repository's naming table (`paceSecondsPerKm`, not `pace`) both point
the same way: this is a count of seats, and a caller reading `sectionHasAvailability(show,
"Stalls", 2)` at a call site should be able to tell that from the argument's name without
opening the function. `holdback` reads as a verb pretending to be a noun; `reserve` on its
own could mean a count, a boolean, or an object elsewhere in a bigger version of this
module — question 2 rules it out for the same reason `findSeat` lost to
`nextAvailableSeat` in drill-11-01.

At this step, the parameter is optional and falls back to the module variable, so nothing
observable has moved yet — every caller that doesn't pass a third argument gets exactly the
behaviour it always had.

## Steps 2–4 — one caller, one commit

```ts
// publicSectionHasAvailability, before
setReservedSeatCount(PUBLIC_STAFF_HOLD);
return sectionHasAvailability(show, section);

// after
return sectionHasAvailability(show, section, PUBLIC_STAFF_HOLD);
```

This step is safe because, from step 1 onward, passing `PUBLIC_STAFF_HOLD` explicitly and
setting the module variable to the same value produce the identical comparison inside
`sectionHasAvailability` — the function can't tell the two apart. `staffSectionHasAvailability`
gets the same treatment in step 3.

Step 4, on `sectionAvailabilitySummary`, is the one where the *shape* of the caller
actually improves, not just its plumbing:

```ts
// after step 4
export function sectionAvailabilitySummary(show: Show, section: string): AvailabilitySummary {
  return {
    publicAvailability: sectionHasAvailability(show, section, PUBLIC_STAFF_HOLD),
    staffAvailability: sectionHasAvailability(show, section, NO_STAFF_HOLD),
  };
}
```

**On the name.** `sectionAvailabilitySummary` over `checkBothAvailabilities` or
`getAvailability`. Question 3 — does it read at the call site — is why `getAvailability`
loses: a caller reading `getAvailability(show, section)` cannot tell from the name alone
that it gets *two* answers back, one per audience, and would have to open the return type
to find out. `checkBothAvailabilities` is honest about the count but names the mechanism
("check... both") rather than what the result *is* — question 1 again. `sectionAvailabilitySummary`
is a noun phrase for a thing that answers a question, matching this repository's
convention for `sortedFinishers`-shaped names, and it survives a future third audience
being added to the object without becoming a lie the way `checkBothAvailabilities` would.

The two calls inside no longer share any state — there's no `setReservedSeatCount` between
them, no order dependency, and nothing stopping a future version of this function from
running the two checks concurrently against a real datastore, which the four-line dance it
replaced could never safely do.

## Step 5 — deleting the door back to global state

```ts
// before
let reservedSeatCount = 0;

export function setReservedSeatCount(count: number): void {
  reservedSeatCount = count;
}

export function sectionHasAvailability(
  show: Show,
  section: string,
  reservedSeatCount: number = getReservedSeatCount(),
): boolean { ... }

// after
export function sectionHasAvailability(
  show: Show,
  section: string,
  reservedSeatCount: number,
): boolean { ... }
```

Once step 4 lands, nothing calls `setReservedSeatCount` and nothing relies on the default
parameter falling back to the module variable. Deleting both is the step that makes the
fix real rather than merely available: as long as the fallback exists, a fourth caller
written carelessly tomorrow could still call `sectionHasAvailability(show, section)` with
two arguments, silently pick up whatever the module variable happens to be set to at that
moment, and reintroduce the exact bug this refactoring removes. A required third parameter
is the only version of this fix the compiler will actually enforce.

**On the name.** This step also removes `getReservedSeatCount`, the small accessor step 1
needed to read the module variable as a default-parameter expression. It was never a name
worth debating — it existed for four commits, its only caller was a default-parameter
initializer, and it left with the state it was reading. Not every name in a migration earns
a paragraph; some are scaffolding the same way `refundAmountCentsAt` is in drill-11-05, and
the honest thing to say about them is that they were meant to be temporary and were.

## What it cost

Two callers that used to be one line shorter each now spell out a number that used to be
implicit. That's real, but it's a small tax weighed against what it buys: before this
refactoring, there was no way to compute `sectionAvailabilitySummary`'s two halves without
a moment in the middle where the module's shared state belonged to neither audience. After,
the two halves are two ordinary function calls with no relationship to each other at all,
which is what they always should have been.

The honest cost is a different one: **a caller with no opinion on the reserve now has to
invent one.** If this module grows a fourth caller tomorrow — say, an internal sanity check
that just wants "does this section exist and have any seats in it, reserve or not" — it has
to write `sectionHasAvailability(show, section, 0)` and trust that `0` reads clearly enough
as "no reserve" rather than "the staff view's reserve, which happens to also be zero."
Before this refactoring, that caller could have called `sectionHasAvailability(show,
section)` and picked up whatever the box office's current policy was, for better or worse.
I don't think that's a strong enough reason to keep the global — the two real callers this
drills ships need different, specific numbers, not "whatever's currently set" — but a
reviewer who wanted a named constant like `NO_RESERVE = 0` exported alongside the function,
so that hypothetical fourth caller has something more honest to write than a bare `0`,
would be improving on this solution, not correcting it.

## The case this drill is *not* an example of

Reaching into shared state isn't always wrong, and pretending otherwise would make this
drill's argument weaker, not stronger. A per-request currency-formatting locale, set once
when a request comes in and read by every formatting call downstream for the rest of that
request, is shared state too — and threading a `locale` parameter through every single
formatting call in a large codebase, when every one of them wants the same value for the
duration of one request, is exactly the kind of ceremony drill-11-05 exists to remove.

What makes `reservedSeatCount` different is that this module's callers **do not agree** —
`publicSectionHasAvailability` and `staffSectionHasAvailability` want different values *at
the same time*, not the same value read at two different times. A per-request value read
consistently by everyone downstream is a legitimate use of shared, scoped state; a value
two callers need to disagree about simultaneously is not a value that belongs in shared
state at all, no matter how it's scoped. That's the question worth asking before reaching
for either refactoring: not "is this global," but "does every caller that reads it actually
want the same answer."

## If you took a different route

- **A `getReservedSeatCount()`/`setReservedSeatCount()` pair scoped per section** instead of
  one flat module variable. This would have fixed `sectionAvailabilitySummary`'s specific
  problem (one section's two audiences no longer share a slot) while leaving the underlying
  smell — a caller has to mutate shared state before it can get an answer — fully intact
  for the next caller that needs a third kind of reserve. Scoping the global more finely is
  not the same fix as removing it.
- **Passing a whole `AvailabilityPolicy` object instead of a bare number.** Reasonable if
  this module were likely to grow more per-audience settings than just a seat count
  (a minimum party size, a blackout list). For exactly one number, that's Preserve Whole
  Object solving a problem this module doesn't have yet — see drill-11-04 for where that
  refactoring earns its keep instead.

What is *not* a matter of taste: leaving `setReservedSeatCount` callable after
`sectionAvailabilitySummary` no longer needs it, or keeping the default-parameter fallback
around "just in case." Either one leaves the door back to the original bug standing open.

## Where TypeScript changes this from the book

Fowler's own writeup of this refactoring works in a language where a parameter either has a
default or it doesn't, and nothing stops a caller from omitting it by accident. Step 1's
`reservedSeatCount: number = getReservedSeatCount()` is doing real work here that a plain
JavaScript version would do identically — TypeScript's default parameters are a runtime
feature, not a type-level one — but step 5's payoff *is* type-level: once the default is
gone and `reservedSeatCount: number` is required, the compiler rejects every two-argument
call site immediately, everywhere in the project, not just the ones this drill's tests
happen to exercise. A hypothetical fourth caller this walkthrough never wrote, forgetting
to pass a reserve count, fails to compile instead of silently reading whatever the module
variable was last set to — which is exactly the class of bug a required parameter is
supposed to make impossible, made actually impossible instead of merely discouraged.
