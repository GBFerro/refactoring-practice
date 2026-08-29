[🌐 English](./README.en.md)

# Encapsulate Record

`Chapter 7` · `Encapsulate Record` · `●○○` · ~25 min

## Context

The Marlowe Community Library tracks every checkout as a loan: one member, one item, a
due date, and however many times it has been renewed. A loan is created at the circulation
desk, read at the returns desk, read again by the overdue-fines report, and written to
whenever it is renewed or handed back.

## The smell

**Mutable Data**. `Loan` is a plain interface with `dueOn`, `returnedOn`, and
`renewalCount` as ordinary public fields, and four different files hold a reference to a
loan and do something with it — two of them assign straight into those fields. Nothing
distinguishes an intended write from an accidental one: `loan.dueOn = "2026-01-01"`
compiles from any file that imports the type, today or in whichever file gets added next.

## The target

**Encapsulate Record**: turn the interface into a class, and let every field earn its
getter by having an actual caller that reads it. The two operations that legitimately
change a loan — renewing it, returning it — become named methods on the class instead of
assignments scattered across the files that happen to perform them. When you are done, no
file outside `loan.ts` can assign into a loan's fields; try it, and TypeScript should
refuse to compile, not just discourage it by convention.

Which fields get a public getter, once the writes are safely behind methods, is the
judgement call this drill actually turns on — see `WALKTHROUGH.md` for the three options it
weighs and which one the solution commits to.

## Done when

- `Loan` is a class, not an interface, and `dueOn`, `returnedOn`, and `renewalCount` are
  private.
- Renewing and returning a loan are both named methods on `Loan`; no file outside
  `loan.ts` assigns to any of its fields.
- `npm run lint:strict -- exercises/drills/07-encapsulation/01-encapsulate-record/src` is
  clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Turn the interface into a class first, with every field still public and every method still
missing. Nothing outside `loan.ts` has to change for this step, and the suite stays green
with zero behaviour change — you have reshaped the type, not moved anything out of it yet.
</details>

<details>
<summary>Which write do I move first?</summary>

`returnLoan` is one assignment; move it onto the class first. `renewLoan` reads two fields
before it writes two more, so it is more likely to reveal a mistake — do it once the
smaller move has proven the pattern.
</details>

<details>
<summary>Do `dueOn`, `returnedOn`, and `renewalCount` all need a getter?</summary>

Only if something already reads them. Check `status.ts` and `overdue.ts` before adding a
getter for a field neither one touches — a getter written for a caller that does not exist
yet is a guess, not an encapsulation.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Encapsulate Record*; chapter 3, *Mutable Data*.
