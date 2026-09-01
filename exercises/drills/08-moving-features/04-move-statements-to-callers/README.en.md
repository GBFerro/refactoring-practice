[🌐 English](./README.en.md)

# Move Statements to Callers

`Chapter 8` · `Move Statements to Callers` · `●●○` · ~20 min

## Context

Ashgrove Bakery Co-op sends a dispatch note out with every stop: what's in it, and who it's
for. Most stops go out with the co-op's own route drivers. A few — customers outside every
route — are handed instead to a paid third-party courier, who is not an Ashgrove employee
and bills by weight rather than by the delivery.

## The smell

**Divergent Change.** One function, `renderDispatchNote`, builds the whole note for both
audiences behind a boolean flag: a driver's note needs the weight in grams and a line
asking them to sign for the delivery; a courier's note needs the weight in kilograms and a
liability line instead. Two people can open this same function for two completely unrelated
reasons — a change to how driver signatures are worded, a change to what the courier's
insurer requires the note to say — and neither change has anything to do with the other.
That is the tell: a function with more than one reason to change is a function serving more
than one master.

## The target

**Move Statements to Callers.** The two closings — weight line plus trailing line — do not
belong inside the shared function; they belong at each call site, where each audience's
needs are already known and don't need a flag to select between them. Done looks like a
small shared function that produces only what is genuinely common to every note, and two
callers that each add their own two lines and know nothing about the other.

## Done when

- `dispatchToDriver` and `dispatchToCourier` no longer share a function that branches on
  which audience is asking.
- The shared function takes no flag, and produces the same lines for both callers.
- Each caller's own weight-unit choice and trailing line are unchanged from what
  `renderDispatchNote` used to produce for it.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/08-moving-features/04-move-statements-to-callers/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Not by deleting the flag. Start by finding the lines both callers genuinely agree on —
probably less than you'd guess — and extracting just those into their own function first.
Everything after that is subtraction: copy each caller's own closing out to meet it, one
caller at a time.
</details>

<details>
<summary>How do I know a line is "genuinely shared" and not just currently identical?</summary>

Ask whether a change one audience asks for would ever need to touch that line. The header
and the item list would look the same no matter who the note is for — nothing about being a
courier versus a driver changes what was ordered. The weight line and the closing line are
different precisely *because* of who's receiving the note. That's the boundary.
</details>

<details>
<summary>What happens to the flag once both callers have their own closing?</summary>

It has nothing left to select between — both of its branches are unreachable from any
caller. That's Change Function Declaration's usual signal, arriving by another route: a
parameter nobody needs any more. Delete the function it belonged to along with it.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 8, *Move Statements to Callers*; chapter 3,
*Divergent Change*.
