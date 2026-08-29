[🌐 English](./README.en.md)

# Extract Class

`Chapter 7` · `Extract Class` · `●●○` · ~30 min

## Context

The Marlowe Community Library keeps one record per member: who they are, when they
joined, and how the front desk should reach them about a hold or an overdue item. It has
worked this way since the catalogue system was first built, and every renewal notice and
pickup slip reads straight off it.

## The smell

**Large Class.** `Member` carries eleven fields and seven methods, but they do not all
belong to the same story. `membershipSummary()` reads two fields and nothing else does;
`mailingAddress()`, `formattedPhone()`, and `contactLine()` read the other seven and never
touch membership data. Two clusters, one class, and no method that needs both.

## The target

**Extract Class**, once, for the contact cluster: a new class holding the address, phone,
email, and preferred-contact-method fields, plus the formatting rules that only ever read
them. `Member` keeps the same public methods it has today — they just forward.

## Done when

- The contact fields and their formatting rules live on a class of their own, not on
  `Member`.
- `Member`'s public methods — `mailingAddress()`, `formattedPhone()`, `contactLine()`,
  `membershipSummary()`, `summaryCard()`, `id`, `name` — are unchanged from the outside.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/07-encapsulation/05-extract-class/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

With the field list and the method list, not with the code. Write down which methods read
which fields. The cluster that never touches the rest of the class is the one you are
extracting — you should be able to point at it before you write a line of the new class.
</details>

<details>
<summary>What does the new class's constructor take?</summary>

Not the whole `MemberProps` object — that would let the new class see fields it has no use
for, which is its own small lie. Build an explicit object naming only the fields the new
class needs, even though `MemberProps` would satisfy the narrower type without complaint.
</details>

<details>
<summary>Does `Member` still need to expose all four contact methods?</summary>

Yes, for this drill — the public API is frozen, so the tests exercise `Member` exactly as
they did before. That means some forwarding methods are the price of this particular move,
not a sign you have done something wrong.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Extract Class*; chapter 3, *Large Class*.
