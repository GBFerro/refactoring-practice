# Walkthrough — one predicate, called from both features

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: two functions that don't look alike

`order-safety.ts` has a function that flags order items conflicting with a customer's
allergen request. `menu.ts` — a different file, backing a different feature, the online
ordering page's "hide anything I'm allergic to" filter — has `productIsSafeFor`, which
answers a question that sounds like the same question:

```ts
// menu.ts
export function productIsSafeFor(product: Product, avoidAllergens: readonly string[]): boolean {
  return !product.allergens.some((allergen) => avoidAllergens.includes(allergen));
}

// order-safety.ts, before anything
let conflict = false;
for (const allergen of order.mustAvoidAllergens) {
  if (item.product.allergens.includes(allergen)) {
    conflict = true;
  }
}
```

Nothing about these two makes the resemblance obvious at a glance, and that gap is the
actual exercise. They disagree on:

- **Loop shape.** One is `.some()`. The other is a `for` loop with an `if` inside it.
- **Which list drives the loop.** `productIsSafeFor` walks the *product's* allergens,
  asking of each one "is this on the avoid-list?" The inline code walks the
  *avoid-list*, asking of each one "is this on the product?"
- **Accumulation versus early exit.** `.some()` stops at the first match. The inline loop
  keeps going and just sets a flag — nothing ever resets `conflict` back to `false`, so it
  keeps scanning after it already knows the answer.
- **Naming.** `conflict` versus `!...isSafeFor`. One is phrased as a problem, the other as
  a guarantee, and they are — this is the whole point — the same guarantee, negated.

If you read only the first bullet and stopped, you would conclude these are unrelated
loops that happen to touch allergens. The recognition that they compute the same boolean
is not free, and it is not optional either: skip it and you either duplicate a predicate
that already exists (leaving the smell in place under a coat of paint) or you swap it in on
faith, which is the trap the rest of this walkthrough is about.

## Why small steps, not one swap

The tempting move is to select the whole inline block and replace it with
`!productIsSafeFor(item.product, order.mustAvoidAllergens)` in one commit. I did not do
that, on purpose. Instead, steps 1 and 2 reshape the inline code — in place, still fully
hand-written, still not calling `menu.ts` at all — until it is textually almost the
function's own body. Only then, in step 3, does the call actually happen.

The reason is that "select and replace" asks you to trust an equivalence argument you
worked out in your head, all at once, with no checkpoint if you got it wrong. Reshaping in
two small, independently tested steps turns one large claim ("these do the same thing")
into two small ones ("swapping an accumulator for `.some()` doesn't change this loop's
result" and "iterating the other list doesn't change this loop's result"), each cheap to
verify on its own, before the third step — the actual named refactoring — has anything left
to prove.

## Step 1 — accumulator to `.some()`, same list

```ts
// before
let conflict = false;
for (const allergen of order.mustAvoidAllergens) {
  if (item.product.allergens.includes(allergen)) {
    conflict = true;
  }
}

// after
const conflict = order.mustAvoidAllergens.some((allergen) =>
  item.product.allergens.includes(allergen),
);
```

The list being walked has not changed — this step is only about the accumulator. Is it
safe to replace "keep looping, only ever setting a flag to `true`" with "stop at the first
match"? Yes, and the reason is almost definitional: nothing in the original loop ever sets
`conflict` back to `false`. Once any allergen matches, every later iteration is redundant —
it can only confirm what is already known. A boolean that starts `false` and can only be
set `true`, never reset, is exactly what `.some()` computes: "does at least one element
satisfy the predicate." Stopping early doesn't change the answer; it just stops asking a
question that was already answered.

**On the name.** I kept the local `const conflict`, and rejected `hasConflict`. Question 3
from [`NAMING.md`](../../../../../../docs/NAMING.md) —
does it read at the call site? — `if (conflict)` already reads as a question; prefixing
`has` would answer a question nobody who reads `if (conflict)` was still asking. That
prefix earns its keep on an exported predicate, called from elsewhere, where the reader
doesn't have the surrounding `if` for context — not on a local three lines from its own use.

## Step 2 — flip the list

```ts
// before
const conflict = order.mustAvoidAllergens.some((allergen) =>
  item.product.allergens.includes(allergen),
);

// after
const conflict = item.product.allergens.some((allergen) =>
  order.mustAvoidAllergens.includes(allergen),
);
```

This is the step that actually deserves scrutiny, and it is the one a rushed version of
this exercise would skip straight past. The two expressions walk different lists. Are they
the same predicate?

They are, and the reason is worth stating plainly rather than trusting by inspection:
"does some element of A appear in B" and "does some element of B appear in A" are both
asking whether **the intersection of A and B is non-empty** — a question with no preferred
direction. Swap which set you iterate and which you test membership against, and the
answer cannot change, for any two sets. That is the actual proof this step is safe. It
holds regardless of how many allergens either list has, whether either is empty, and
whether either has duplicates — none of those affect whether an intersection exists.

This is also where a plausible-but-wrong reimplementation would diverge, and it is worth
being specific about what "wrong" would look like here, because "the tests still pass" is
not what makes step 2 safe — the intersection argument above is. The tests are a second,
independent check, and it matters that they are the kind that would actually catch the
usual mistakes at this step:

- A version that checks only `item.product.allergens[0]` instead of the whole list would
  pass on some inputs and fail on `almondCroissant`, whose match (`"tree nuts"`) isn't the
  first allergen listed — the first test in the suite is built around exactly that.
- A version that checks only `order.mustAvoidAllergens[0]` would fail on `hazelnutBiscotti`,
  whose only conflict is the *second* avoided allergen — the third test exists for this.
- A version that used `.every()` where `.some()` belongs — an easy slip when you're
  rewriting a loop and thinking about "all" instead of "any" — would flag almost nothing;
  several tests here have items with more than one allergen and would catch it.

If this exercise's tests had been written against the inline version instead of against
the clean solution first — which is the usual order in a real codebase, tests get written
against whatever already exists — passing them would still only tell you the new code
agrees with the old one on the inputs someone thought to write down. It would not tell you
they agree everywhere. The intersection argument is what closes that gap; the tests are
what catch you if the argument, or its translation into code, was wrong.

## Step 3 — the call

```ts
// before
const conflict = item.product.allergens.some((allergen) =>
  order.mustAvoidAllergens.includes(allergen),
);
if (conflict) {
  flagged.push(item);
}

// after
if (!productIsSafeFor(item.product, order.mustAvoidAllergens)) {
  flagged.push(item);
}
```

By now the inline expression and `productIsSafeFor`'s body are the same three lines
written twice, one of them negated and named. That is what makes this step boring, which
is the goal — all the actual judgment happened in step 2. This step is mechanical:
delete, import, negate, call.

**On the name.** `productIsSafeFor` picks up a second caller here, from a file with nothing
to do with the online menu. I considered renaming it — `isAllergenSafe`, or moving it
somewhere more neutral than `menu.ts` — and rejected both, for now. Question 4: is the name
still true in its new context? Yes — it says nothing about menus or browsing; it is about a
`Product` and a list of allergens, which is exactly what both callers have. Question 2 also
still holds: nothing else in either file could plausibly be called `productIsSafeFor`.
Renaming or relocating it would be a real improvement to consider, but it is a second
refactoring riding on this one's back, and bundling them would make this diff harder to
review, not easier. That decision belongs in `WALKTHROUGH.md`'s "different route" section
below, not in this commit.

It's also worth naming the export `itemsWithAllergenConflict` itself, inherited unchanged
from before step 1 because the drill's `apiFrozen` boundary means it was never mine to
rename here. Had I been naming it fresh, I would still land close to this: `flaggedItems`
fails question 2 — flagged for what? — and `unsafeItems` fails question 4 by being broader
than what the function actually checks; a co-op has other reasons an item could be unsafe
(spoilage, allergen-adjacent equipment) that this function knows nothing about.

## What it cost

The coupling in `meta.json`'s tradeoff is real and worth restating in plain terms: before
this refactor, a bug fix to `productIsSafeFor` — say, deciding that trace allergens on a
shared production line should also count — only affected the menu. After this refactor, it
also silently changes what gets flagged at checkout, without anyone touching
`order-safety.ts`. That is usually the right trade; two definitions of "safe" drifting
apart quietly is worse. But it is a trade, and I would want it flagged in review the day
someone changes `menu.ts` for a menu-only reason.

The decision I am least sure about: I kept the outer `for` loop and `push`, rather than
collapsing the whole function to
`order.items.filter((item) => !productIsSafeFor(item.product, order.mustAvoidAllergens))`.
I wanted this diff to be about the duplicated *check* only, not also about loop style —
see `drill-08-08` for that refactoring on its own terms — but a reviewer who prefers the
one-line version would not be wrong, and I went back and forth on it while writing this.

## If you took a different route

- **Skipping straight to step 3.** Reasonable if you're confident, and the destination is
  identical. I would still ask, in review: how did you know steps 1 and 2 were safe, if you
  never separated them out?
- **Writing the intersection argument as a code comment above the call**, rather than only
  in this file. Genuinely defensible — a comment travels with the code, this file might not
  be read again. I left it out because the call site is now three lines that read as their
  own justification (`!productIsSafeFor(...)`), and a comment restating "these are the same
  by symmetry of set intersection" next to code that obvious would age into noise.
- **Renaming or relocating `productIsSafeFor` in the same change.** Defensible as a
  follow-up, not defensible as part of *this* commit — see step 3's naming note. Bundling a
  rename with a behavior-preserving swap is the one thing here I'd call a mistake rather
  than a judgment call, because it removes your ability to bisect the two if either one
  turns out to be wrong.
- **Leaving a runtime assertion comparing both versions for a release** ("belt and
  braces"), instead of trusting the argument and deleting the old code. Also not a matter
  of taste: shipping two implementations of the same rule, hoping they never disagree, is
  the duplication this drill exists to remove, wearing a safety harness.

## Where TypeScript changes this from the book

Fowler's mechanics for this refactoring say, in effect, "confirm the inline code and the
function compute the same thing, then swap." In JavaScript, that confirmation is entirely
your own reasoning plus the tests. Here, step 3 got a second check for free: the moment
`item.product` and `order.mustAvoidAllergens` slotted into `productIsSafeFor(product:
Product, avoidAllergens: readonly string[])` with no adapter, no cast, no reshaping — that
was TypeScript's type checker confirming these two computations share a domain, not just a
result. If `productIsSafeFor` had actually belonged to a different concept that happened to
also return a boolean, the parameter types would have needed coercion to line up, and that
friction would have been an early warning that step 3 was reaching for the wrong function.
Structural typing doesn't prove behavioral equivalence — nothing here does except the
intersection argument — but it does rule out a whole class of "these just happen to look
similar" mistakes before you write a single test.
