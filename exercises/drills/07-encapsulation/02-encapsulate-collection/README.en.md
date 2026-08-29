[🌐 English](./README.en.md)

# Encapsulate Collection

`Chapter 7` · `Encapsulate Collection` · `●●○` · ~30 min

## Context

The Marlowe Community Library caps how many items one member can have out at once, and
tracks what's currently on loan to each of them. A member's account is created at sign-up,
grown by every checkout, shrunk by every return, and read whenever the front desk wants to
know what's due soon.

## The smell

**Mutable Data**. `MemberAccount.loans` is a plain, public, mutable array field, and four
different files hold an account and reach into it directly — two of them push and splice
straight into it. Nothing distinguishes a checkout going through the borrowing limit from
one that doesn't: `account.loans.push(anything)` compiles from any file that imports the
type.

## The target

**Encapsulate Collection**: the array stops being reachable at all. `borrow`, `returnItem`,
and `loansDueSoon` become methods on the account, and every one of this file's existing
callers goes through them. There is no `getLoans()` — not because it was forgotten, but
because deciding what a getter for a whole collection should hand back is the actual
question this drill exists to make you answer.

This drill assumes [`drill-07-01`](../01-encapsulate-record/README.en.md). Read that one
first if you haven't: it does the same thing for a record's individual fields, and this
drill's `WALKTHROUGH.md` opens by showing why the same recipe does not close the collection
version of the problem.

## Done when

- No file outside `account.ts` reads or writes `.loans` on a `MemberAccount`.
- Nothing exported from this exercise returns the live array, a copy of it, or a read-only
  view of it — every caller's need is answered by a purpose-built method instead.
- `npm run lint:strict -- exercises/drills/07-encapsulation/02-encapsulate-collection/src`
  is clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Turn the interface into a class first, `loans` still public, no methods yet. Nothing
outside `account.ts` has to change for this step, same as 07-01 — you're reshaping the
type, not moving anything out of it.
</details>

<details>
<summary>Isn't `get loans(): Loan[] { return this.#loans; }` the same move as 07-01?</summary>

Try it. It compiles, the tests stay green, and `account.loans.push(fakeLoan)` still works
from any file that calls the getter — the privacy stops assigning a new array, not
mutating the one you already have. A getter that returns a private field is not the same
guarantee as a getter that returns a primitive. `WALKTHROUGH.md` opens with this exact trap.
</details>

<details>
<summary>What does `loansDueSoon` return, if not the matching loans?</summary>

Ask what the caller actually wants: which items, due when, in how many days. Build a type
for that answer and construct it fresh inside the method — not a filtered slice of
`#loans`, which would still be handing out something collection-shaped. Once you've done
that once, ask whether any caller in this file still needs "the loans" in any form.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Encapsulate Collection*; chapter 3, *Mutable
Data*.
