[🌐 English](./README.en.md)

# Consolidate Conditional Expression

`Chapter 10` · `Consolidate Conditional Expression` · `●●○` · ~25 min

## Context

Fernbank Clinic keeps same-day appointment slots for patients who need to be seen urgently:
a high triage score, an infant, someone with a chronic condition on file. A fourth signal —
a nurse flagging a patient for review — also earns a slot, and pages the on-call nurse when
it fires. `isEligibleForSameDaySlot` decides which patients qualify.

## The smell

**Duplicated Code.** Four separate `if` statements, each setting the same `eligible` flag
to `true`, scattered down the function instead of read as the one rule they actually are:
"any of these four things makes a patient eligible." Three of them genuinely are
interchangeable ways of writing that rule. Read the fourth closely before you believe all
four are, though — that's the whole point of this drill, and rushing past it is how you
introduce a bug while "cleaning up."

## The target

**Consolidate Conditional Expression**: combine the `if`s that share both a consequence and
the absence of a side effect into a single boolean expression, then give that expression a
name. Where `drill-10-01` takes one tangled condition and gives its *parts* names, this
drill does the mirror image — it takes several separate conditions that turn out to already
be one idea, and gives the *whole* a single name. Read that drill first if you haven't; the
two are easy to blur together and worth telling apart on purpose.

"Done" here isn't "all four `if`s become one." It's three becoming one, and the fourth
staying exactly where it is, for a reason the code says out loud.

## Done when

- The three side-effect-free conditions are combined into one named function.
- The fourth condition — the one with a side effect — is still evaluated on every call,
  regardless of what the other three decide.
- `isEligibleForSameDaySlot` no longer has a mutable `eligible` flag.
- `npm run lint:strict -- exercises/drills/10-conditional-logic/02-consolidate-conditional-expression/src`
  is clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Before merging anything, check each of the four conditions for a side effect: does
evaluating it do anything besides answer a question? Three don't. One pages a nurse. Find
that one before you touch any code — it decides everything about the route from here.
</details>

<details>
<summary>Why can't I just merge all four with `||`?</summary>

`||` short-circuits: `a || b` never evaluates `b` once `a` is already `true`. Four separate
`if` statements don't short-circuit anything — each one is checked regardless of what the
others decided. Fold a side-effecting condition into an `||` chain and you change *when* it
runs, which for a condition with no side effects is invisible and for one that pages a
nurse is a real behaviour change. One of the tests is built specifically to catch this.
</details>

<details>
<summary>So does the fourth condition just stay as its own `if` forever?</summary>

Its own named function, at least — extract it same as you would any of the others, just
don't fold its call into the `||` chain the other three end up in. It should still be
called on every invocation, independent of what the merged condition returns. See the
walkthrough for exactly where that call needs to sit and why the order matters.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 10, *Consolidate Conditional Expression*; chapter 3,
*Duplicated Code*.
