# Walkthrough — bake-quantity math, gathered next to the order it starts from

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why the slide has to happen before anything else, how to check that it is safe,
and what it buys you once it's done. Read it after you have your own version, not before.

---

## Why this order — and why nothing else is possible first

Look at `buildDailyBakePlan` in `src/` before you touch it. Inside the loop, four
statements compute how much of an item to bake — `bufferUnits`, `neededUnits`, `bakeUnits`,
`batches` — and they are exactly the shape of a function: one input (`item`, `standingUnits`),
one clear output, no dependency on anything else in the loop. They *want* to be
`bakeUnitsFor`.

But they aren't contiguous. Three statements about the shelf tag sit in the middle of them.
So before you can extract, you have a choice, and it's worth naming the two bad options so
the good one is obvious by contrast:

- **Extract around the interruption.** Cut `bufferUnits`/`neededUnits`/`bakeUnits` out as a
  function, leave the shelf-tag lines where they are, and now the loop body calls
  `bakeUnitsFor` in the middle of unrelated work, followed by `batches` computed from its
  result three lines later, followed by the shelf tag it never needed. Nothing is *wrong*,
  exactly, but the reader still has to hold the interruption in their head — you've moved
  the mess, not removed it.
- **Extract the interruption too, blind.** Pull the shelf-tag lines into a function *at the
  same time* as the bake-quantity ones, in one commit, trusting that you got both boundaries
  right. If you didn't — if `shelfTag` turned out to depend on `bakeUnits` somehow — you
  would only find out by reading the diff carefully after the fact, because the extraction
  and the reordering happened in the same step and a test failure wouldn't tell you which
  one broke it.

Sliding first avoids both. It's a change that provably alters nothing — the checks below are
exactly what "provably" means here — so if the suite is still green after the slide, you
know the reordering was safe *before* you've written a single new function. Then the
extraction that follows is a copy, a paste, and a name. Two easy things instead of one
compound one.

## The check that makes a slide safe

The book's rule is short: you may only move a statement past another when neither reads
what the other writes. Short rules are easy to nod at and hard to apply under pressure, so
here is the procedure, applied to this exact code, in the order to actually do it:

1. **Write down what the statement you're moving reads and writes.** For `bufferUnits`:
   reads `standingUnits` and `item.wastageAllowance`; writes `bufferUnits`.
2. **Write down what the statement it would cross reads and writes.** For `shelfTag`: reads
   `aisleCode` and `displayName`; writes `shelfTag`.
3. **Check the three ways they could collide:** does the mover read anything the other
   writes? Does the mover write anything the other reads? Do they write the same name? Here:
   no, no, no. Safe to trade places.
4. **Move it one statement at a time**, re-running the check against whatever is now
   adjacent — not against the whole block at once. `bufferUnits` has to clear `shelfTag`,
   then `aisleCode`, then `displayName`, each a separate three-way check, before it's sitting
   next to `standingUnits`. It only takes one of those checks failing to mean the whole
   plan needs rethinking, and you want to know which one.

Do that for `bufferUnits`, `neededUnits`, `bakeUnits`, and `batches` against all three
shelf-tag statements, and every one of the twelve checks comes back clean: the two blocks
share nothing but the loop's `item`. That is not a guess — it's the output of a mechanical
procedure you can rerun any time you doubt yourself.

**Where TypeScript helps and the book's JavaScript can't.** Every name on both sides of this
slide is declared with `const`. That matters more than it looks: a `const` can be read
anywhere after its declaration and written nowhere else, so the one failure mode a slide
actually has to fear — *moving a read above the write it depends on* — isn't something you
have to hold in your head and verify by inspection. Get the order wrong (say, hoist
`bufferUnits` above `standingUnits`) and `tsc` refuses to compile: `standingUnits` doesn't
exist yet at that point in the file. Fowler's examples are in loosely-typed JavaScript,
where a stray `var` can be read before its declaration and just silently produce
`undefined` — the mistake surfaces as a wrong number in a report, if it surfaces at all.
Here it's a compiler error, before you even reach the suite. The compiler doesn't tell you
a slide *is* safe — that's still your job, by the procedure above — but it does make the
one class of slide that clearly *isn't* safe impossible to ship by accident.

One name here is not a `const`: `ovenBatchesUsed` is a running total, reassigned every
iteration. That reassignment is itself a read-then-write of `ovenBatchesUsed`, so the check
above applies to it too — and it's why `ovenBatchesUsed = ovenBatchesUsed + batches` cannot
slide above the line that computes `batches`. It can, however, slide past the shelf-tag
block freely: nothing there reads or writes `ovenBatchesUsed`. It already sits in the right
place in `src/`; the point is that "sits in the right place" was a conclusion, not an
assumption.

## Step 1 — the slide

Before, in `src/`, the four bake-quantity statements are separated from `standingUnits` by
the three shelf-tag ones:

```ts
for (const item of catalogue) {
  const standingUnits = ordersBySku.get(item.sku) ?? 0;

  const displayName = item.name.toUpperCase();
  const aisleCode = item.aisle.slice(0, 3).toUpperCase();
  const shelfTag = `${aisleCode}-${displayName}`;

  const bufferUnits = Math.ceil(standingUnits * item.wastageAllowance);
  const neededUnits = standingUnits + bufferUnits;
  const bakeUnits = Math.ceil(neededUnits / item.batchSize) * item.batchSize;
  const batches = bakeUnits / item.batchSize;

  ovenBatchesUsed = ovenBatchesUsed + batches;
  lines.push({ sku: item.sku, name: item.name, shelfTag, bakeUnits, batches });
}
```

After sliding the bake-quantity block up past the shelf-tag block — nothing else changed,
same twelve lines, same behaviour, suite green throughout:

```ts
for (const item of catalogue) {
  const standingUnits = ordersBySku.get(item.sku) ?? 0;
  const bufferUnits = Math.ceil(standingUnits * item.wastageAllowance);
  const neededUnits = standingUnits + bufferUnits;
  const bakeUnits = Math.ceil(neededUnits / item.batchSize) * item.batchSize;
  const batches = bakeUnits / item.batchSize;

  const displayName = item.name.toUpperCase();
  const aisleCode = item.aisle.slice(0, 3).toUpperCase();
  const shelfTag = `${aisleCode}-${displayName}`;

  ovenBatchesUsed = ovenBatchesUsed + batches;
  lines.push({ sku: item.sku, name: item.name, shelfTag, bakeUnits, batches });
}
```

This is the whole lesson, and it's worth sitting with before moving on: nothing about this
diff is interesting on its own. No bug was fixed. No name improved. If you showed a reviewer
only this diff, the honest response is "why did you bother." The answer is on the other side
of step 2.

## Step 2 — the extraction that was impossible a minute ago

Five lines, one purpose, touching nothing outside `item` and `standingUnits`, sitting
together for the first time. That block has had a name waiting for it the whole time:

```ts
function bakeUnitsFor(item: BakeItem, standingUnits: number): BakeUnits {
  const bufferUnits = Math.ceil(standingUnits * item.wastageAllowance);
  const neededUnits = standingUnits + bufferUnits;
  const bakeUnits = Math.ceil(neededUnits / item.batchSize) * item.batchSize;
  return { bakeUnits, batches: bakeUnits / item.batchSize };
}
```

Try this before step 1: cut the same four statements out of the *original*, unslid code.
You can't select them as one block in your editor — you'd be extracting `bufferUnits`,
skipping a line, extracting `neededUnits`, skipping two more, and so on, hoping you didn't
misplace anything relative to `displayName` in the process. That version of the extraction
is a manual, error-prone edit. This version is select-cut-paste-name. Same destination,
completely different amount of trust required to get there. **That's the payoff Slide
Statements is actually for** — not that the code looks tidier afterward, but that a move
which was previously a small research project becomes mechanical.

**On the name.** I called it `bakeUnitsFor`, not `getBakeUnits` or `computeBakeQuantity`.
Question 1 from [`NAMING.md`](../../../../../../docs/NAMING.md):
does it say *what*, or *how*? "Compute" and "get" are both mechanism words that any function
in this file could wear — they describe that a value is being produced, not what the value
*is*. "Bake units for" reads as a fact about the item: this is the count you'll bake, for
this item, given this many standing units. At the call site —
`const { bakeUnits, batches } = bakeUnitsFor(item, standingUnits);` — the name and the
destructured fields say the same thing twice, which is what you want: question 3, does it
read at the call site, is satisfied by redundancy, not cleverness.

## Step 3 — the loop gets its own name, and an accumulator becomes a query

`buildDailyBakePlan` is still doing three jobs: grouping the standing orders, running the
per-item loop, and tallying `ovenBatchesUsed` as it goes. The strict profile's 12-line cap
won't let all three stay in one function, so the loop becomes `planLinesFor`:

```ts
function planLinesFor(items: readonly BakeItem[], orders: OrdersBySku): BakePlanLine[] {
  const lines: BakePlanLine[] = [];
  for (const item of items) {
    const standingUnits = orders.get(item.sku) ?? 0;
    const { bakeUnits, batches } = bakeUnitsFor(item, standingUnits);
    const displayName = item.name.toUpperCase();
    const aisleCode = item.aisle.slice(0, 3).toUpperCase();
    const shelfTag = `${aisleCode}-${displayName}`;
    lines.push({ sku: item.sku, name: item.name, shelfTag, bakeUnits, batches });
  }
  return lines;
}
```

With the loop pulled out, `ovenBatchesUsed` no longer has anywhere to accumulate into — and
it turns out it doesn't need one. Every line already carries its own `batches`, so the total
is a `reduce` away:

```ts
const ovenBatchesUsed = lines.reduce((sum, line) => sum + line.batches, 0);
```

In the book's vocabulary this second half of step 3 is *Replace Temp with Query*, from
chapter 7 — a different chapter, arriving unbidden, the same way it did in `06-01`'s
walkthrough. Refactorings come in flocks; the catalog is organized for reading, not for the
order things actually happen in.

**On the name.** `planLinesFor`, not `buildLines` or `processCatalogue`. Question 2: could
this be the name of something else in the file? `processCatalogue` could describe half the
functions here — pricing, printing, sorting, anything that takes a catalogue and does
something. `planLinesFor` is specific to the one thing this function returns: the lines of
a plan. I kept the parameter named `items` rather than `catalogue` inside the function,
even though the caller's variable is `catalogue` — question 1 again: inside this function
the value is just "the items I'm looping over," and `catalogue` implies a completeness
(*the whole* catalogue) this function doesn't require or check.

**On the name.** `shelfTag`, not `label`. Question 2 again: "label" fits a dozen other
strings in this codebase — a SKU is a label, a day of the week is a label. "Shelf tag" is
specific to what the string is *for*: what goes on the physical shelf card. `aisleCode` and
`displayName` are named for what they hold, not how they're computed — question 1 one more
time: `aisleCode` would stay true even if the abbreviation scheme changed from three letters
to two.

## What it cost, and the one I'm not sure about

The honest complaint about the slide itself: `planLinesFor`'s body now reads as two
paragraphs — bake math, then shelf math — where before it was one continuous (if tangled)
sequence. For a four-statement block that's a clear win. If the unrelated block had been
one line instead of three, I'm not sure I'd bother; the reordering cost (two now-separate
concerns instead of one probably-fine hybrid) starts to rival the benefit.

The decision I'm least sure about: `batches` lives inside `bakeUnitsFor` rather than
`planLinesFor`. It's derived purely from `bakeUnits` and `item.batchSize` — no
`standingUnits` involved — so it's arguably a *second* concern (batches-from-quantity)
riding along inside a function named for the first (quantity-from-order). I left it in
because every caller of `bakeUnitsFor` needs both numbers together and I didn't want a
second function that exists only to be called immediately after the first. A reviewer could
reasonably ask for `bakeUnitsFor` to return just `bakeUnits`, with `batches` computed
one line later in `planLinesFor`. I don't think there's a clean answer; I mention it because
a walkthrough where every call is obvious is the failure mode this file is supposed to
avoid.

## If you took a different route

- **Sliding the shelf-tag block down instead of the bake-quantity block up.** Same
  destination, same checks run in the opposite order, a different-shaped diff. Equally
  defensible — I picked "move the smaller, more clearly single-purpose block" as a rule of
  thumb, not a law.
- **Not extracting `planLinesFor` at all**, and instead trimming `buildDailyBakePlan`
  some other way to fit under the strict cap. I looked for one and didn't find a version
  that didn't just hide the same three jobs behind fewer, denser lines. Plausible someone
  finds a better one.
- **Keeping the accumulator instead of the `reduce`.** Would still pass every test. I
  prefer the query because it's impossible for it to drift from `lines` — an accumulator is
  a second source of truth for a number the lines already know — but a codebase with a
  hot path here might reasonably keep the accumulator to avoid a second pass.

What is *not* a matter of taste: sliding a statement past another without running the
three-way check from above, even when you're "pretty sure" it's fine. That's the one thing
this drill exists to make automatic. And once you've extracted `bakeUnitsFor`, leaving the
old un-extracted arithmetic duplicated anywhere "just in case" — that's not a second
solution, that's forgetting to finish.

Run `./rp review 08-06` if you want a second opinion on the route you actually took — it
builds a packet that deliberately withholds this file from the reviewer, so you get judged
on your own terms rather than on your resemblance to me.
