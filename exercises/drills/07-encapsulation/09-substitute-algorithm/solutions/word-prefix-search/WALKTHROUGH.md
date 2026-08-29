# Walkthrough — rank by word match, sort, map

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the tests had to prove before the move
was even attemptable, and what it cost. Read it after you have your own version, not
before.

---

## This one is not like the others in this module

Every other drill in chapter 7 is provably behaviour-preserving by inspection. Encapsulate
Record, Hide Delegate, Remove Middle Man — put the before and after side by side and *see*
that nothing changed: the same field is read, the same call happens one hop further away,
the same six lines got deleted because nothing called them. The structure survives the
move. That is what makes them mechanical.

Substitute Algorithm has no such property. The old `firstMatchingWord` walks the title one
character at a time, tracking word boundaries and comparing letters in a hand-written loop.
The new one calls `.split`, `.findIndex`, and `.startsWith`. There is no line-by-line
correspondence to check — the two share no structure at all, only an input type and (if you
did this right) an output. You cannot read the diff and know it is safe the way you can for
a Rename Variable. **The only thing making this move safe is the test suite in
`tests/title-search.spec.ts`, and if that suite is wrong or incomplete, nothing else in this
exercise will tell you the new algorithm disagrees with the old one.**

That is why this drill's suite is the richest in the module — ten tests, where most drills
run five to nine — and why two of them exist for a reason none of the other drills share.

## Before anything: what does the old algorithm actually promise?

Read `src/title-search.ts` before you touch it and ask, for every branch: is this
*intentional*, or just what the loop happens to do? Two things in the old scan are the
second kind, and finding them is the actual exercise, not a warm-up for it:

**The tie-break.** `insertByRank` walks the already-ranked list and stops at the first
entry whose rank is strictly worse, inserting just before it. Nobody decided "ties keep
catalogue order" — it fell out of using `<=` instead of `<` in the stop condition, over an
array built by iterating the catalogue in order. Flip that one operator and ties would come
out in *reverse* catalogue order instead, just as quietly. Real behaviour, and nothing in
the function states it.

**The empty query.** With an empty `lowerQuery`, the comparison loop's stop condition
(`i < lowerQuery.length`) is `0 < 0` and never runs, so `matchesPrefix` returns `true`
immediately — every word "starts with" the empty string. Nobody wrote
`if (query === "") return everything`; it is a consequence of the loop bounds, not a
decision.

Both are pinned by name in the test file, before either algorithm is touched — `"keeps
entries tied on the same rank in catalogue order, not alphabetical order"` and `"returns the
whole catalogue, in catalogue order, for an empty query"`.

If you rewrite the scan without finding these first, you will likely still handle the common
cases and just as likely write a *reasonable-looking* rewrite that gets one of these two
wrong: a `.sort()` that isn't stable, or a defensive `if (!query) return []` that feels like
better behaviour than "match everything" and is not what the old code did. Either one passes
every test except the one written for exactly that case — which is what the two are for.

## Why this order

Leaves first, same principle as every other drill in this module: `matchesPrefix` depends
on nothing, the word-splitting loop depends on `matchesPrefix`, and the ranking shell
depends on the word split existing. The step that reorders things — Step 3 — goes **last**,
for the same reason Steps 2 and 3 were split apart in `drill-06-01`: it is the step most
able to change behaviour without anyone noticing, so it gets taken with the least else
going on around it.

## Step 1 — the prefix check

```ts
// before
function matchesPrefix(word: string, lowerQuery: string): boolean {
  if (lowerQuery.length > word.length) return false;
  for (let i = 0; i < lowerQuery.length; i++) {
    const wordChar = word[i];
    if (wordChar === undefined || wordChar.toLowerCase() !== lowerQuery[i]) return false;
  }
  return true;
}

// after
function firstMatchingWord(title: string, query: string): number {
  const lowerQuery = query.toLowerCase();
  // ...
  if (word.toLowerCase().startsWith(lowerQuery)) return wordIndex;
  // ...
}
```

The smallest possible thing, same reasoning as `pad2` in `drill-06-01`: it depends on
nothing else, so replacing it first proves nothing else has to move yet. `.startsWith` on a
lowercase-folded string is exactly what the loop computed by hand, length guard included.

**On the name.** `matchesPrefix` disappears rather than being kept as a one-line wrapper
around `.startsWith`. That is question 2 from
[`NAMING.md`](../../../../../../docs/NAMING.md): once the body is `.startsWith(lowerQuery)`,
a function whose only job is to call one method and return its result names nothing that
the call site does not already say more plainly. Keeping it would have been *Inline
Function* hiding inside a *Substitute Algorithm* drill — a reasonable move, just not this
one.

## Step 2 — the word split

```ts
// before: a hand-written boundary scan, one character at a time
for (let position = 0; position <= title.length; position++) {
  if (position !== title.length && title[position] !== " ") continue;
  if (position > wordStart) {
    const word = title.slice(wordStart, position);
    if (word.toLowerCase().startsWith(lowerQuery)) return wordIndex;
    wordIndex++;
  }
  wordStart = position + 1;
}
return -1;

// after
return title.split(/\s+/u).findIndex((word) => word.toLowerCase().startsWith(lowerQuery));
```

Twenty-one lines become four. `title.split(/\s+/u)` needs checking against one specific
thing the hand-written scan got right on purpose: a run of several spaces must not produce
an empty "word" that shifts every later word's index by one. The hand-rolled loop guards
this with `if (position > wordStart)`. A regex split on `/\s+/` (one-or-more, as a single
delimiter) has the same property built in; `/\s/` (any *single* whitespace character) would
not, and would reintroduce exactly the bug the old loop avoided. No test here has a title
with a double space to prove it — see "What it cost" below.

**On the name.** The function keeps the name `firstMatchingWord` across this entire
exercise, through both algorithms. That is a decision, not an oversight: question 1 from
`NAMING.md` asks whether a name says *what* or *how*, and "first matching word" describes
the answer the function gives, not the loop or the `.split`/`.findIndex` chain that
produces it. A name that survived a rewrite of the entire body without needing to change is
the name doing its job correctly — the sharpest test question 1 can be put to.

## Step 3 — the ranking, and the step to slow down on

```ts
// before: scan the catalogue once, inserting each match at its sorted position by hand
for (const entry of catalogue) {
  const rank = firstMatchingWord(entry.title, query);
  if (rank !== -1) insertByRank(ranked, { entry, rank });
}
return ranked.map((match) => match.entry);

function insertByRank(ranked: RankedEntry[], candidate: RankedEntry): void {
  let position = 0;
  while (position < ranked.length) {
    const current = ranked[position];
    if (current === undefined || current.rank > candidate.rank) break;
    position++;
  }
  ranked.splice(position, 0, candidate);
}

// after: collect every match unsorted, then let sort do the ordering
return rankedMatches(catalogue, query)
  .sort((a, b) => a.rank - b.rank)
  .map((match) => match.entry);

function rankedMatches(catalogue: readonly CatalogueEntry[], query: string): Match[] {
  return catalogue
    .map((entry) => ({ entry, rank: firstMatchingWord(entry.title, query) }))
    .filter((match) => match.rank !== -1);
}
```

This is the step people rush, because `.sort((a, b) => a.rank - b.rank)` reads so much more
plainly than `insertByRank`'s scan-and-splice that it feels like an obvious improvement with
nothing to check. It is the one step in this drill where that feeling is dangerous.

`insertByRank` maintains sortedness *and* tie order as an explicit invariant, in code you
can read: "stop at the first entry ranked strictly worse; insert here." `.sort()` produces
the same order, but the guarantee that equal-rank entries keep their relative position is
not in this file at all — it lives in the ECMAScript specification, which has required
`Array.prototype.sort` to be stable since ES2019. The new code is correct for a reason the
reader has to already know, rather than one the code states for itself — exactly what the
tie-break test exists to catch if it were ever wrong, on an older engine or after a
well-meaning swap to something not spec-guaranteed stable.

**On the name.** `RankedEntry` becomes `Match`. `RankedEntry` earned its keep while
`insertByRank` needed to talk about an entry's position in an ongoing ranking process; once
that process is one `.sort()` call, what the interface holds is "an entry and the rank it
matched at" — a match, full stop. `Match` fails question 2 in a bigger file (too generic to
survive a second concept called "match"), but in a thirty-line module with one meaning for
the word, it passes question 4: exactly true, nothing shorter would still be.

## What it cost

Two things, stated plainly rather than glossed over:

**The tie-break stability is now a citation, not a proof.** Before, you could read
`insertByRank` and verify the tie-break yourself, with no outside knowledge. After,
verifying it means knowing `Array.prototype.sort` has been specified as stable since ES2019
and trusting the engine implements the spec correctly — a reasonable thing to trust, and
exactly the kind of promise a standard library exists to make so application code does not
have to remake it, but a different *kind* of correctness than the old code had. This is the
decision I am least sure was worth stating as a cost at all, versus just being what "using
the standard library" always means; I left it in because the reviewFocus question about it
is a real one, not a rhetorical one.

**The double-space gap in the test suite is real, and I did not close it.** Step 2 depends
on `/\s+/u` treating a run of whitespace as one delimiter the same way the hand-rolled
loop's `position > wordStart` guard did, and no test here has a title with two consecutive
spaces to prove both versions agree. I checked it by hand while writing this, not by adding
a test. Ten tests is not eleven because I judged this gap survivable for a teaching
exercise, not because it isn't a gap.

## If you took a different route

- **Undo Steps 1 and 2 in the other order** — collapse the word split first, leaving an
  inline `.startsWith` call. Fine; the dependency only runs one direction, not both.
- **Build an actual index instead of a smarter scan.** The roadmap describes this drill as
  "a hand-rolled scan where a lookup belongs," and a real fix at this scale would likely be
  a `Map<string, CatalogueEntry[]>` keyed by word prefix, built once when the catalogue
  loads, turning every search into a lookup instead of a scan. Not taken here because it is
  a second refactoring: it changes the *data structure* the algorithm runs over — chapter
  8's territory, and worth its own drill, not a paragraph inside this one.
- **Keep `insertByRank` and only replace the two leaf functions.** Defensible — smaller,
  lower-risk, and the section above spends a full pass on why `.sort()` needs care. If your
  read of that trade came out the other way, that is a legitimate place to stop.

What is *not* a matter of taste: shipping the sort-based rewrite without first identifying
the tie-break and the empty-query behaviour as things a plausible rewrite could drop. The
new algorithm having them is not the point — not looking for them first makes their
survival luck, not refactoring.

## When *not* to make this move

Everything above assumes the ten tests actually characterise the old algorithm — every
behaviour it has, including the accidental ones, pinned by a test that fails if a plausible
replacement drops it. If you cannot do that for a real algorithm — the behaviour is
stateful, or timing-dependent, the inputs too large or varied to enumerate in a test file,
or you simply do not yet understand the old code well enough to say what it promises —
**you are not in a position to refactor it. Say so.** Writing a new algorithm from the spec
and hoping it matches is not *Substitute Algorithm*; it is a rewrite, and should be reviewed
and rolled out like one — behind a flag, the old path kept as a fallback, outputs compared
on real traffic before the old one is deleted. Reach for this move only once you can express
the current algorithm's result as something to compare against; this drill's fixed,
ten-case catalogue is that comparison made small enough to fit in a file. A million-row
table with no test suite is the same problem with the safety net removed.

## Where TypeScript makes this different from the book's JavaScript

`tsconfig.base.json` turns on `noUncheckedIndexedAccess`, and it changes the *old* algorithm
more than the new one. `title[position]` and `word[i]` are typed `string | undefined`, so
the hand-rolled loops in `src/` must handle an out-of-range read as a real case the type
checker forces you to write — `if (wordChar === undefined || ...)` — rather than one the
original author could ignore. Fowler's JavaScript examples carry no such guard: a plain
`word[i]` there is just `string`, wrong-but-silent past the end. The `.split`/`.startsWith`
version sidesteps the question entirely — neither ever hands you an `undefined` to check,
because the standard library already decided what happens at the boundary. A second,
quieter argument for the substitution: fewer places a type checker asks you to prove
something the algorithm's *author* never had to prove.

Run `./rp review 07-09` if you want a second opinion on the route you actually took — it
builds a packet that deliberately withholds this file from the reviewer, so you get judged
on your own terms rather than on your resemblance to me.
