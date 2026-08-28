[🌐 English](./README.en.md)

# Inline Function

`Chapter 6` · `Inline Function` · `●○○` · ~20 min

## Context

Silverbrook Athletics Club runs courses with different entry rules: some are open to
anyone, some are members-only, and the club's elite corral asks for a qualifying time. A
previous volunteer wrote `isEligible` for the registration form, and — trying to be
tidy — gave every single condition its own function. The form works. Nobody who has
touched this file since has enjoyed reading it.

## The smell

**Lazy Element**: seventeen functions, most of them one line long, several of them doing
nothing but calling another one-line function. `getRunnerAge(runner)` returns
`runner.age`. `passesAgeCheck(runner, course)` returns `meetsAgeRequirement(runner,
course)` — the same value, under a second name, for no reason the code states. A function
whose body is no clearer than its name is not documentation. It is a place you have to
stop and look, for nothing.

Three call chains in this file run four functions deep before reaching a single field
read. None of that depth is buying the reader anything.

## The target

**Inline Function**, repeatedly, replacing each call with the callee's body and deleting
the callee — until every function left in the file is one a reader would genuinely miss if
it were gone. Not every function goes. This drill's judgement call is telling the ones that
were only ever forwarding a name apart from the ones whose body earns the name in front of
it: a real branch, a magic number worth explaining, a double negative worth untangling.
Fowler's own note applies directly here: if you have to look *inside* a function to know
whether it is worth keeping, that itself is data.

## Done when

- `isEligible` and its remaining helpers contain no function whose entire body is a single
  field read.
- Every function that survives can be justified in one sentence that is not "it existed
  before."
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/06-first-set/02-inline-function/src` is the
  check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

At the bottom, same as always — but here "the bottom" means the field getters
(`getRunnerAge`, `hasClubLicense`, `getQualifyingSeconds`, and the rest), not the smallest
function in the call graph. Each one has exactly one job: read a field and rename it.
Inlining them is the safest possible first move, and it shortens every function above them
before you have made a single judgement call.
</details>

<details>
<summary>Two of these fields get read from two different places.</summary>

`getRunnerAge` and `getQualifyingSeconds` each have two call sites in two different rules.
Inline one call site, and the function still has a reason to exist — leave the declaration
alone until the second call site is handled too. Deleting it early is a compile error, not
a subtle bug, but it will stop you mid-step if you are not expecting it.
</details>

<details>
<summary>How do I know which ones to keep?</summary>

Ask, for each surviving candidate: if I inlined this one, would the caller get *harder* to
read, not just longer? A branch cannot fold into a one-line boolean chain without
restructuring the caller — that is a real reason to keep it. A magic number sitting next
to a structurally identical but unrelated comparison is a real reason. "It's already named"
is not a reason; neither is "it might be reused."
</details>

## Reading

*Refactoring*, 2nd edition — chapter 6, *Inline Function*; chapter 3, *Lazy Element*.
