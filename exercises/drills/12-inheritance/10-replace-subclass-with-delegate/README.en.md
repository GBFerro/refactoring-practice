[🌐 English](./README.en.md)

# Replace Subclass with Delegate

`Chapter 12` · `Replace Subclass with Delegate` · `●●●` · ~35 min

## Context

Beckworth Music School prices a term two ways at once: how long it runs, and what rate
card the enrolled student is billed under. A **standard term** runs ten sessions at one
rate; an **intensive term** runs four sessions at a higher one. Both kinds also apply a
category discount — nothing off for an adult, a flat amount off for a child, a percentage
off for a concession student — and that discount rule is the same regardless of which term
length the student picked.

## The smell

**Repeated Switches.** `TermPricing` is an abstract class with two subclasses,
`StandardTermPricing` and `IntensiveTermPricing`, one per term length. Term length is the
only axis this hierarchy was built to carry — so when the category discount needed
expressing too, it had nowhere to go except *into* both subclasses, as the same switch
statement, copied. Add a new category tomorrow and you edit two files that otherwise have
nothing to do with each other.

## The target

**Replace Subclass with Delegate.** The two term-length subclasses collapse into one
concrete `TermPricing`, which takes a small `TermLengthPlan` value — the two numbers a
term length actually fixes — as a constructor argument instead of being expressed as a
type. With no subclasses left to duplicate into, the category-discount switch lives in
exactly one place.

You will use **Pull Up Method** first, on the switch itself, before touching the
subclasses at all — a supporting move from earlier in this chapter, needed here because a
switch duplicated in two places is a hazard the delegate move should not have to carry
through every step that follows it.

## Done when

- `categoryDiscountCents`'s switch statement appears in exactly one place in the solution.
- `TermPricing` is a concrete class, constructed directly with a plan value; no subclass of
  it exists anywhere in the solution.
- `priceTerm`'s public behaviour — same inputs, same prices, same invoice lines — is
  unchanged from outside.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/10-replace-subclass-with-delegate/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not with the subclasses. Start with the one thing already safe to fix on its own: the
duplicated switch. Pulling it up to the abstract base class first — the two copies are
byte-identical, so this is Pull Up Method with nothing to reconcile — means every step
after it touches one copy of the discount logic instead of two.
</details>

<details>
<summary>Once the switch is pulled up, what's actually left on the subclasses?</summary>

Two methods each, both returning a fixed number. Give `TermPricing` a field that holds
those two numbers as a plain value, read by now-concrete versions of those same two
methods, and the subclasses stop doing anything except handing a constant to `super()`.
That is the moment to ask whether they are still earning their keep as subclasses.
</details>

<details>
<summary>How do I know it's safe to delete the subclass files?</summary>

Grep for their names across the whole exercise before deleting anything. Once you have
rewritten the one call site that constructs them and confirmed nothing else references
either name, delete the files and run `tsc` again — a caller you missed turns into a
compile error at that point, not a runtime surprise later.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Replace Subclass with Delegate*; chapter 3,
*Repeated Switches*.
