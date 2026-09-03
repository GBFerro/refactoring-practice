[🌐 English](./README.en.md)

# Split Variable

`Chapter 9` · `Split Variable` · `●○○` · ~20 min

## Context

Riverline Bike Share prices every trip in two independent pieces once a bike is docked:
the metered fare, tallied minute by minute against whichever pricing tiers the ride
crossed, and the refundable deposit taken when the bike was unlocked. Both numbers land in
the same close-out calculation, because both are needed to tell a rider what they actually
owe.

## The smell

**Mutable Data.** `tripCostCents` declares one `let amount`, reassigns it inside a loop to
accumulate the metered fare, captures that into `meteredFareCents`, and then reassigns the
*same variable* to hold the deposit refund — a completely unrelated number that has nothing
to do with anything `amount` held a moment before. Two questions, one name, and the second
assignment is trusting that whoever reads this later already found the capture line above
it and knows `amount` means something new now.

Not every reassignment is this smell. The loop's own accumulation is a `let` too, and it is
fine — every one of its reassignments is still answering "how much has this trip been
metered for so far." The test that tells them apart: **does the second assignment answer
the same question as the first?** An accumulator's does. This one doesn't.

## The target

**Split Variable**: give the deposit refund its own name, assigned once, so `amount` is
free to keep meaning exactly what it always meant — the metered fare, and nothing else.
When you're done, the function still has a `let`, but only where a `let` is honest: the
loop's running total.

## Done when

- No variable in `tripCostCents` is reassigned to answer a different question than the one
  it started with.
- The metered fare and the deposit refund each have their own declaration; the deposit
  refund's is a `const`, assigned exactly once.
- `npm run lint:strict -- exercises/drills/09-organizing-data/01-split-variable/src` is
  clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Find every `let` in the function and ask the test question of each reassignment: does it
answer the same question as the assignment before it? One of them will fail. That is the
one to split.
</details>

<details>
<summary>Which do I fix first — the split or the rename?</summary>

Split first. Renaming a variable that still holds two meanings just gives the second half
of the function a new wrong name instead of the old one. Once the deposit refund has its
own declaration, the leftover variable only ever means one thing, and *then* it is safe to
rename.
</details>

<details>
<summary>Do I need to touch the loop at all?</summary>

No — and that is the point. The loop's accumulator is legitimate exactly as it is. If you
find yourself wanting to turn it into a `const` with `reduce` to make it "match" the
deposit refund's `const`, that is a different refactoring; this drill has one smell to fix,
and the loop isn't it.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 9, *Split Variable*; chapter 3, *Mutable Data*.
