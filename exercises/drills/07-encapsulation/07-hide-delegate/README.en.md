[🌐 English](./README.en.md)

# Hide Delegate

`Chapter 7` · `Hide Delegate` · `●●○` · ~25 min

## Context

The Marlowe Community Library's front desk software needs one number constantly: how many
items a member may have on loan at once. That number depends on the member's membership,
which depends on their tier. Nothing about loans has ever needed to know a member's tier
*name* — only the limit that tier carries.

## The smell

**Message Chains.** Six functions in `loan-desk.ts` — the everyday operations a front-desk
screen calls — all reach for the same value the same way:
`member.membership().tier().loanLimit()`. Each is a client walking through three objects
to get to a fourth. None of the six cares that a `Membership` or a `Tier` exists; they only
ever wanted the number at the end of the chain.

## The target

**Hide Delegate**, applied twice: `Membership` grows a `loanLimit()` that hides `Tier`
behind it, then `Member` grows a `loanLimit()` that hides `Membership` behind *that*. Every
call site collapses to `member.loanLimit()`, and the two accessors the chain used to walk
through — `Member.membership()` and `Membership.tier()` — no longer need to be public.

## Done when

- No call site in the solution writes more than one dot in a row to reach a loan limit.
- `Member` exposes `loanLimit()`; `Membership.tier()` and `Member.membership()` are gone,
  not merely unused.
- `Member`'s public surface — `id`, `name`, `loanLimit()` — and the six `loan-desk.ts`
  functions are unchanged from the outside.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/07-encapsulation/07-hide-delegate/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

At the far end of the chain, not the near end. Give `Membership` a `loanLimit()` that
forwards to `Tier` first — that shortens the chain to `member.membership().loanLimit()`
everywhere, and every call site still compiles between steps. Only once that is done and
green does hiding `Membership` behind `Member` become a one-class problem instead of a
two-class one.
</details>

<details>
<summary>Do I update all six call sites in one commit?</summary>

You can, once `Member.loanLimit()` exists — mechanically it is the same edit six times, and
splitting it six ways would not tell a reviewer anything the first one didn't. What should
not happen in that same commit is deleting `Membership.tier()` or `Member.membership()`.
Confirm nothing still calls them, *then* delete — a separate, smaller commit that is either
trivial or reveals you moved too fast.
</details>

<details>
<summary>Do `Member.loanLimit()` and `Membership.loanLimit()` end up calling each other in
a chain of their own?</summary>

Yes, and that is fine — `Member.loanLimit()` calls `this.#membership.loanLimit()`, one hop,
using a field it already holds privately. Hide Delegate does not remove the navigation; it
moves it inside the object that already had a reference, where a chain of private field
reads costs nothing a reader outside the class ever sees.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Hide Delegate*; chapter 3, *Message Chains*.
