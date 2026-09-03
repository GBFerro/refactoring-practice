# Walkthrough — two loops, one for each total

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, the objection every reader raises before
they've finished reading the title, and where this leaves you for tomorrow.

---

## Before anything: what does this loop actually owe two different people?

`dayTotals` walks the day's `orders` once and comes out the other side with two numbers:
`revenueCents`, which the volunteer treasurer reconciles against the till, and
`flourGramsUsed`, which the baker reads at 5 a.m. to know how much flour to draw from the
mill order. Nothing about computing one number requires computing the other. They happen
to share a `for` loop only because whoever wrote this noticed they were both "totals over
today's orders" and folded them into one pass.

That's the whole smell. Not that the loop is long — it's four lines — but that it answers
two unrelated questions at once, so a change to either one risks the other. Add a discount
that only affects `revenueCents` and you're editing a function whose name and body both
talk about flour too. **Loops**, chapter 3's name for it: a loop trying to be more than one
thing.

## Why this order

The mechanical move is *Split Loop*, and the book's own version of it is almost comically
small: copy the loop, then delete from each copy whatever it doesn't need. That's steps 1
through 3 here. It would be tempting to skip straight to writing two loops from scratch —
the destination is the same four lines, either way — but "copy, then delete" is the safer
route for exactly the reason it looks unnecessary: deleting a line from something that
already runs and already passes tests is a much smaller risk than retyping the loop body
by hand and hoping you got both fields right. On a loop this short the difference barely
registers. On a real one with five accumulators, it's the difference between a red suite
that points at exactly which copy broke and a red suite that points at nothing.

Steps 4 and 5 — extracting each loop into its own function — are not *Split Loop* any
more. They're *Extract Function*, from chapter 6, arriving two chapters early because it's
the obvious next thing to do with a loop that now has exactly one job and a name that wants
saying. I did them anyway, and the walkthrough's "different route" section below is honest
about why that's a choice, not a requirement.

## Step 1 — duplicate the loop

```ts
// before
function dayTotals(orders: readonly Order[]): DayTotals {
  let revenueCents = 0;
  let flourGramsUsed = 0;
  for (const order of orders) {
    revenueCents += order.totalCents;
    flourGramsUsed += order.flourGrams;
  }
  return { revenueCents, flourGramsUsed };
}

// after
function dayTotals(orders: readonly Order[]): DayTotals {
  let revenueCents = 0;
  let flourGramsUsed = 0;
  for (const order of orders) {
    revenueCents += order.totalCents;
    flourGramsUsed += order.flourGrams;
  }
  let revenueCents2 = 0;
  let flourGramsUsed2 = 0;
  for (const order of orders) {
    revenueCents2 += order.totalCents;
    flourGramsUsed2 += order.flourGrams;
  }
  return { revenueCents, flourGramsUsed };
}
```

Deliberately silly-looking, with a throwaway `2` suffix that never survives to a commit
message anyone reads twice. The point of this step is that it changes nothing observable —
the new loop's output is unused — so the suite staying green tells you only that you
copied correctly, not that you've improved anything yet. That's fine. It's not supposed to
improve anything yet.

## Steps 2 and 3 — strip each copy to one job

```ts
// after step 2
let revenueCents = 0;
for (const order of orders) {
  revenueCents += order.totalCents;
}
let flourGramsUsed2 = 0;
for (const order of orders) {
  revenueCents2 += order.totalCents; // still wrong on purpose, fixed next
  flourGramsUsed2 += order.flourGrams;
}
```

Step 2 deletes `flourGramsUsed`'s line from the first copy. Step 3 deletes `revenueCents`'s
line from the second and drops the `2` suffixes. After step 3 you have two real loops, each
reading one field off `order`, and the suite is green for a reason this time.

**This pair is where the whole exercise can go wrong**, and it's not the loop mechanics —
it's the field. Both loops start from `for (const order of orders)`, and the difference
between them is one word: `totalCents` versus `flourGrams`. Copy-paste the wrong body into
the wrong copy and you get two loops that both compile, both run, and both silently return
`revenueCents` twice. The test *"keeps revenue and flour as two independent sums when an
order only feeds one of them"* exists for exactly this slip — it uses orders where one
field is zero and the other isn't, so a swapped field fails loudly instead of by chance.

## Steps 4 and 5 — extract, now that each loop is honest

```ts
function revenueCents(orders: readonly Order[]): number {
  let total = 0;
  for (const order of orders) {
    total += order.totalCents;
  }
  return total;
}

function flourGramsUsed(orders: readonly Order[]): number {
  let total = 0;
  for (const order of orders) {
    total += order.flourGrams;
  }
  return total;
}
```

**On the name.** Both functions are named for the *question they answer*, not the
mechanism — question 1 in [`../../../../../../docs/NAMING.md`](../../../../../../docs/NAMING.md).
I rejected `sumTotalCents` and `sumFlourGrams`: they describe the `for` loop instead of the
domain, and the moment either becomes a `reduce()` (see the very end of this file) a
`sum*` name stops being true. `revenueCents` and `flourGramsUsed` survive that rewrite
untouched, which is the actual test — question 1 asks whether the name would still fit
after you gutted the body.

**On the name, again.** `revenueCents`, not `revenue`. Question 4 — is it true? — plus the
convention this repository is consistent about: a unit-bearing number carries its unit in
the name (`paceSecondsPerKm` in the chapter 6 drill is the same idea). A `revenue` that is
silently in cents is the kind of bug that survives code review and gets caught by an
actual bakery's actual bank statement.

## Step 6 — `dayTotals` becomes a composition

```ts
function dayTotals(orders: readonly Order[]): DayTotals {
  return {
    revenueCents: revenueCents(orders),
    flourGramsUsed: flourGramsUsed(orders),
  };
}
```

**On the name.** `dayTotals` stays as it was through every step — question 2 (could it be
the name of something else?) is why. I considered `computeTotals` while writing this and
rejected it: "totals" of what, computed how? `dayTotals` ties the result to the one thing
this file is about — a day's worth of orders — and reads the same at its one call site in
`renderProductionSummary` whether the body is four lines or, as now, two function calls.

This is the shape the whole exercise was aimed at: a function whose body is a list of
*what* it returns, not *how*. Nothing here says "loop" any more.

## The objection: aren't two loops slower than one?

Every reader gets here and thinks it, so it's worth answering straight instead of waving
it off. Yes — `dayTotals` now walks `orders` twice instead of once. That is a real, true
fact about the code, and pretending otherwise would make the rest of this walkthrough
untrustworthy.

Here is the honest accounting:

- **The cost is one extra linear pass over an array of orders from a single bakery's single
  day.** Tens, maybe low hundreds of elements. Two passes over a few hundred numbers is
  not a cost a human will ever perceive next to everything else this function already
  does — building strings, formatting currency, joining lines. If you profiled
  `renderProductionSummary` end to end, the loop split would not show up as a bar on the
  chart worth naming.
- **It's measurable, not a matter of faith.** If you genuinely doubted this, you would not
  argue about it — you'd benchmark both versions with real order counts and look at the
  numbers. That is the actual answer to "isn't this slower", every time: run it, don't
  guess it. Guessing is how code ends up optimized for a load it will never see at the
  cost of clarity it needs every day.
- **The book's position, and this repository's, is to get the design right first and
  measure before changing it for speed** — not to skip clarity because a change *might*
  cost something. A fast function that nobody can safely change is not a win; it's a
  liability with good benchmarks.

**What I would actually do if this loop were hot** — say, `dayTotals` ran once per order as
new orders streamed in during a Saturday rush, called thousands of times a minute instead
of once at closing: I would not undo the split by hand-inlining the loops back together.
I'd keep the two functions — callers and tests still see `revenueCents` and
`flourGramsUsed` as separate, named things — and fold the *implementation* back into a
single pass behind them, with a comment explaining why, the same way
[`findCapacityBreach`](../../../08-replace-loop-with-pipeline/solutions/replace-loop-with-pipeline/report.ts)
in the next drill stays a hand-written loop on purpose instead of becoming a `reduce()`.
Correctness and a measurement come first; the merge is a targeted, documented exception to
an otherwise clear rule, not a reason to never split loops in the first place.

## What it cost

Two names to keep in sync with the field they read, and a second pass over `orders` — real,
if immaterial at this scale (see above).

The decision I'm least sure of: doing steps 4 and 5 at all. *Split Loop*, strictly, ends at
step 3 — two loops, still anonymous, still sitting inside `dayTotals`. Extracting them into
`revenueCents` and `flourGramsUsed` is a second, separate refactoring bolted onto the first
because it obviously wanted to happen next. A reviewer could reasonably ask me to stop at
step 3 and let the extraction be its own commit, its own review, its own moment to decide
whether these two sums even deserve top-level names or whether they're fine as unnamed
loops nobody outside `dayTotals` will ever call directly. I did it anyway because leaving
two structurally identical, freshly-separated loops unnamed felt like stopping mid-sentence
— but "felt like" is doing real work in that justification, and I want to say so rather
than present it as obviously correct.

## If you took a different route

- **Stopping at step 3.** Entirely defensible, and arguably the more disciplined reading of
  the catalog entry — *Split Loop* doesn't promise you a name, only a separation. If your
  team reviews each catalog move as its own commit, stop here and let extraction be a
  follow-up.
- **Naming the loops before splitting them**, by giving the two accumulators clearer names
  first (`revenueCents` / `flourGramsUsed` instead of terser ones) and *then* duplicating.
  Same destination, different order of the two kinds of clarity. Fine either way.
- **Reaching for `.reduce()` instead of a second `for` loop.** This is the one that looks
  like a shortcut and isn't quite the same move — turning an accumulate-loop into a
  pipeline call is *Replace Loop with Pipeline*, and doing it here would answer a question
  this drill isn't asking yet. It's not wrong, it's just a different day's refactoring: see
  [`08-replace-loop-with-pipeline`](../../../08-replace-loop-with-pipeline/README.en.md).

What is *not* a matter of taste: skipping the duplicate-then-strip step and hand-editing
the single loop directly into two, without running the suite between the split and the
extraction. On a four-line loop the risk is small enough to get away with it. The habit
that risk teaches you is not.

## Where TypeScript changes this

Nothing about *Split Loop* itself needs a type system — the book's JavaScript version of
this move is identical. The one place TypeScript pulls its weight is `DayTotals` as a named
return type: it's what makes `dayTotals`'s destination signature — an object with exactly
`revenueCents` and `flourGramsUsed`, no more, no less — a promise the compiler checks on
every step, rather than a comment I could have let drift while editing the loop bodies.

## Where this leads

This is the part a walkthrough usually just asserts instead of showing. Go back and look
at step 6's `revenueCents` next to where you started at step 1: before the split, "make
`revenueCents` a `.reduce()`" isn't a move you can make in isolation — the accumulator is
welded to `flourGramsUsed` inside the same loop body, so touching one risks the other.
After it, `revenueCents(orders)` is a four-line function with one job, and turning its body
into `orders.reduce((sum, o) => sum + o.totalCents, 0)` is a one-line, one-function change
that can't touch flour at all. *That* is what the split bought you — not tidiness,
extractability — and it's exactly the move
[`08-replace-loop-with-pipeline`](../../../08-replace-loop-with-pipeline/README.en.md)
picks up from here, on a different day's loops.

Run `./rp review 08-07` if you want a second opinion on the route you actually took — it
builds a packet that deliberately withholds this file from the reviewer, so you get judged
on your own terms rather than on your resemblance to me.
