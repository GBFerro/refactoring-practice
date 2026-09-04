[🌐 English](./README.en.md)

# Introduce Special Case

`Chapter 10` · `Introduce Special Case` · `●●○` · ~25 min

## Context

Fernbank Clinic sees people before their paperwork catches up with them — someone brought
in by a relative with no wallet on them, a phone booking taken before the chart is opened.
Until registration is complete, the front desk represents that visit with a placeholder
patient record: a sentinel id, `"unknown"`, standing in for a name, a phone number, an
insurance provider, none of which exist yet. Nine different parts of the clinic's software —
the waiting-room board, billing, reminders — each need to behave differently for that one
record than for every other patient.

## The smell

**Repeated Switches.** Nine functions in `patient-board.ts` each check
`patient.id === "unknown"` independently and supply their own pair of answers for the two
cases. It isn't a literal `switch` statement anywhere in the file, but it's the same
condition tested nine separate times, which means adding a tenth caller means finding and
copying a ninth one correctly — and one of the nine already didn't: `isBillable` checks
`patient.id === "Unknown"`, capital U, a typo that never matches the sentinel every other
function uses. An unidentified patient reads as billable because of it.

## The target

**Introduce Special Case**: give `Patient` itself the nine already-resolved answers —
`displayName`, `insuranceLabel`, `isBillable`, and so on — computed once, by exactly two
factories, `registeredPatient` and `unknownPatient`. Every board function becomes a single
field read. There is no comparison left anywhere for a tenth caller, or a typo, to get
wrong.

## Done when

- No function in `patient-board.ts` compares `patient.id` (or anything like it) to a
  literal string. Every one of the nine reads a field off `Patient` instead.
- `unknownPatient()` and `registeredPatient()` are the only two places that decide what an
  unidentified patient's board line, insurance label, billing status and so on should be.
- `isBillable(unknownPatient())` is `false` — see `tests-fixed/` for the check the shared
  suite can't run.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/10-conditional-logic/05-introduce-special-case/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Don't touch `patient-board.ts` first. Give both factories in `patient.ts` the nine resolved
fields the board functions will eventually read, leaving the raw data and every existing
check exactly where it is. The suite stays green because nothing reads the new fields yet —
you're building the destination before you touch the source, the same order
`drill-08-01`'s *Move Function* and `drill-09-03`'s *Replace Derived Variable with Query*
both use.
</details>

<details>
<summary>I don't see a test that fails on the buggy version. Is the bug real?</summary>

It's real — call `isBillable(unknownPatient())` yourself against the code in `src/` and
compare it to the same call against a fixed version. They disagree. The shared suite in
`tests/` can't assert on that disagreement, for the same reason `drill-09-03`'s can't: the
same spec file has to pass against the buggy challenge too, and no single expected value
does both. The proof lives in `tests-fixed/`, which only ever runs against solutions — read
it once you've finished, not before.
</details>

<details>
<summary>Do all nine board functions need to change the same way?</summary>

Yes, and that uniformity is the point — if seven of them read a field and two of them kept
their own `if`, you'd still have two places left for the next typo. Do them in two or three
small batches rather than one, so a mistake in any one field is easy to isolate, but the end
state has zero comparisons left in the file.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 10, *Introduce Special Case*; chapter 3, *Repeated
Switches*.
