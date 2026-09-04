[🌐 English](./README.en.md)

# Replace Constructor with Factory Function

`Chapter 11` · `Replace Constructor with Factory Function` · `●●●` · ~35 min

## Context

The Halliday Box Office sells three kinds of ticket at the counter — standard, premium,
and a free comp ticket a staff member has to authorize — and also imports a batch of
tickets at once from a spreadsheet handed over by a partner venue.

## The smell

**Primitive Obsession.** Every ticket is built the same way: `new Ticket(type,
faceValueCents, authorizedBy)`, where `type` is a raw string standing in for three
genuinely different things to construct. The constructor itself does the deciding — a
`premium` ticket gets marked up and perked differently from a `standard` one, and a `comp`
ticket with no authorizing staff member on file makes the constructor throw, because a
constructor has no other way to say no. `importTickets`, which builds a whole batch of
tickets from spreadsheet rows, has to wrap every single row in a `try`/`catch` just to keep
processing the rest after one bad one.

## The target

**Replace Constructor with Factory Function**: give `Ticket` a private constructor and
three named static factories — `Ticket.standard`, `Ticket.premium`, `Ticket.comp` — each
doing exactly the validation and computation its own kind needs, with `Ticket.comp`
returning `null` instead of throwing when it can't build a valid ticket. The one caller
that only has a runtime type string, not a name it can write in source, still has to turn
that string into a choice; that single dispatch point is the only place a type code
survives.

## Done when

- `Ticket`'s constructor is `private` — `new Ticket(...)` from outside `ticket.ts` does not
  compile.
- `sellStandardTicket`, `sellPremiumTicket`, and `issueCompTicket` keep their exact
  signatures, and none of them contains a `try`/`catch` around building a ticket.
- Building a comp ticket with no authorizing staff member returns `null`; nothing throws.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/11-apis/08-replace-constructor-with-factory-function/solutions`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false`. `tests/callers.spec.ts` imports only the four
callers — `sellStandardTicket`, `sellPremiumTicket`, `issueCompTicket`, `importTickets` —
never `Ticket`'s constructor, because replacing it is the entire point.

## Hints

<details>
<summary>Where do I start?</summary>

Add the three static factories first, each one still calling `new Ticket(...)` internally
exactly like the constructor already works today. Nothing observable changes yet — you're
only giving the existing behaviour three names. Move one caller onto each factory before
touching the constructor's own body.
</details>

<details>
<summary>What do I do with the `try`/`catch` blocks?</summary>

They exist because the constructor's only way to reject bad input is to throw. Once
`Ticket.comp` can return `null` on its own, the caller that used to catch the exception can
just check the return value instead — and the `try`/`catch` has nothing left to do.
</details>

<details>
<summary>How do I actually stop `new Ticket(...)` from being called from outside?</summary>

Mark the constructor `private`. TypeScript checks this at every call site it can see, the
same as any other access modifier — a static method defined on the class can still call it,
because privacy is scoped to the class declaration, not to which file the code lives in.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 11, *Replace Constructor with Factory Function*;
chapter 3, *Primitive Obsession*. See also chapter 10, *Replace Conditional with
Polymorphism* — [`drill-10-04`](../../10-conditional-logic/04-replace-conditional-with-polymorphism/README.en.md)
is the natural next step if a ticket kind ever needs genuinely different *behaviour*, not
just different numbers.
