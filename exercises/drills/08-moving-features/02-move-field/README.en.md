[🌐 English](./README.en.md)

# Move Field

`Chapter 8` · `Move Field` · `●○○` · ~20 min

## Context

The Ashgrove Bakery Co-op sells wholesale to a rotating roster of cafes, diners, and
corner stores, delivered on the co-op's own routes. Every customer buys under one of a
handful of standing contract plans that the board negotiates — Founders Co-op Rate,
Standard Wholesale, Trial — and it is the plan, not the customer, that carries the
wholesale discount everyone on it is entitled to.

## The smell

**Shotgun Surgery**. `Customer` keeps its own copy of `discountRate`, filled in from its
plan at signup and never structurally connected to it again. Renegotiating a plan's rate
means writing the new number in two places: once on the `ContractPlan`, where it belongs,
and once more per customer, in a loop that has to be handed a complete, current list of
everyone on that plan. Hand it an incomplete one — a customer loaded from a different
query, one onboarded moments ago — and that customer's invoices keep charging the old rate
indefinitely, with nothing in the types to flag it. Two customers on the same plan can
disagree right now, and only careful bookkeeping keeps that from happening.

## The target

**Move Field**: relocate `discountRate` onto `ContractPlan` for good, and give `Customer`
a getter that reads it through the `plan` reference it already carries, instead of keeping
a second number in sync by hand. Done right, two customers on the same plan cannot
disagree — not because someone remembered to update both, but because there is only one
number left to read.

The field is not encapsulated yet when you start. Encapsulate it first — the same move as
`drill-07-01`, applied to one field — before you touch where the value comes from. See
`WALKTHROUGH.md` for why doing this in the other order is the trap.

## Done when

- `discountRate` is stored on `ContractPlan` only. `Customer` exposes a `discountRate`
  getter that reads through `plan`, and has no field or setter of its own.
- `renegotiatePlanRate` changes a plan's rate in exactly one place; nothing loops over
  customers to keep a second copy current.
- `npm run lint:strict -- exercises/drills/08-moving-features/02-move-field/src` is clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Turn `Customer` into a class first, with `discountRate` still storing its own value behind
a private field and a getter-and-setter pair that just wrap it. Nothing outside
`customer.ts` has to change for this step — `customer.discountRate = x` already calls a
setter the same way it used to write a field.
</details>

<details>
<summary>The getter and the setter don't have to move together.</summary>

Once `discountRate` is behind a getter, try changing *only* the getter to read
`this.plan.discountRate`, and leave the private field and its setter exactly where they
are. Watch what happens to that field once nothing reads it any more — and watch what is
still writing to its setter.
</details>

<details>
<summary>`renegotiatePlanRate` looks like it needs the customer list to find who's affected.</summary>

It does — but only to find the plan. Once it has the plan, does it need to touch a
`Customer` again for anything? If your finished version still loops over customers to set
something, the field has not finished moving.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Move Field*; chapter 3, *Shotgun Surgery*.
