# Walkthrough — one `Date` in, no day-count ceremony

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost,
and where the opposite direction — [drill-11-06](../../../06-replace-query-with-parameter/README.en.md)
— is the one that's actually right. Read it after you have your own version, not before.

---

## What every caller was doing

```ts
export function refundAmountCents(booking: Booking, daysUntilShow: number): number {
  if (daysUntilShow >= FULL_REFUND_CUTOFF_DAYS) return booking.seatPriceCents;
  if (daysUntilShow >= PARTIAL_REFUND_CUTOFF_DAYS) return Math.round(booking.seatPriceCents / 2);
  return 0;
}
```

Nothing is wrong with this function on its own — it is short, it has one job, and its cutoffs
are named constants. The smell is not in `refund.ts`, it is in `callers.ts`, three times over:

```ts
const daysUntilShow = daysBetween(cancelledAt, booking.showDate);
return refundAmountCents(booking, daysUntilShow);
```

`refundForSelfServiceCancellation`, `refundForSupportDeskCancellation`, and
`refundForBulkCancellation` all write this exact pair of lines. Every one of them already
has both of the values `daysBetween` needs — the booking, which carries `showDate`, and
`cancelledAt`, which each caller was handed as its own parameter for an unrelated reason
(recording *when* the cancellation happened). `daysUntilShow` is not a fact any caller
knows that `refundAmountCents` couldn't work out for itself from data it could just as
well receive directly. That is the parameter this refactoring removes: not because long
parameter lists are bad in the abstract, but because this one parameter is pure ceremony —
three copies of the same derivation, standing between the caller and a function that could
do the deriving itself.

## Why this order

Change `refundAmountCents`'s signature directly, in place, and all three callers break at
once — the compiler will point at all three, but a suite gone red for three different
reasons at the same moment is a suite that isn't telling you anything about *which* caller
you got wrong if the internal day-count math has a bug. So this walkthrough does the same
expand-and-contract migration as drill-11-01: add the new shape next to the old one,
prove it delegates correctly, then move exactly one caller per commit. If step 2 breaks
something, you know it's `refundForSelfServiceCancellation`'s move and nothing else's.

Step 1 is deliberately boring: `refundAmountCentsAt` does nothing but compute
`daysUntilShow` and hand it to the existing function. It cannot change what any caller
gets back, because no caller uses it yet.

## Step 1 — the day count computed once, inside

```ts
// after step 1
export function refundAmountCentsAt(booking: Booking, cancelledAt: Date): number {
  return refundAmountCents(booking, daysBetween(cancelledAt, booking.showDate));
}
```

**On the name.** `refundAmountCentsAt`, not `refundAmountCentsForCancellation` or
`refundAmountCents2`. This name is not meant to survive — it exists for the five commits
between step 1 and step 5, when both the day-count version and the moment-based version
are live at once, and it needs to be unambiguous during that window without being
beautiful. Question 4 from [`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? —
is exactly why `refundAmountCents2` was rejected even as scaffolding: a number suffix says
nothing about what changed, and a future reader mid-migration deserves better than a name
that only makes sense with the diff open. `refundAmountCentsAt` at least says "given a
moment," which is true for exactly as long as the name exists.

## Steps 2–4 — one caller, one commit

```ts
// refundForSelfServiceCancellation, before
const daysUntilShow = daysBetween(cancelledAt, booking.showDate);
return refundAmountCents(booking, daysUntilShow);

// after
return refundAmountCentsAt(booking, cancelledAt);
```

Each of the three moves is the same edit, and each is safe for the same reason: from step 1
onward, `refundAmountCentsAt(booking, cancelledAt)` computes the identical `daysUntilShow`
the caller used to compute by hand, then calls the identical `refundAmountCents`. Replacing
two lines with one does not change a single value that flows out of any of these
functions — it only changes who's responsible for the arithmetic in the middle.

`refundForBulkCancellation` gets the same treatment inside its `.map`:

```ts
return bookings.map((booking) => refundAmountCentsAt(booking, cancelledAt));
```

This is the step the empty-batch and per-booking tests exist for. It would be easy, moving
a `.map` body around, to accidentally close over the wrong booking or hoist the day-count
computation outside the loop where it would use the same show date for every booking in the
batch. Nothing about *this* particular move introduces that bug, but it is exactly the
shape of bug a plausible rewrite of this line could introduce, which is why the test pins it
rather than trusting the diff to look right.

## Step 5 — where the behaviour actually lives now

```ts
// after step 5
export function refundAmountCents(booking: Booking, cancelledAt: Date): number {
  const daysUntilShow = daysBetween(cancelledAt, booking.showDate);
  if (daysUntilShow >= FULL_REFUND_CUTOFF_DAYS) return booking.seatPriceCents;
  if (daysUntilShow >= PARTIAL_REFUND_CUTOFF_DAYS) return Math.round(booking.seatPriceCents / 2);
  return 0;
}
```

Once every caller goes through `refundAmountCentsAt`, the original `refundAmountCents(booking,
daysUntilShow: number)` has exactly one caller left: `refundAmountCentsAt` itself. Inlining
one into the other and reusing the name `refundAmountCents` for the survivor is not a
separate idea from steps 1–4 — it is the same migration, finished. The scaffolding name earned
its keep for four commits and then handed the good name back.

**On the name.** `cancelledAt`, not `refundedAt` or `requestedAt`. Question 1 — what, not
how — rules out anything describing the refund process itself, since this parameter is the
timestamp of the *cancellation*, and the refund amount is a consequence computed from it,
not the other way around. Question 4 — is it true — rules out `requestedAt`: a support
agent might process the cancellation minutes after a customer called, and it is the call,
not the paperwork, that should freeze the day count. `cancelledAt` is true to the one
moment every caller actually means.

## Step 6 — un-exporting what nothing outside needs

```ts
// refund.ts, before
export function daysBetween(from: Date, to: Date): number { ... }

// after
function daysBetween(from: Date, to: Date): number { ... }
```

Before step 2, three callers imported `daysBetween` directly. After step 4, none do — the
last caller of the exported version was the code this walkthrough just deleted. Dropping
the `export` keyword is not a cosmetic step: it is the compiler-checked proof that the
ceremony this refactoring targets is actually gone, not just unused. If some fourth caller
this drill doesn't show still needed a day count for something unrelated to refunds, this
step would fail to compile, and that failure would be the correct signal to stop and think,
not a step to force through.

**On the name.** `daysBetween` stays generic rather than becoming `daysUntilShow` even
though the latter reads better at its one remaining call site. Question 2 — could it be
the name of something else in this file — cuts the other way here: `daysBetween(from, to)`
is a plain date-arithmetic helper with no opinion about shows or refunds, and a second
caller with a different "until" (say, a loyalty-tier renewal date) could reuse it as-is.
Renaming it to `daysUntilShow` would make it read better once and worse the next time this
file grows a second reason to measure days between two dates. This is the one naming call
in this drill I'd happily see reviewed the other way — `daysBetween` is not a strong name
on its own, it's a deliberately unambitious one.

## What it cost

The parameter list got shorter, and three call sites lost two lines each. That's the whole
benefit, and it's real, but it's smaller than it might look, because the cost sits somewhere
the diff doesn't show: **a caller that wanted to hand `refundAmountCents` a day count the
calendar disagrees with no longer can.** Before this refactoring, a manager issuing a
goodwill refund for a customer who called four days late through no fault of their own
could call `refundAmountCents(booking, 14)` and get the full-refund path, regardless of what
`cancelledAt` actually was. After, that override is gone — the only day count the function
will ever compute is the true one, derived from the booking's show date and whatever moment
you hand it. If that override was ever a real requirement, this refactoring is the wrong
move until there's a different, explicit way to express "treat this as if it were 14 days
out" — probably a distinct function, not a back door in this one.

The same trade shows up in the tests. Before, pinning the exact cutoff at 14 days was
`refundAmountCents(booking, 14)` — an integer, no calendar involved. After, every boundary
test in this suite has to build real `Date` objects and reason about a millisecond
subtraction to land exactly on a day boundary. `daysBeforeShow` exists in the test file
for exactly this reason, and I am not fully confident it's the right shape — an
integration test that constructs real dates is arguably testing `daysBetween`'s arithmetic
a second time, inside every test that's nominally about refund cutoffs. A reviewer who
split "does `daysBetween` compute correctly" into its own tiny suite and let the cutoff
tests use a fake clock instead would not be wrong; I kept it this way because
`daysBetween` is private now, and testing a private helper by giving it its own spec felt
like more ceremony than the function warrants.

## If you took a different route

- **An optional third parameter** — `refundAmountCents(booking, cancelledAt, daysUntilShowOverride?)`
  — that falls back to computing the day count when omitted. I considered and rejected
  this: it looks like it gets both worlds, but a reader at any call site now has to check
  whether the third argument is present to know which value actually drove the result, and
  that ambiguity is worse than either pure version. This is the shape Fowler's own writeup
  warns against, and it earns the warning.
- **Keeping `daysBetween` exported "just in case."** Defensible if this module were likely
  to grow more date arithmetic soon. I un-exported it because nothing in this drill's scope
  needs it, and a private helper is one line away from public again the day something does.

What is *not* a matter of taste: leaving a caller to compute `daysUntilShow` by hand once
`refundAmountCentsAt` exists to do it for them, or shipping the migration with both
`refundAmountCents` signatures still live and undocumented. The scaffolding name is meant to
be temporary, and step 5 is not optional.

## Where TypeScript changes this from the book

Every one of Fowler's own Replace Parameter with Query examples is in JavaScript, where
`refundAmountCents(booking, 14)` and `refundAmountCents(booking, someDate)` would both type-check
against the same untyped parameter until the wrong one crashed a comparison at runtime.
Here, `daysUntilShow: number` and `cancelledAt: Date` are structurally incompatible, so the
compiler refused every caller this walkthrough hadn't migrated yet the moment
`refundAmountCentsAt` existed and a caller tried to pass the wrong shape — there was no way
to half-finish step 2 by accident and have it silently compile. That is also why the
migration needed a second name at all: TypeScript has no function overloading by parameter
count alone across two functions with the same name, so `refundAmountCents(booking,
daysUntilShow)` and the moment-based version could not coexist under one identifier the way
two overloaded signatures might in a language that supports that directly. The scaffolding
name in step 1 is doing work a JavaScript version of this same migration would not have
needed a name for.
