# Walkthrough — two named functions, one pushed-up conditional

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost,
and how to tell this apart from the two cases it is easy to confuse it with.

---

## What `book`'s flag is actually a symptom of

```ts
export function book(section: Section, order: Order, isPriority: boolean): Receipt {
  if (isPriority) {
    if (section.availableSeats < order.seatCount) {
      throw new Error(`Not enough seats left in ${section.name} for a priority booking`);
    }
    section.availableSeats -= order.seatCount;
    return { customerName: order.customerName, seatCount: order.seatCount, status: "confirmed" };
  }
  // ...falls back to the standard branch, which waitlists instead of throwing
}
```

A flag argument always means the function does two things and picked one name for both of
them. What the book doesn't spell out, and what this drill exists to make you check, is
that "two things" has two honest fixes, and they are not interchangeable.

**Ask what the branches differ in.** If they differ only in a *value* - the same steps run,
a different number or string ends up in the result - the flag is really data, and the fix
is Parameterize Function: one function, the varying value as a parameter, the way
drill-11-02 merges three near-identical raise functions into one that takes the rise
amount. Splitting that into two functions would be ceremony; you'd have two functions whose
bodies are identical except for one number, which is Duplicated Code with extra steps.
Push it further, past two values into three or four, and the honest fix stops being either
of those - it's a named type covering the real set of things the caller might mean, so
that the compiler can tell you if you handled all of them. Neither of those is what's
happening here.

**Here, the branches disagree about what happens.** The priority branch can throw; the
standard branch never does - it waitlists instead. That's not "the same steps, a different
number." Skipping the throw isn't a value the priority branch declines to write down, it's
a code path the standard branch doesn't have at all. When the two things a flag chooses
between are genuinely two different procedures - different failure behavior, different
side effects, not a shared skeleton with one number swapped - two functions is the answer,
because there is no single skeleton left to parameterize. That's the tell, and it's a tell
you check against the actual branches, not against how the flag reads at the call site:
`isPriority` and `isRestrictedView` (drill-11-02's flag, if it had been made one) can look
identical in isolation. Only the bodies say which is which.

## Why this order

Split each branch out before touching a caller, same mechanic as drill-11-01. Steps 1 and 2
only change how `book` finds its answer - it still runs the same branch it always did, one
level of indirection deeper, and every caller of `book` is unaffected because `book` still
exists and still does the same thing. That converts "give the branch a name" and "change
what runs when a caller calls" into two separate risks, and the first two steps take on
none of the second kind.

Moving a caller before the branches exist as their own functions would mean writing
`bookPriority`'s body for the first time *while* also rewiring `bookAtCounter`, which is
two changes landing in one commit with no way to tell, if something breaks, which one did
it.

## Steps 1–2 — the branches get names

```ts
// after step 1
export function bookPriority(section: Section, order: Order): Receipt {
  if (section.availableSeats < order.seatCount) {
    throw new Error(`Not enough seats left in ${section.name} for a priority booking`);
  }
  section.availableSeats -= order.seatCount;
  return { customerName: order.customerName, seatCount: order.seatCount, status: "confirmed" };
}
```

`book`'s `if (isPriority)` branch now calls this instead of running inline. Run the suite:
still green, because from outside the module `book` behaves exactly as before.

**On the name.** `bookPriority`, not `bookVip` or `bookImmediate`. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) - is it true? - rules out `bookVip`: this
function is called for a large phone order too, and nothing about the box office's actual
customer is VIP-flavored; the trait that matters is that the booking is handled with
priority, not who is asking for it. `bookImmediate` fails question 2 - it could just as
easily name a function that skips validation, or one that bypasses a payment queue.
`Priority` is the word this module already uses for the concept (`isPriority`, the field
being replaced), so keeping it is also the least surprising choice for anyone who read the
old code.

Step 2 does the same for the other branch, calling it `bookStandard`. Still green - `book`
now calls both new functions in the same order it always ran their bodies.

## Steps 3–4 — the literal callers move first

```ts
// bookAtCounter, before
return book(section, order, true);
// after
return bookPriority(section, order);
```

This is safe by construction: `true` never varied at this call site, and `book`'s `true`
branch was already, as of step 1, implemented as "call `bookPriority`." Replacing the
wrapper with a direct call changes nothing about what runs. `bookByMail` gets the same
treatment onto `bookStandard` in step 4.

**On the name.** `bookByMail`, not `bookStandard` a second time or `bookOrderForm`.
Question 3 - does it read at the call site? A caller of this module reads `bookByMail(...)`
and learns which channel is booking, which is the information this function's *own*
callers need; they do not need reminding that it is the standard path, because from outside
this module there is no other path yet to confuse it with. `bookStandard` would have been
true but would have leaked an implementation detail - which booking function it happens to
call today - into a name whose job is to say which channel this is.

## Step 5 — the caller that was never a literal

```ts
// bookByPhone, before
return book(section, order, order.seatCount >= GROUP_PRIORITY_THRESHOLD);
// after
return order.seatCount >= GROUP_PRIORITY_THRESHOLD
  ? bookPriority(section, order)
  : bookStandard(section, order);
```

This is the step the book warns is different from the other two, and it is worth stating
plainly: `bookByPhone`'s argument to `book` was never a literal. It was a computed
condition, evaluated fresh on every call from `order.seatCount`. Splitting `book` into two
functions doesn't remove that condition - it can't, the decision still has to be made
somewhere - it *relocates* it, from inside a function that took a boolean and couldn't tell
a computed value from a hand-typed one, to an `if` sitting in the one place that actually
has the information the decision needs. That relocation is not a compromise forced by the
refactoring; it is the correct outcome. A flag argument computed at the call site was
always secretly an `if`-in-disguise living one frame further down the stack than it needed
to. Moving it up doesn't add a branch to the program - the branch was always there - it
just puts it where the reader can see it without opening `book`'s body.

Contrast this with steps 3 and 4, where nothing was relocated because there was nothing to
relocate: a literal boolean is a decision that was already made, once, by whoever wrote the
call site, and the refactoring only had to state that decision by name.

## Step 6 — deleting what nothing calls

Once step 5 lands, `book` has no callers left in `src/`. TypeScript will not tell you this -
an exported function with zero local call sites still compiles, the same as
drill-11-01's step 6 - so this is established by reading `callers.ts`, not by the compiler.
Delete it, run the suite, still green.

## Step 7 — the duplication `book` was hiding

`bookPriority` and `bookStandard` both end with the same two-line shape: adjust
`availableSeats` or push onto `waitlist`, then build a `Receipt`. That duplication existed
inside `book` too, just harder to see because it was interleaved with the `if`. Extracting
`claimSeats` and `receiptFor` isn't Remove Flag Argument's job - it's a small Extract
Function cleanup that the split made visible. I did it last, after the flag was gone, so
that the diff for step 7 is only about the duplication and not tangled up with the
signature change.

**On the name.** `receiptFor`, not `buildReceipt` or `makeReceipt`. Question 1 - what, not
how - `build` and `make` both describe the act of construction, which is true of every
function that returns an object literal and therefore says nothing distinctive.
`receiptFor(order, status)` reads at both call sites (`receiptFor(order, "confirmed")`,
`receiptFor(order, "waitlisted")`) as "the receipt for this order, at this status," which
is the actual content of what it returns.

## What it cost

Two functions and a shared pair of helpers where there was one function before, plus a
constant (`GROUP_PRIORITY_THRESHOLD`) that now lives in `callers.ts` next to the one caller
that needs it, instead of inside the function that used to receive its result as a boolean.
`bookByPhone` is the honest casualty: it used to hand a computed condition to something else
and forget about it; now it owns an `if`. For one caller that is a fair trade. I would not
want to make the same argument for a tenth caller computing a similar condition and
duplicating `>= GROUP_PRIORITY_THRESHOLD ? bookPriority(...) : bookStandard(...)` ten times
over - at that point the repeated conditional is itself a smell (chapter 3 calls a
conditional repeated across many call sites *Repeated Switches*), and the fix would be to
give that decision its own name, something like `classifyBooking(order): "priority" |
"standard"`, called once per caller. This module has exactly one caller in that position,
so I didn't build it - but I'm not fully sure that's right long-term rather than merely
sufficient today, and it's the judgment call in this drill I'd defend least confidently if
a fourth booking channel showed up next sprint.

## If you took a different route

- **Extracting `bookStandard` before `bookPriority`.** Symmetric to the order shown; no
  real difference either way.
- **Skipping steps 1–2 and rewriting each caller directly against two brand-new
  functions in one commit.** Faster, and for a two-caller module the risk it avoids is
  small. With three callers, and one of them computing its own condition, I'd rather have
  the smaller, individually-revertible commits - but a reviewer who merged steps 1–4 into
  one would not be wrong about the destination.
- **Naming the merged constant's home differently** - `GROUP_PRIORITY_THRESHOLD` could
  live in `booking.ts` next to the types instead of in `callers.ts`. I kept it next to
  `bookByPhone` because nothing else needs it, and a constant that travels with its only
  reader is easier to delete later than one filed under "shared" out of habit.

What is *not* a matter of taste: leaving `bookByPhone` computing a boolean and handing it
to a function that branches on it, or leaving a third function that only differs from
`bookPriority`/`bookStandard` in a value it writes down (there isn't one here, and there
shouldn't be - if you find yourself writing one, you've drifted into Parameterize
Function's territory and should merge, not split).

## Where TypeScript changes this from the book

Fowler's own flag-argument example, in JavaScript, is a function whose boolean silently
picks a formula; nothing stops a caller from passing a number, a string, or `undefined`
where the boolean was expected, and the mistake surfaces however far downstream the value
happens to get used as a condition. `isPriority: boolean` in this module's original
signature at least rules that out - TypeScript already narrows the flag to two values
before you ever split the function.

What TypeScript does *not* rule out, and what motivates this refactoring independently of
naming, is a caller silently reusing the wrong literal: `book(section, order, false)` at a
call site meant to say `true` type-checks perfectly, because `true` and `false` are the
same type. Splitting into `bookPriority(section, order)` and `bookStandard(section, order)`
turns that mistake from a value a reviewer has to notice into an identifier a reviewer has
to misread - `git blame` and a glance at the diff catch a wrong function name far more
often than a wrong boolean sitting third in an argument list. The type system was never
going to save you here; the two functions are what does.
