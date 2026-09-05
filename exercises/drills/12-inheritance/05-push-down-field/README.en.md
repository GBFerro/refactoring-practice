[🌐 English](./README.en.md)

# Push Down Field

`Chapter 12` · `Push Down Field` · `●●○` · ~20 min

## Context

Beckworth Music School rents instruments two ways: a short **trial** with no purchase
option, and a **lease-to-own** where monthly payments accrue credit toward eventually
buying the instrument. Both are represented as subclasses of `InstrumentRental` — a
standing agreement between a student and an instrument.

## The smell

**Temporary Field.** `InstrumentRental` declares `buyoutCreditsCents: number | null`, and
every `TrialRental` that has ever existed sets it to `null` — not because the credit
happens to be unknown yet, but because a trial has no purchase option at all, ever. The
superclass is carrying a field it cannot explain, for the sole benefit of the one subclass
that can.

## The target

**Push Down Field**: move `buyoutCreditsCents` off `InstrumentRental` and onto
`LeaseToOwnRental`, typed as a plain `number`. `TrialRental` ends up with no opinion on
buyout credit at all — not `null`, not a default, simply no such field.

## Done when

- `buyoutCreditsCents` is declared only on `LeaseToOwnRental`, as `number`, not
  `number | null`.
- `InstrumentRental` and `TrialRental` no longer mention buyout credit anywhere.
- `rentalLine` and `totalBuyoutCreditsCents` are unchanged from the outside — same
  signatures, same results, for every rental the tests construct.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/12-inheritance/05-push-down-field/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not by moving the field. `rentalLine` and `totalBuyoutCreditsCents` both currently read
`buyoutCreditsCents` off an `InstrumentRental`-typed value, and the moment the field leaves
the base class, both stop compiling. Rewrite them first to check *what kind of rental this
is* rather than *whether the field is null* — the field can move only once nothing reads it
off the base type any more.
</details>

<details>
<summary>Doesn't TypeScript's `number | null` already document this fine?</summary>

It documents that the value can be absent. It does not document *why*, or that the absence
is not a possibility for one subclass but a certainty. `?? 0` and `=== null` both compile
whether the null is "we don't know yet" or "this can never be anything else" — the type
alone cannot tell those apart, and only one of them is a smell worth fixing.
</details>

<details>
<summary>Compare this against `drill-12-02` — isn't pulling a field up the opposite
advice?</summary>

They can both be right, about different fields. [`drill-12-02`](../02-pull-up-field/README.en.md)
merges a field that two subclasses use identically. This drill pushes down a field that one
subclass never uses at all. Read this drill's `WALKTHROUGH.md` for how to tell "used the
same way" from "not used at all" — it is the same underlying question asked from the other
direction.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 12, *Push Down Field*; chapter 3, *Temporary Field*.
