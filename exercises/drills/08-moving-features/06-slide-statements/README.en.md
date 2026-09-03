[🌐 English](./README.en.md)

# Slide Statements

`Chapter 8` · `Slide Statements` · `●○○` · ~20 min

## Context

Every morning, Ashgrove Bakery Co-op turns yesterday's standing orders into a bake plan: how
much of each item to put in the oven, and a shelf tag so it lands on the right rack once it's
out. One function builds the whole sheet from the day's catalogue and standing orders.

## The smell

**Long Function**, and specifically the kind that doesn't announce itself with size alone.
Inside the loop, the four statements that compute how much of an item to bake sit with three
unrelated statements about its shelf tag wedged in the middle. Nothing here is *wrong* —
the suite is green, the output is right — but the two things this code is doing are braided
together instead of sitting side by side, and that braid is what's making the function feel
longer and harder to hold in your head than its line count explains.

## The target

**Slide Statements**: move the bake-quantity statements up next to the standing-order value
they start from, so the four statements about "how much to bake" are contiguous and the
three about "where it goes on the shelf" are contiguous too. Nothing about the output
changes. What changes is what becomes possible next — once those four statements are
sitting together, they have a name waiting for them, and lifting them out stops being a
research problem and starts being a paste.

## Done when

- The bake-quantity statements (`bufferUnits`, `neededUnits`, `bakeUnits`, `batches`) are no
  longer separated by anything that doesn't read or write them.
- You can point at the two blocks in the loop and say, out loud, what each one computes,
  without the other one interrupting your sentence.
- `npm run lint:strict -- exercises/drills/08-moving-features/06-slide-statements/src` is
  clean once you've followed the extraction steps in `STEPS.md` through to the end.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>How do I know a slide is actually safe?</summary>

For the two statements you want to swap, write down what each one reads and what each one
writes. If neither reads a name the other writes, and they don't write the same name, they
can trade places. Do this one adjacent pair at a time, not for the whole block against the
whole block at once — if a check fails, you want to know exactly which pair failed it.
</details>

<details>
<summary>Which direction should I slide — the shelf-tag lines, or the bake-quantity lines?</summary>

Either destination is fine; the important thing is which statements end up adjacent, not
which ones physically moved. Try moving whichever block feels smaller or more clearly
single-purpose to you — it's the same number of checks either way.
</details>

<details>
<summary>I slid the statements and nothing looks different. Did I do it right?</summary>

Yes — that's the point. Slide Statements is not supposed to change what the reader sees in
the diff's *meaning*, only its shape. If you're waiting for something to feel improved, look
one step ahead instead: is there a block of statements now sitting together that you could
select in your editor as one contiguous chunk and give a name? If yes, the slide did its
job.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Slide Statements*; chapter 3, *Long Function*.
