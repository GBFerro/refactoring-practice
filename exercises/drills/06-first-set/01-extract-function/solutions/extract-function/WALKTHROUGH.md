# Walkthrough — one function per named intention

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and where I went
wrong first. Read it after you have your own version, not before.

---

## Before anything: read the shape, not the lines

`renderRaceReport` is seventy-seven lines, and the temptation is to start at the top. Don't.
Skim it once and answer two questions:

**What are the blocks?** Header, ranked finishers, DNFs, rule, summary. Five, and each has
a comment announcing it. The comments are doing the job the function names should be doing —
that is the *Comments* smell, and it is a gift: someone has already decomposed this for you
and written the boundaries down.

**What appears twice?** The h:mm:ss arithmetic, once inside the loop and once for the
`Fastest:` line. That duplication is not incidental. It is the reason this function is hard
to change: adding a tenth-of-a-second display means finding both copies and hoping there
are only two.

Those two answers determine the whole route. The blocks tell you *what* to extract; the
duplication tells you *where to start*.

## Why leaves first

I extract from the bottom of the dependency chain upward — `pad2`, then `formatDuration`,
then `formatPace`, and only much later `renderFinisher`.

The alternative is tempting and worse. Start with `renderFinisher` and you drag the whole
formatting mess inside it: the h:mm:ss arithmetic, the pace rounding, the `?? 0`. You get a
function that is shorter than the original and just as tangled, and every subsequent
extraction is a *re*-extraction out of code you just wrote.

Leaves first means each step operates on strictly less code than the step before. By the
time you reach the loop, the body is three named calls and lifting it out is trivial.

> This generalises past this exercise. When a refactor feels like it is fighting you, it is
> usually the order, not the move.

## Step 1 — `pad2`

```ts
// before
String(minutes).padStart(2, "0")
// after
pad2(minutes)
```

The smallest possible thing, and it appears four times.

**On the name.** `pad2` is not a great name and I kept it deliberately. `padToTwoDigits`
says the same thing in three times the characters, and at a call site
(`` `${pad2(minutes)}:${pad2(rest)}` ``) the shorter one reads better. This is question 3
from [`NAMING.md`](../../../../../docs/NAMING.md): check the call site, not the
declaration. A name that reads well where it is *used* beats one that documents itself
where it is defined.

Not `zeroPad` — that describes the mechanism (question 1). Not `format` — it could be
anything (question 2).

## Steps 2 and 3 — `formatDuration`, in two commits

This is the step people rush, so it is split.

Step 2 extracts from the first occurrence, inside the loop. Tests green — but nothing has
actually improved yet, because the duplicate is still there.

Step 3 deletes the second copy and calls the new function. **This is the step that can
change behaviour**, and the only reason it is safe is that you looked at both copies and
confirmed they were identical. If they had differed by a hair — a `Math.round` here and a
`Math.floor` there — collapsing them would be a bug fix or a regression, and either way it
would be a behaviour change hiding inside a refactoring commit.

Two commits, so that if something breaks you know which of the two things broke it. That is
the entire argument for small steps, in miniature.

**On the name.** `formatDuration`, not `formatTime`. "Time" is a point on a clock; this is
an elapsed span. Question 4: is it true?

## Step 4 — `formatPace`, and where the rounding goes

```ts
function formatPace(secondsPerKm: number): string {
  const rounded = Math.round(secondsPerKm);
  return `${String(Math.floor(rounded / 60))}:${pad2(rounded % 60)}/km`;
}
```

The interesting decision is that `Math.round` moved **inside**. In the original the caller
rounded and then formatted, which meant every caller had to know that paces are rounded
before display. Now that is the formatter's business, which is where it belongs — the seam
is "seconds per kilometre in, display string out".

Getting the seam right here is what makes step 10 possible. Because `formatPace` takes an
unrounded number, `averagePace` can average the exact values and let the formatter round
once at the end. Had I left the rounding outside, the average would have been an average of
rounded values, which is a different number.

I did not notice this while writing it. I noticed it at step 10 when the test still passed
and I went back to check *why*.

## Steps 5 to 7 — untangling the type

Step 6 is the one worth slowing down for.

The challenge code is littered with `?? 0`:

```ts
finishers.sort((a, b) => (a.seconds ?? 0) - (b.seconds ?? 0));
const seconds = finisher.seconds ?? 0;
const best = fastest.seconds ?? 0;
```

Every one is dead code — `finishers` only ever contains entries whose `seconds` is
non-null. TypeScript cannot know that, because the filter and the use are separated by
forty lines of unrelated work, so it demands a fallback and the original author supplied
one. Four branches that can never be taken.

A type predicate closes the gap:

```ts
function isFinisher(entry: Entry): entry is Finisher {
  return entry.seconds !== null;
}
```

`entries.filter(isFinisher)` gives back `Finisher[]`, and every `?? 0` downstream deletes
itself. Not because it was ugly — because it is now provably unreachable.

**This is the step that is not in the book**, and it is worth naming why. Fowler's examples
are in JavaScript; there is no type to narrow. In TypeScript, "the compiler is asking me for
a fallback I know can never happen" is a smell in its own right, and it usually points at
exactly the tangle a refactoring wants to remove. The `?? 0` were not noise. They were the
type system pointing at the seam.

You can measure it afterwards: branch coverage on the challenge file is 77%, and the four
uncovered branches are precisely these four fallbacks. Coverage was telling you where the
dead code was the whole time.

**On the names.** `isFinisher` over `hasFinished` because it names a *kind* of entry, and
the type it narrows to is `Finisher`. Predicate and type read as one idea. `sortedFinishers`
over `getFinishers` — question 1: `sorted` is a promise about the result, `get` describes
nothing.

## Step 8 — `titleOf`, and why it stays separate

`renderHeader` returns the title and a rule of `=` the same width. Forty lines later, the
footer needs a rule of `-` at that same width. So the title's *width* is needed in two
places.

I extracted `titleOf` as its own function rather than having `renderHeader` return both the
lines and the width. One definition, two callers, and the two rules cannot drift apart —
which is the actual invariant the test `rules the separator to the width of the title` is
guarding.

The alternative — passing the width down — would have worked and would have added a
parameter to two functions to avoid a three-line function. Not worth it.

## Step 9 — the counter disappears

```ts
// before
let position = 0;
for (const finisher of finishers) { position = position + 1; /* ... */ }
// after
finishers.map((finisher, index) => renderFinisher(race, finisher, index + 1))
```

The mutable counter existed only to be incremented. `map` already carries the index, so it
goes away for free once the loop body is a single call. This was not a goal; it fell out.
Several small refactorings do this — they make an adjacent problem evaporate rather than
solving it.

`renderFinisher` takes three parameters (`race`, `finisher`, `position`), which is the
strict profile's limit exactly. If it had needed four I would have treated that as evidence
that the seam was wrong, not as a reason to reach for a Parameter Object.

## Step 10 — the accumulator, and *Replace Temp with Query*

```ts
// before: written at line 22, read at line 82
let paceTotal = 0;
// ... inside the loop ...
paceTotal = paceTotal + secondsPerKm;
// ... forty lines later ...
const averagePace = paceTotal / finishers.length;
```

A temp with a sixty-line lifetime, which is why the loop could not be lifted out: extract
the loop and the accumulator either goes with it (wrong — the summary needs it) or has to
be threaded back out.

```ts
// after
function averagePace(race: Race, finishers: readonly Finisher[]): number {
  const total = finishers.reduce((sum, one) => sum + paceSecondsPerKm(race, one), 0);
  return total / finishers.length;
}
```

Computed where it is used, from data already at hand. It costs a second pass over the
finishers, which for a race results sheet is not a real cost and would be worth measuring
rather than assuming if it were.

In the book's vocabulary this is *Replace Temp with Query*, from chapter 7 — a different
chapter, arriving unbidden in a chapter 6 drill. **Refactorings come in flocks.** The
catalog is organised for reading, not for the order things actually happen in.

Note it only became easy after steps 4 and 6. Attempted at step 2 it would have been a
tangle. Sequencing again.

## Step 11 — what is left, and what it cost

```ts
export function renderRaceReport(race: Race): string {
  const finishers = sortedFinishers(race.entries);
  const lines = [
    ...renderHeader(race),
    ...finishers.map((finisher, index) => renderFinisher(race, finisher, index + 1)),
    ...race.entries.filter(didNotFinish).map(renderDidNotFinish),
    "-".repeat(titleOf(race).length),
    ...renderSummary(race, finishers),
  ];
  return lines.join("\n");
}
```

Every comment became a function name and nothing was lost. **If you kept a comment after an
extraction, the name is not carrying its weight yet** — that is the most portable test in
this whole file.

Now the honest part. This is not free:

- **Ten functions instead of one.** To answer "in what order does this run?" you now read
  six names and trust them, or you open six functions. The original told you plainly. That
  is the trade every extraction makes, and it is worth it here only because the blocks were
  already conceptually separate — the comments proved it.
- **`renderSummary` is doing two things**, arguably: the count line and the fastest/average
  lines, which only exist when someone finished. It survives the strict profile at eleven
  lines. A reviewer could reasonably say it should be two functions, and a reviewer could
  reasonably say splitting it would be *Lazy Element*. I do not think there is a right
  answer. I mention it because a walkthrough that presents every decision as obvious is
  lying to you.

## If you took a different route

Very likely, and probably fine. Some real alternatives:

- **Extracting `renderFinisher` before the formatters.** More painful, same destination.
  If you did this and it felt like wading, that feeling was the information.
- **Keeping `formatDuration` and `formatPace` as one `formatters` object or module.** A
  reasonable call in a larger codebase; overhead in a seventy-line file.
- **Not extracting `pad2`.** Four call sites is borderline. Defensible.
- **Six functions instead of ten.** Also defensible. Ten is not a target.

What is *not* a matter of taste: leaving the duplicated h:mm:ss block in place, or leaving
the `?? 0` fallbacks. Those are the two things this exercise exists to remove.

Run `./rp review 06-01` if you want a second opinion on the route you actually took — it
builds a packet that deliberately withholds this file from the reviewer, so you get judged
on your own terms rather than on your resemblance to me.
