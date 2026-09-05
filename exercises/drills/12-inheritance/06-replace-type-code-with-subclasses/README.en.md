[🌐 English](./README.en.md)

# Replace Type Code with Subclasses

`Chapter 12` · `Replace Type Code with Subclasses` · `●●●` · ~45 min

## Context

Beckworth Music School's lending desk stocks four families of instrument - string, brass,
woodwind, percussion - for students who don't own one yet. Every instrument in the library
has a category, fixed the day it arrives, and that category decides what deposit a
borrower puts down, what accessory they need to bring back stocked, and how often the
school's repair tech should look the instrument over.

## The smell

**Repeated Switches.** `Instrument.rentalDepositCents()`, `maintenanceIntervalWeeks()`, and
`requiredAccessory()` each open with their own `switch (this.category)` over the same four
values. No single switch is long, and none of them trips this repository's lint profile -
that is exactly why the smell survives: nothing mechanical is watching for it. What gives
it away is a question a linter can't ask: add a fifth family, and how many switches have to
change together, in step, before the school can rent out a viola?

## The target

**Replace Type Code with Subclasses**: one class per instrument family, each answering the
three category-driven questions for itself, with exactly one `switch` left in the whole
module - the factory that decides which class to build in the first place. That factory is
the one caller who still needs to know the category; everyone else asks the instrument.

`Instrument` also carries a second field, `LendingStatus`, that looks like the same kind of
thing and is not: it changes constantly as an instrument is checked out, returned, and sent
for repair. This drill is as much about leaving that field exactly where it is as it is
about moving `category` - an object cannot change its class once built, so a type code that
mutates is disqualified from this refactoring before a single switch is counted.

## Done when

- `Instrument`'s three category-driven methods are `abstract`, and every family that
  implements them lives in its own class.
- There is exactly one `switch` on `InstrumentCategory` left in the whole solution.
- `LendingStatus` is still a plain, mutable field on the shared base - not a fifth
  subclass, and not touched by this refactoring at all.
- `addInstrument(input)` and every method a caller calls on the `Instrument` it returns are
  unchanged from the outside.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/06-replace-type-code-with-subclasses/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Build the shape before you fill it in: four empty subclasses of `Instrument`, nothing
constructing any of them yet. Then take one family - the smallest set of numbers to
double-check - copy its three switch cases onto its subclass while the subclass is still
unused, and only once that copy is sitting there unreachable should you change the factory
to actually build it.
</details>

<details>
<summary>Which field goes first, `category` or `status`?</summary>

Only one of them ever should. Before writing a single subclass, ask whether the field ever
changes after the object is constructed. `category` doesn't; `status` does, on purpose,
every time an instrument is checked out or returned. An object can't change its class at
runtime, so a field that mutates is not a candidate for this refactoring at all, no matter
how many places switch on it.
</details>

<details>
<summary>Is four subclasses actually the smallest fix here?</summary>

Maybe not. Every category-driven method here is a single `return` of a literal - nothing
about *how* a value is computed differs between families, only the value itself. A lookup
table keyed by category would remove the repeated switches with far less code. This drill
asks you to build the subclasses anyway, because that is its named mechanics, but decide
for yourself afterward which one you would actually ship, and why.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Replace Type Code with Subclasses*; chapter 3,
*Repeated Switches*.
