# Walkthrough — one ShelfCode, one parser

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and the decision
in the middle that the whole exercise turns on. Read it after you have your own version,
not before.

---

## Before anything: read all three parsers side by side

`cartSection`, `spineLabelSection`, and `sectionTally` each take a shelf code — a string
like `"NF-770-A"` — and each was written by whoever needed a piece of it that week, with no
reason to go looking at the other two:

```ts
// cart-section.ts
return shelfCode.slice(0, 2);

// spine-label.ts
const [section] = shelfCode.split("-");
return section ?? shelfCode;

// section-tally.ts
const match = SHELVED_CODE.exec(raw); // /^([A-Z]{2,3})-[0-9]+(?:\.[0-9]+)?-([A-Z])$/
if (match === null) continue;
```

All three are trying to answer the same question — *what section is this?* — and all three
get it right for the shapes of shelf code that were around when they were written. That is
the whole shape of Primitive Obsession: nothing here looks broken until you line the three
answers up.

## Why this order

Introduce `ShelfCode` first, unused. Then migrate the three callers **one at a time**,
starting with the one whose original logic already agrees with what `ShelfCode` will say,
and ending with the one whose disagreement is the most expensive to leave in place. Doing
all three callers in one commit would bury the moment worth stopping at — the point where
one caller's answer *changes* — inside a diff that reads as a clean sweep.

## Step 1 — `ShelfCode.parse`

```ts
export class ShelfCode {
  readonly raw: string;
  readonly section: string;
  readonly classNumber: string;
  readonly shelfLetter: string | null;

  private constructor(raw: string, match: RegExpExecArray) { /* ... */ }

  static parse(raw: string): ShelfCode {
    const match = SHELF_CODE.exec(raw);
    if (match === null) throw new Error(`not a shelf code: "${raw}"`);
    return new ShelfCode(raw, match);
  }
}
```

**On the name.** `ShelfCode`, not `ShelfLocation` or `Shelfmark`. Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — rules out `Shelfmark`
(a real library term, but not one anyone in this codebase uses) and `ShelfLocation` (this
class does not know where the shelf physically is, only how to read the code that names
it). `ShelfCode` is what the roadmap's own hook calls the thing, which means it is already
the name three separate authors reached for independently — the strongest evidence a name
is right.

**On the name, again.** `parse`, not a public constructor. `new ShelfCode("garbage")`
reads as though building one always succeeds; `ShelfCode.parse("garbage")` reads as
*interpreting* a string, which can fail, and TypeScript lets me make the plain constructor
private so `parse` is the only door in. That is question 1 — does the name say what, or
does it say how — pointed at the call site rather than the body: `parse` promises
"interpretation," which is what actually happens.

The constructor takes `(raw, match)`, not one parameter per field — four would fail this
repository's own strict profile.

## Step 2 — `spineLabelSection`, the safe one first

```ts
export function spineLabelSection(shelfCode: string): string {
  return ShelfCode.parse(shelfCode).section;
}
```

`split("-")[0]` and `ShelfCode.parse(...).section` agree on every shelf code that is
actually well-formed, because a section never contains a hyphen — splitting on the first
one was always going to find it, however long the section runs. This step changes nothing
observable. It exists to prove the class against a caller with nothing to lose before
either of the next two, which do.

## Step 3 — `cartSection`, and the first disagreement

```ts
export function cartSection(shelfCode: string): string {
  return ShelfCode.parse(shelfCode).section;
}
```

Before touching this, I traced it by hand against a three-letter section, because
`slice(0, 2)` is only right if every section is exactly two characters, and three of the
six in this catalogue are not:

```
cartSection("JUV-741-B")        -> "JU"    (slice(0, 2))
spineLabelSection("JUV-741-B")  -> "JUV"   (split on "-")
```

`cartSection` was wrong the entire time a book classified `JUV`, `FIC`, `REF`, or `BIO`
existed. Nobody noticed, because a reshelving cart mislabelled `JU` instead of `JUV` still
gets wheeled to roughly the right aisle by a human who can read the rest of the label — a
bug that degrades gracefully enough to go unfiled.

**On the name.** `ShelfCode.section`, not `.category` or `.group`. `category` fails
question 2 from [`NAMING.md`](../../../../../../docs/NAMING.md) — it could just as well
name the item's Dewey class or the whole catalogue's genre split, so seeing `category` at
a call site tells you nothing about which of those you got. `section` is the word the
three original callers' own variable names already agreed on
(`cartSection`, `spineLabelSection`, `sectionTally`) even while their *logic* disagreed —
another sign the name was never the problem here.

**This is the moment.** Once `cartSection` calls `ShelfCode.parse(...).section`, its answer
for a three-letter section changes from `"JU"` to `"JUV"` — correctly, but *differently*.
None of the tests in this exercise catch it, because none of them hand `cartSection` a
three-letter section; they only exercise the two-letter shapes `cartSection` already got
right (see the note at the top of `tests/sections.spec.ts`). That gap is not an oversight
in the test suite. It is the same gap that let the bug live in production for however long
this code has existed: the safety net has a hole exactly where the bug is, which is usually
true of bugs that survive.

**What I did with that.** I made the change anyway, in its own commit, and I did not write
a new test pinning the corrected answer into this exercise's suite — adding one here would
make the fix look like it was reviewed and signed off as part of *this* refactoring, which
it was not. In a real codebase the right sequence is the other way around: write a failing
test that documents `cartSection`'s current, wrong answer for a three-letter section
*before* refactoring anything, then do `Replace Primitive with Object` in a commit that
provably changes nothing (because the old test still passes), then fix the bug in a
**separate commit** with its own test, its own one-line changelog entry, and its own
review. Refactoring and bug-fixing are different kinds of change with different risk
profiles; a commit that is both is a commit nobody can trust the "refactor" label on.

## Step 4 — `sectionTally`, and the second disagreement

```ts
export function sectionTally(shelfCodes: readonly string[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const raw of shelfCodes) {
    const section = ShelfCode.parse(raw).section;
    tally[section] = (tally[section] ?? 0) + 1;
  }
  return tally;
}
```

A different axis, and a worse bug. The old regex required a trailing `-LETTER`, which
means it required a shelf letter — but a book that has been catalogued and is waiting to be
shelved does not have one yet:

```
sectionTally(["FIC-813"])  -> {}                 (regex requires a shelf letter; no match)
spineLabelSection("FIC-813") -> "FIC"             (never needed one)
```

`{}` is not a wrong count. It is a **missing** one — the book is silently absent from the
monthly report, with no error and no empty-but-present entry to notice. `cartSection`'s bug
mislabels a cart; this one erases a book from a report someone is going to make decisions
from. Once `sectionTally` also goes through `ShelfCode.section`, that book is counted
again — correctly, and, exactly as in step 3, differently, and exactly as uncaught by this
exercise's pinned tests.

I am naming the severity difference on purpose: "fix it later, separately" is the right
call for both, but *later* should not mean *whenever*. A silent data-loss bug earns a
same-day follow-up commit; a mislabelled cart earns a ticket. The refactoring does not know
the difference — only reading what each caller actually does with the wrong answer tells
you that, which is one more reason not to fix both quietly inside the refactor and move on.

**On the name.** I kept `sectionTally`, not `shelvedSectionTally` or
`sectionCountForShelvedItems` — a truer name, now that I know it silently skips anything
without a shelf letter. Question 4 says a name should be true, and strictly it is not: it
tallies *shelved* items only. I left it alone anyway, because renaming it here would read
as documenting the bug rather than fixing it, and a name that advertises a bug is worse
than a slightly-too-broad one that a follow-up commit corrects alongside the behaviour. A
name earns its narrowing at the same time the behaviour does, not before.

## Step 5 — nothing left to parse

Once all three callers ask `ShelfCode`, the old regex, the old `slice`, and the old
`split` have no readers. Deleting them is the only step in this exercise that cannot
change behaviour — there is no caller left to change it for.

## What is left, and what it cost

```ts
export function cartSection(shelfCode: string): string {
  return ShelfCode.parse(shelfCode).section;
}
```

Three one-line functions, one class, and every question about what a shelf code's section
is has exactly one answer to read. That is the win `Replace Primitive with Object` is for.

Now the honest part:

- **The public signatures did not change.** All three functions still take a `string` and
  `sectionTally` still takes `readonly string[]` — `ShelfCode` lives entirely inside this
  module. A more complete reading of this refactoring pushes `ShelfCode` out to the
  boundary too, so a caller elsewhere in the system cannot construct a fresh, un-validated
  shelf code string and hand it in around the object. I stopped at the string boundary
  because nothing in this exercise's scope calls these three functions from outside it, and
  widening a signature nobody outside this module can see yet felt like solving a problem
  that does not exist here. I am not fully confident that is the right call — it is the one
  decision in this walkthrough I would most want a second opinion on.
- **`ShelfCode.parse` throws on a string that matches none of the three original parsers'
  assumptions** — total garbage, not just an edge shape. None of the three original
  functions validated anything; each would have produced *some* string back, silently
  wrong, for `slice`, `split`, or a failed regex match. Throwing is new behaviour, on inputs
  this exercise never had reason to construct, but by the letter of "the refactor changes
  nothing observable," it belongs in the same "separate commit" bucket as the two fixes
  above, not smuggled in for free because it happened along the way.

## If you took a different route

- **Give `ShelfCode` three separately-named accessors that reproduce each caller's
  *original* algorithm** (`sectionBySlice`, `sectionBySplit`, `sectionByFullMatch`),
  migrate the three callers to those, and only *then*, in a clearly separate commit,
  collapse them onto one canonical `.section`. This is the more conservative version of
  this exercise, and in a codebase where `cartSection` mislabelling a cart mattered more,
  it is arguably the more correct one — it makes step 3 and step 4's behaviour changes
  impossible to miss in review, because they become their own diff. I did not take this
  route here because three near-identical accessor names on one class is a worse teaching
  example of what `Replace Primitive with Object` is *for*, even though it is a safer one.
- **More section lengths than the two used here.** Changes how convincing the trace is,
  not the mechanics.

What is *not* a matter of taste: leaving the regex, the `slice`, and the `split` in three
separate files after `ShelfCode` exists. A `Replace Primitive with Object` that adds a
class without deleting the ad hoc parsing it was supposed to replace has done the easy
half and stopped.

## Where TypeScript makes this different from the book's JavaScript

`SHELF_CODE.exec(raw)` returns `RegExpExecArray | null`, and with this repository's
`noUncheckedIndexedAccess` on, every captured group — `match[1]`, `match[2]`, `match[3]` —
is typed `string | undefined`, not `string`, even for a group the pattern guarantees is
present once `match` is non-null. The book's JavaScript has no such thing to satisfy; here,
every capture needs a fallback (`match[1] ?? ""`) that never actually triggers, or a second
narrowing check the regex has already made redundant. I chose the fallback — it is one
character of runtime cost against a string the pattern already proved is there — rather
than adding a branch whose job is only to convince the compiler.

The `private constructor` is also doing work JavaScript's version of this exercise could
only ask for in a comment: nothing outside `shelf-code.ts` can build a `ShelfCode` except
through `parse`, so a `ShelfCode` with a `section` that does not match its own `raw` is not
just discouraged, it is unrepresentable. That is a real difference in what "the object" in
`Replace Primitive with Object` is able to guarantee, not a stylistic one.

Run `./rp review 07-03` if you want a second opinion on the route you actually took — it
builds a packet that deliberately withholds this file from the reviewer, so you get judged
on your own terms rather than on your resemblance to me.
