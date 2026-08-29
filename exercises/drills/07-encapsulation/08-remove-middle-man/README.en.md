[🌐 English](./README.en.md)

# Remove Middle Man

`Chapter 7` · `Remove Middle Man` · `●○○` · ~20 min

## Context

The Marlowe Community Library's branch directory tracks which manager runs each branch —
their name, their contact details, whether they're currently certified to approve a rare
book loan, whether they're on leave. Branch operations code — the escalation card, the
seniority badge on the staff roster — reads all of it.

## The smell

**Middle Man.** `Branch` has six public methods — `managerName()`, `managerEmail()`,
`managerPhone()`, `isManagerCertifiedForRareBooks()`, `managerYearsOfService()`,
`isManagerOnLeave()` — and every one of them is a single line forwarding to `Manager`.
`Branch` adds no logic, makes no decision, and holds no state the six methods don't just
pass through. It has become a wrapper around an object every caller already knows exists.

## The target

**Remove Middle Man**, once: delete all six forwarding methods, make `manager` a public
field on `Branch`, and let the six `branch-ops.ts` functions that used to call
`branch.managerName()` and its siblings call `branch.manager.name()` and its siblings
directly.

## Done when

- `Branch` has no method that only forwards to `Manager`.
- `Branch.manager` is a public field, and every branch-ops call site reads it directly.
- The six exported functions in `branch-ops.ts` — `formatManagerCard`,
  `canApproveRareBookLoan`, `managerSeniorityBadge`, `escalationContact`,
  `managerEmailDomain`, `totalYearsOfService` — are unchanged from the outside.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/07-encapsulation/08-remove-middle-man/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Count first, not last. List `Branch`'s public methods next to what each one's body does.
If every single one is `return this.#manager.something()` with nothing else in the method,
you already have your answer before you've changed a line — the count itself is the
argument for this refactoring, not something you work out afterward to justify it.
</details>

<details>
<summary>Do I delete the forwarding methods before or after updating the callers?</summary>

After. Make `manager` public and update every call site in `branch-ops.ts` to go through it
first, with the forwarding methods still sitting on `Branch`, unused. Only once the suite is
green with nothing calling them does deleting them become a step that removes dead code
instead of a step that might break a caller you missed.
</details>

<details>
<summary>Compare this against `drill-07-07` — isn't hiding a delegate the opposite advice?</summary>

They can both be right, about different objects. [`drill-07-07`](../07-hide-delegate/README.en.md)
hides a delegate that six unrelated call sites had no reason to know about. Read this
drill's `WALKTHROUGH.md` for the count that tells the two cases apart — it isn't "always
hide" or "always expose," it's a question you answer per class.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Remove Middle Man*; chapter 3, *Middle Man*.
