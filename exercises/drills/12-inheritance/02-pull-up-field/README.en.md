[🌐 English](./README.en.md)

# Pull Up Field

`Chapter 12` · `Pull Up Field` · `●●○` · ~20 min

## Context

Beckworth Music School rents instruments to students by the term. Every rented instrument
is insured, wind and brass instruments through `WindInstrument`, string instruments through
`StringInstrument` — two subclasses of the same `Instrument`, built independently as the
school's catalogue grew from one instrument family to two.

## The smell

**Duplicated Code.** Both `WindInstrument` and `StringInstrument` declare an
`insuredValueCents` field, initialized the same way from the same shape of constructor
props, and read by the same billing function regardless of which subclass it came from.
Nothing distinguishes the two declarations except which file they live in.

They also both declare a field called `gradeLevel` — and that one is not the same smell,
even though it looks identical on the page. Telling the two apart is what this drill is
actually testing.

## The target

**Pull Up Field**: move `insuredValueCents` onto `Instrument`, so both subclasses inherit
one declaration instead of maintaining two. `gradeLevel` stays exactly where it is, on both
subclasses, because the two copies mean different things to the code that reads them.

## Done when

- `insuredValueCents` is declared in exactly one place: `Instrument`'s constructor.
- `gradeLevel` is still declared separately on `WindInstrument` and `StringInstrument`.
- `monthlyInsurancePremiumCents` and `totalMonthlyInsurancePremiumCents` are unchanged from
  the outside — same signatures, same results, for every case the tests cover.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/02-pull-up-field/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not by moving anything. Read what uses each of the two duplicated fields before you decide
either one is a duplicate. `insuredValueCents` feeds one calculation, the same way, from
both subclasses. `gradeLevel` feeds two calculations that have nothing to do with each
other. That reading is the whole first move.
</details>

<details>
<summary>Isn't a field with the same name and type on both subclasses always the same
field?</summary>

No — that is exactly the trap this drill sets. A name and a type are what a duplicate
*looks* like from the declaration alone. Whether it *is* one is a question about the code
that reads and writes it: does every caller treat the value the same way, regardless of
which subclass it came from? For `insuredValueCents`, yes. For `gradeLevel`, no — one
subclass uses it as a suitability threshold, the other as a cost multiplier, and merging
them would not fail a single test today.
</details>

<details>
<summary>Can I move the field and update both subclasses in one commit?</summary>

You can, but you lose the ability to tell, from a broken test alone, which subclass the
break came from. Adding the field to the base first — with both subclasses still keeping
their own copy, redundantly — and then deleting each subclass's copy in its own commit
means a failure after either deletion points at exactly one class.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Pull Up Field*; chapter 3, *Duplicated Code*.
