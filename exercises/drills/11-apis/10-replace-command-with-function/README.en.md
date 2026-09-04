[🌐 English](./README.en.md)

# Replace Command with Function

`Chapter 11` · `Replace Command with Function` · `●○○` · ~20 min

## Context

Every order at the Halliday Box Office carries a handling fee: a flat base amount, a bit
more per seat, and a rush surcharge for anything booked inside the last day before
showtime, all capped so no order is ever charged past a maximum. A checkout screen, a
receipt line, and the running order total all need the same number.

## The smell

**Lazy Element.** `CalculateHandlingFeeCommand` has a constructor that stores the order it
was given and one method, `execute()`, that runs a single pass over that order and returns
a number. Nothing is built up between construction and running; nothing about the
calculation has more than one phase; nothing reads the object's state after `execute()`
returns. It is a class shaped like the harder problems this chapter's commands solve,
wrapped around a computation that never had that problem.

## The target

**Replace Command with Function**: collapse the class to a single function,
`calculateHandlingFee(order)`, with the same signature the constructor plus `execute()`
amounted to all along. Every caller that used to write
`new CalculateHandlingFeeCommand(order).execute()` calls the function directly instead —
one hop removed, nothing else different.

## Done when

- `CalculateHandlingFeeCommand` is gone.
- `handlingFeeFor`, `formatFeeLine` and `totalWithFee` call `calculateHandlingFee(order)`
  directly and return exactly what they returned before.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/11-apis/10-replace-command-with-function/solutions`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. `tests/callers.spec.ts` imports only
`handlingFeeFor`, `formatFeeLine` and `totalWithFee` — never the calculator by name,
because turning a class into a function is the entire point.

## Hints

<details>
<summary>Where do I start?</summary>

Add `calculateHandlingFee(order)` next to the command, copying `execute()`'s body with
`order.` in place of `this.order.`. Have `execute()` delegate to the new function instead
of repeating the calculation. Nothing a caller sees can move yet — you've only given the
calculation a second, simpler way to be reached.
</details>

<details>
<summary>Do I need to check whether any caller relies on holding the command before running it?</summary>

Check anyway, but expect to find nothing: every call site in this module both constructs
and executes a command in the same expression,
`new CalculateHandlingFeeCommand(order).execute()`. Nothing stores the object first. If a
real codebase's version of this class *did* have a caller building one now and calling
`execute()` later, that caller would be the reason to stop and reconsider - see this
drill's `WALKTHROUGH.md` for what would have to be true for that reason to be real.
</details>

<details>
<summary>Should `handlingFeeFor` disappear too, now that it's just a pass-through?</summary>

Not in this drill - it's the tested caller `tests/callers.spec.ts` calls by name, the same
role a stable caller name plays in every `apiFrozen: false` drill in this module. Whether
you'd inline it away in code without that constraint is exactly the kind of honest,
unresolved judgement call this drill's `WALKTHROUGH.md` doesn't dodge.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 11, *Replace Command with Function*; chapter 3,
*Lazy Element*.
