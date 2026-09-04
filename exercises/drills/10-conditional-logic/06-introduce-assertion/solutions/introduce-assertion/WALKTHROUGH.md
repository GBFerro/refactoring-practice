# Walkthrough — the concentration assumption, stated and enforced

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why the assumption belongs behind an assertion and not a check, why one of
`dosage.ts`'s two guarded values gets each treatment, and what changes about an assertion
the moment it ships.

---

## Before anything: two guarded values, two different guarantors

`dosage.ts` has two places where a bad number could quietly become a worse one. Naming both
before touching either is the whole exercise; get this wrong and the refactoring lands in
the wrong place.

**`weightKg`**, in `checkedWeightKg`, comes from whatever a nurse just typed into the
patient's chart. It is finite, ordinary, external data - a fat-fingered `700` instead of
`70.0`, a decimal point in the wrong place, a field left at its default. None of that is a
bug in this program. It is Tuesday. The function already throws a plain, catchable `Error`
for it, with a message a caller can show back to the person who typed it, and this drill
does not touch that code at all.

**`profile.concentrationMgPerMl`**, read inside `volumeMl`, comes from a formulary entry -
a hardcoded record, written by a developer, deployed with the rest of the program. A
clinician never types a concentration in; they pick a drug from a list, and the concentration
that comes back is whatever this codebase's own data says it is. If that number is ever
zero or negative, the only way it got there is a mistake in code this program owns - a
typo in a formulary entry, a unit mix-up during a migration - not anything a patient visit
could cause. Before this refactoring, `volumeMl` divides by it anyway, with nothing written
down anywhere that says it was ever assumed to be positive.

**The test that tells them apart:** could a caller, using this function entirely correctly,
ever cause the bad value through the *normal* inputs the function is built to accept? For
`weightKg`, yes - constantly, and the function's whole job includes catching it. For
`concentrationMgPerMl`, no - the only path to a bad value here is a defect in code nobody
using `volumeMl` correctly could have written. The first is validation. The second is an
assumption, and an assumption that is never written down is a landmine with the pin already
half out.

## Why this order

The helper before the call site, not the other way round. `assert.ts` has no dependency on
`dosage.ts` at all - it's a generic, one-function module - so writing it first means the
change to `volumeMl` in step 2 is the only place in the whole route where behaviour can
differ from `src/`, and it's an isolated, one-line diff you can read in full. Writing the
call site first would leave you referencing a function that doesn't exist yet, which
`tsc --noEmit` would refuse before you'd learned anything from it.

## Step 1 — the tool, before the assumption

```ts
// assert.ts
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}
```

Nothing in `dosage.ts` changes yet. This step only makes the tool available; `volumeMl`
still divides by `concentrationMgPerMl` exactly as `src/` does, unread by anything new. The
suite is green here for the least interesting reason it ever is: nothing calls `assert` yet.

**On the name.** `assert`, not `check`, not `verify`, not `ensure`. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) - is it true? - is why the other three lose:
each of them is a word this codebase's own `checkedWeightKg` could just as honestly claim,
and using one of them here would blur exactly the line this drill exists to draw. `assert`
carries a narrower, borrowed meaning from every language that has one (C's `assert`,
Node's `node:assert`, Python's `assert` statement): a condition the program is not supposed
to need to handle, because handling it is not what it's for. Reusing that word is a promise
to the next reader about what kind of failure this is, and `check` or `verify` wouldn't make
it.

## Step 2 — where the assumption actually lives

```ts
// before
export function volumeMl(weightKg: number, profile: DrugProfile): number {
  const dose = doseMg(weightKg, profile);
  return dose / profile.concentrationMgPerMl;
}

// after
export function volumeMl(weightKg: number, profile: DrugProfile): number {
  const dose = doseMg(weightKg, profile);
  assert(
    profile.concentrationMgPerMl > 0,
    `${profile.name}'s formulary entry has a non-positive concentration (${String(profile.concentrationMgPerMl)} mg/mL)`,
  );
  return dose / profile.concentrationMgPerMl;
}
```

The assertion goes immediately before the division it protects, not at the top of the
function next to `checkedWeightKg`'s call. Putting the two together would visually pair
them as the same kind of guard, which is exactly the pairing this drill argues against -
see the next section.

Run this yourself against both variants before moving on, the same way `drill-09-03`'s
walkthrough asks you to run its stale-cache snippet by hand:

```ts
const badBatch = { name: "Bad Batch", mgPerKg: 10, concentrationMgPerMl: 0 };
volumeMl(20, badBatch);   // src/:      Infinity - divided by zero, and nothing complains
volumeMl(20, badBatch);   // solution:  throws "Assertion failed: Bad Batch's formulary
                          //             entry has a non-positive concentration (0 mg/mL)"
```

**On the name.** The message names the *drug*, not the *field*: `Bad Batch's formulary
entry has a non-positive concentration`, not `concentrationMgPerMl must be positive`.
Question 3 - does it read where it's used? - decided this: an assertion's message is read
exactly once, in a stack trace, by whoever is debugging why the program stopped, and that
person needs to know which formulary entry to go fix, not which variable held the bad
value. A generic parameter-name message would be true and nearly useless in the same
breath.

## Step 3 — what this refactoring does not touch

No code changes in this step; it's here because the thing *not* done is as much a decision
as the two things that were. `checkedWeightKg` still throws a plain `Error`, identical in
both `src/` and the solution, and I want to be explicit about why *Introduce Assertion*
never reaches it.

**On the name.** `checkedWeightKg`, not `assertedWeightKg` or `validWeightKg`. I considered
renaming it while I was in the file, and rejected it on question 4 again: calling it
`assertedWeightKg` would claim, falsely, that a failure here means the same thing an
`assert.ts` failure means - a defect in this program's own code - when a failure here means
someone typed `-4` into a weight field, which is a completely different category of thing
going wrong and needs a completely different response (ask them to fix it; don't crash the
whole request). `checkedWeightKg` was already true. Touching it would have made it less so.

## What happens to an assertion in production - and why that's the whole point

Many teams strip calls shaped like `assert(...)` out of production bundles entirely - a
build-time flag, a bundler plugin, a `NODE_ENV` check wrapping the call - on the reasoning
that a check which can only fail when the program is already broken isn't worth paying for
on every request once the program has shipped and been tested. This repository's `assert`
doesn't do that automatically; the point is that it would be *reasonable* for a real
deployment of code like this to add it, and that possibility is the sharpest argument for
keeping validation and assertions apart. If `checkedWeightKg`'s check had been folded into
an `assert` call instead of staying a thrown `Error`, stripping assertions in production
would silently delete the only thing standing between a mistyped chart entry and a dose
calculated from it. An assertion that can vanish in production must never be the only thing
protecting a value someone outside the program controls. `concentrationMgPerMl` is safe to
guard this way for the opposite reason: if the assertion is stripped and a formulary entry
is genuinely broken, the program is already carrying a defect that testing, not a runtime
guard, was supposed to have caught before it ever reached production.

## What it cost

The honest part. `volumeMl` gained four lines that, in every test this exercise ships and
in every real call Fernbank's software will ever make against a correctly-maintained
formulary, do nothing but re-confirm something already true. That's the entire cost of an
assertion that never fires, which is the overwhelmingly common case - and I'm not fully
confident the message is worth the interpolation cost of building it on every single call
rather than only when the condition is about to fail. A lazy message (a callback instead of
a string, evaluated only on failure) would avoid that, at the price of a slightly less
obvious call site. I kept the eager string because `assert.ts` is generic and tiny, and I
didn't want to teach it a laziness convention for one caller's minor optimisation.

## If you took a different route

- **Asserting inside `DrugProfile`'s construction** instead of inside `volumeMl`, so a bad
  formulary entry fails the moment it's built rather than the moment it's used. Genuinely
  better in a codebase where `DrugProfile` values are constructed in one place, close to
  the formulary data itself. I didn't take it here because this exercise's `DrugProfile` is
  just an interface - nothing constructs it but test fixtures and whatever code calls
  `volumeMl` - so there is no single construction site to put the assertion in without
  inventing one that doesn't otherwise exist in this file.
- **A TypeScript branded type** (`type PositiveConcentration = number & { readonly brand:
  unique symbol }`) to make a non-positive concentration unrepresentable at the type level,
  closer to `Replace Primitive with Object` from chapter 7. Stronger, and worth reaching
  for if this codebase had several functions all trusting the same assumption about
  concentration. For one assumption read in one function, I judged the assertion the
  proportionate tool; `WALKTHROUGH.md`'s smell note below says more about where that line
  sits.

What is *not* a matter of taste: putting `checkedWeightKg`'s check behind `assert` instead
of a thrown `Error`. That's not a stylistic variant of this refactoring, it's the trap the
refactoring is named after - and the "what happens in production" section above is why it's
not merely a style question either.

## On the smell

This drill files under **Primitive Obsession**, and it's worth being honest about why that
took more than one attempt to land on. `concentrationMgPerMl` is a bare `number` standing in
for a domain concept - a drug's concentration - that has a rule attached to it, the same way
Primitive Obsession is usually described: the type itself is capable of storing values the
domain forbids, and every reader of every function that touches it has to independently
know the rule and enforce it, or trust that someone else already did. `Replace Primitive
with Object` from chapter 7 is the fuller cure - a `Concentration` type that simply cannot
be constructed with a non-positive value, closing the gap entirely rather than checking for
it at each use. `Introduce Assertion` is the lighter tool this drill is actually about: it
doesn't stop a bad `number` from existing, it stops one from being used silently the moment
it's found. For a value read in exactly one function in this codebase, that was the
proportionate fix; a `Concentration` type would be the right call the moment a second or
third function started trusting the same unstated assumption.

## Where TypeScript makes this different from the book

Fowler's own `assert` is plain JavaScript: a function that throws, and nothing more,
because JavaScript has no way to tell the type checker that code after the call is now
running under a narrower guarantee. TypeScript's `asserts condition` return-type predicate,
used on `assert` here, does exactly that. It doesn't change what runs - the emitted
JavaScript is identical either way - but it changes what the compiler is willing to accept
afterward: a version of this file that narrowed a `number | null` before dividing by it
could drop an explicit `if` and lean on `assert(value !== null, "...")` instead, and
`tsc` would treat every line after that call as already narrowed. This file doesn't need
that - `concentrationMgPerMl` is a plain `number` throughout - but it's the reason `assert`
is typed this way rather than as `(condition: boolean, message: string): void`: the stronger
signature costs nothing here and pays for itself the moment an assertion is guarding a type,
not just a numeric range.
