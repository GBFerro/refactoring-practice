[🌐 English](./README.en.md)

# Replace Nested Conditional with Guard Clauses

`Chapter 10` · `Replace Nested Conditional with Guard Clauses` · `●●○` · ~25 min

## Context

Fernbank Clinic pays its staff per shift once payroll closes it out: a flat day rate for
salaried staff, an hourly rate with an overtime premium for everyone else. Before any of
that gets calculated, a shift has to actually be payable — the staff member has to still
work there, the shift has to have been completed, and payroll can't have already sent the
money once.

## The smell

**Long Function**, by way of nesting rather than length. `staffPayoutCents` is short — a
few lines shorter than the strict profile's cap, even — but its happy path sits four `if`s
deep, because every precondition wraps the next one instead of exiting on its own. The
function isn't hard to read because it's long; it's hard to read because you can't tell how
much is owed without first holding three separate reasons for "not this shift" open in your
head, none of which have anything to do with each other.

Not every `if` inside it is that kind. One of the four nested conditions isn't a
precondition at all — it's the actual decision the function exists to make, and it deserves
different treatment. Telling the two apart is the point of this drill.

## The target

**Replace Nested Conditional with Guard Clauses**, for the three conditions that only ever
decide *whether* a shift pays out. Each becomes an early return at the top of the function,
flattening the nesting to one level. The fourth condition — salaried versus hourly, which
decides *how much* — stays exactly the shape it already is.

## Done when

- `staff.active`, `shift.status`, and `shift.payoutIssued` are each guarded by their own
  early return, at the top of the function, nested inside nothing.
- The salaried/hourly decision is still an `if`/`else` — not a fourth guard clause.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/10-conditional-logic/03-replace-nested-conditional-with-guard-clauses/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

At the outside, not the inside. Converting the innermost `if` first only de-nests the
smallest piece of the function; converting the outermost `if` first removes a level of
indentation from everything still below it, including the guards you haven't touched yet.
</details>

<details>
<summary>How do I tell which `if`s are guards?</summary>

Ask, for each one: if this branch didn't run, would the function be *done*, or would it be
doing something else entirely? "Not active," "not completed," and "already paid" all mean
there's nothing left to compute — the function's job is finished, and the answer is zero.
"Salaried versus hourly" isn't like that: whichever branch doesn't run, the *other* branch
is still the function doing its actual job, just differently. Guards get flattened. The
decision doesn't.
</details>

<details>
<summary>What happens to the accumulator?</summary>

Once every guard is an early return, the variable that used to catch the innermost branch's
result has nothing left nesting around it. Let the salaried and hourly branches return
directly, and the accumulator has no reason left to exist.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 10, *Replace Nested Conditional with Guard Clauses*;
chapter 3, *Long Function*.
