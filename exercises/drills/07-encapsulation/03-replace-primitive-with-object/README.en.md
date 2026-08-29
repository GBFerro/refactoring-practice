[🌐 English](./README.en.md)

# Replace Primitive with Object

`Chapter 7` · `Replace Primitive with Object` · `●●○` · ~35 min

## Context

Every item at the Marlowe Community Library has a shelf code — a string like `"NF-770-A"`
that names its section, its class number, and the letter of the shelf it sits on within
that class. Three different parts of the system need a piece of that code: the reshelving
cart grouping, the spine label printer, and the monthly collection tally. Each was written
independently, by someone who read the shelf code the way that made sense for the one job
in front of them.

## The smell

**Primitive Obsession**. The shelf code lives everywhere as a bare `string`, and there is
no single place that knows how to read one — `cartSection` reads it with `.slice(0, 2)`,
`spineLabelSection` with `.split("-")`, and `sectionTally` with a regular expression. All
three agree on the shelf codes anyone happened to test against. They do not agree on every
shelf code the catalogue actually contains, and nothing in the code says so.

## The target

**Replace Primitive with Object**: one `ShelfCode` class that parses the string once and
answers `section`, `classNumber`, and `shelfLetter` the same way for every caller. When you
are done, no file outside the class touches the raw string with a `slice`, a `split`, or a
regex of its own.

Consolidating three parsers that disagree forces a decision none of them made explicitly:
which one was right. Making that decision — and knowing what to do with the two that were
wrong — is most of what this drill is actually about; see `WALKTHROUGH.md` for how it goes.

## Done when

- `ShelfCode` exists, and `cartSection`, `spineLabelSection`, and `sectionTally` all read
  their answer from it instead of parsing the raw string themselves.
- No file outside `shelf-code.ts` runs a `slice`, a `split`, or a regex against a shelf
  code.
- `npm run lint:strict -- exercises/drills/07-encapsulation/03-replace-primitive-with-object/src`
  is clean.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Add `ShelfCode` first, without changing any of the three callers. The suite stays green
because nothing observable has moved yet — you are only proving the class exists and
compiles before anything depends on it.
</details>

<details>
<summary>Which caller do I migrate first?</summary>

Whichever one's current answer you can already show agrees with what `ShelfCode` will say
on every shape of shelf code in the catalogue, not just the ones under test. Save the ones
you cannot show that for until you have somewhere safe to land the surprise.
</details>

<details>
<summary>Two of the callers disagree with the third once I switch them over. Do I fix that
here?</summary>

Trace all three functions by hand against a shelf code shaped differently from the ones the
tests use — a section that is not two letters, or a code with no shelf letter yet. If two
of the three change their answer once they go through `ShelfCode`, that is real, and it is
not something this refactoring gets to fix quietly on the way past. `WALKTHROUGH.md` says
what to do with it instead.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Replace Primitive with Object*; chapter 3,
*Primitive Obsession*.
