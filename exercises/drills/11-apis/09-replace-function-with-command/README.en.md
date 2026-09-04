[🌐 English](./README.en.md)

# Replace Function with Command

`Chapter 11` · `Replace Function with Command` · `●●●` · ~45 min

## Context

The Halliday Box Office offers group bookings a block of seats, not a single one. Given a
row's layout and how many seats a group wants, the box office scores every contiguous run
of open seats it could offer: how central it is, whether it sits against the aisle,
whether taking it strands a lone open seat next to it, and how close its price is to what
the group asked to pay. The best-scoring block gets offered first, and a kiosk display
explains why.

## The smell

**Long Function.** `scoreSeatBlock` reads the raw facts about a candidate block, turns
each fact into weighted points, and combines the points into a total — three phases, seven
local values threading between them. Each phase depends on the one before it, and the last
phase alone needs four of those values just to run.

That is what makes the function resist the obvious fix. Extracting the combine step as its
own function — the reflex [`drill-06-01`](../../06-first-set/01-extract-function/README.en.md)
teaches — means giving it four parameters, past this repository's own three-parameter
cap. The function isn't merely long; it's long in a way ordinary extraction can't shorten
without either breaking that rule or inventing a type to smuggle values past it.

## The target

**Replace Function with Command**: turn the seven local values into fields on a
`ScoreSeatBlockCommand`, built once per candidate block. With nowhere left for a parameter
to go, the three phases become three private methods, each reading and writing only
`this.*`. `execute()` returns the total a ranking caller sorts by; `breakdown()` reads back
the parts, for a caller that wants to explain a score rather than just compare it.

## Done when

- `ScoreSeatBlockCommand` has one field per value the original function threaded between
  its phases, and three private methods — one per phase — each taking zero parameters.
- `rankSeatBlocks` and `explainTopBlock` build a command and call `execute()` (and, for the
  explanation, `breakdown()`) instead of calling a scoring function directly.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/11-apis/09-replace-function-with-command/solutions`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. `tests/callers.spec.ts` imports only
`rankSeatBlocks` and `explainTopBlock` — never the scorer by name, because turning a
function into a class is the entire point.

## Hints

<details>
<summary>Where do I start?</summary>

Not by inventing fields. Wrap `scoreSeatBlock`'s existing body in a class first — a
constructor taking `block` and `request`, an `execute()` method that is the old function's
body with `this.` in front of the parameters, nothing else changed. Have the old function
delegate to it. Nothing a caller sees can move yet, which is exactly the point: you've only
given the calculation a home.
</details>

<details>
<summary>Do I promote all seven temps to fields in one commit, or one at a time?</summary>

One commit for all seven is fine here, and it's the exception rather than the rule in this
repository. Each promotion is the same mechanical change — `const x = ...` becomes
`this.x = ...` — and none depends on another completing first, so there's no intermediate
state worth freezing a commit at. Compare that to moving two different callers onto a new
API one at a time, which *is* worth splitting, because each could reveal a different bug.
</details>

<details>
<summary>Why does `combine` need four fields but only three phases are mentioned?</summary>

Count again: phase 1 produces three raw facts, phase 2 turns each into a weighted number
*and* also carries the aisle bonus forward, so phase 3 (`combine`) reads four values —
`locationScore`, `priceScore`, `aisleBonus`, `fragmentationPenalty`. As a plain function,
`combine` would need those four as parameters. As a method, it needs none, because they're
already fields.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 11, *Replace Function with Command*; chapter 3,
*Long Function*.
