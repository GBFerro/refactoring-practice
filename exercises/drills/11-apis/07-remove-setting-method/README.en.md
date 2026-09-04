[🌐 English](./README.en.md)

# Remove Setting Method

`Chapter 11` · `Remove Setting Method` · `●●○` · ~25 min

## Context

The Halliday Box Office prints a physical stub for every ticket it issues, and the serial
printed on that stub is also the key the box office looks the ticket up by later — at the
door, and when a customer calls about a refund. `TicketOffice.issueTicket` builds the
ticket, gets a serial from the printer, and hands the ticket back.

## The smell

**Mutable Data.** `Ticket` has a `setId` method, and today exactly one caller uses it,
exactly once, immediately after building the ticket — because the real serial isn't known
until the printer assigns it. That single, disciplined use is not the problem. The problem
is what the method's signature promises to everyone else: `setId` is public, permanent, and
callable on any `Ticket` anyone is holding, at any point in its life, long after
construction — even though nothing in this domain ever legitimately reassigns a ticket's
serial. The setter is a claim about the object's lifecycle, and the claim is false.

That claim is already causing a bug. `issueTicket` files the new ticket into a lookup map
*before* calling `setId`, so the map ends up keyed by the placeholder id the ticket was
built with, not the real serial it leaves with. `findById` cannot find a ticket by the id
printed on its own stub.

## The target

**Remove Setting Method**: require the id at construction, delete `setId`, and let the
compiler prove nothing outside the constructor can ever set it again. One field on this
class — `holderName` — genuinely does need to stay settable after construction (a ticket
can be transferred to someone else before the show), so the exercise is also about telling
those two apart correctly, not about deleting every setter you find.

## Done when

- `Ticket` has no method that can change `id` after construction; the id is a constructor
  parameter and nothing else.
- `transferTo` still exists and still changes `holderName` — this drill does not remove it.
- No function in `src/` is longer than 12 lines, nests deeper than 2, or takes more than
  3 parameters —
  `npm run lint:strict -- exercises/drills/11-apis/07-remove-setting-method/solutions`
  is the check.
- `npm test` was green after every single step along the way.

This drill declares `apiFrozen: false` and `fixesBug: true`. `tests/ticket-office.spec.ts`
imports only `TicketOffice` — never `Ticket`'s constructor by its exact shape, because that
shape is exactly what changes. It also does not pin whether a freshly issued ticket is
findable by its own id right away: the challenge and a correct solution disagree there on
purpose. The proof that the solution is right lives in `tests-fixed/`; read it once you're
done; it spells out exactly what was wrong.

## Hints

<details>
<summary>Where do I start?</summary>

Add the id as a constructor parameter without removing `setId` yet, and without touching
`issueTicket`. Nothing observable can change while the old setter still exists and nothing
calls the new parameter — that's the point of doing it first.
</details>

<details>
<summary>What's actually keyed wrong in the box office code?</summary>

Read `issueTicket` in the order its three lines execute. The ticket is built, then filed
into the map, then given its real id. Which of those three lines is using a value that
hasn't been assigned yet?
</details>

<details>
<summary>Why doesn't `readonly` alone fix this?</summary>

Try adding `readonly` to the id field while `setId` still exists. TypeScript will point
straight at `setId`'s own assignment and refuse to compile. A setter and a `readonly`
field cannot coexist in the same class — which tells you something about which one has to
go first.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 11, *Remove Setting Method*; chapter 3, *Mutable
Data*.
