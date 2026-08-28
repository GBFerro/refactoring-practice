# Walkthrough — names earned by working out the arithmetic first

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each rename, why in that order, which candidates lost, and what the whole
exercise actually costs. Read it after you have your own version, not before.

---

## Before anything: what the letters are hiding

```ts
export function pacingSpreadSeconds(xs: readonly Segment[]): number {
  const n = xs.length;
  const d = averagePaceSecondsPerKm(xs);
  const x2 = xs.reduce((a, s) => a + s.paceSecondsPerKm ** 2, 0) / n;
  const t = x2 - d * d;
  return Math.sqrt(Math.max(0, t));
}
```

Five lines, five bad names, and — this is the part that makes the exercise worth doing —
every mechanical check in this repository is silent about all five. `npx tsc` compiles it.
`npx oxlint` has nothing to say about a variable called `t`. The test suite in
[`tests/pacing-report.spec.ts`](../../tests/pacing-report.spec.ts) passes against this
exact code, because a name has never once affected what a program does. The only thing
wrong with this function is what a human reading it would conclude, and the only way to
fix that is to work out what each letter actually holds before you touch it.

So: work it out first, on paper, before opening `STEPS.md`'s table. `d` is assigned from
`averagePaceSecondsPerKm(xs)` — whatever `d` is, its callee's name already tells you. `x2`
divides a sum of squares by `n`, which is `xs.length` — so `x2` is a *mean* of something
squared, not a sum. And `t` is `x2` minus `d` squared, then square-rooted and clamped at
zero on the way out. If you know the shortcut formula for variance —
Var(X) = E[X²] − (E[X])² — this is it, computed in exactly that shape, and `t` is the
variance, square-rooted into a standard deviation before it's returned. If you don't know
that formula, the honest thing to do is look it up; renaming a variable to match a formula
you haven't verified is worse than leaving it alone.

## Why this order, not top-to-bottom

`STEPS.md` renames the parameter first and everything else in the order the values are
*computed*, not the order they're read on the page (which happens to be the same order
here, but for a different reason — each identifier's meaning depends on the one before it
already having a name to react against). You cannot confidently name `t` until you know
`x2` and `d` are a mean-of-squares and a mean, because `t`'s whole identity is "the
difference between those two things" — rename `t` first, in isolation, and you're
guessing at a formula you haven't reconstructed yet.

The parameter is the one exception, and it comes first precisely because it needs no
reconstruction: `pacingSpreadSeconds` is the function's own name, already fixed by
`apiFrozen`, and every sibling function in this file (`averagePaceSecondsPerKm`,
`isEvenlyPaced`) takes a `readonly Segment[]` and calls it `segments`. You don't need to
read a single line of the body to know `xs` should be `segments` — the surrounding module
already told you.

## Step 1 — `xs` → `segments`

**On the name.** Question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) rules out the tempting alternative,
`paces`. It's tempting because every use of an element inside this function reaches
straight for `.paceSecondsPerKm` — but the parameter holds full `Segment` objects, each
carrying a `markerKm` too, and elsewhere in this same file (`segmentsOf`) that field
matters. Call the parameter `paces` and the very next reader who writes `segments[0]
.markerKm` — reasonably, since that's a real field on a real element — is chasing a lie.
`data` and `items` fail question 2 for the ordinary reason: both would fit any array in
this codebase, which means neither says anything about this one.

## Step 2 — `n` → `count`

The least interesting rename in the file, and worth saying so: not every step earns a long
discussion, and pretending this one does would be dishonest in the other direction. `n` is
short for nothing in particular; `count` answers "how many `Segment`s," which is what the
value is used for two lines later. I rejected `size`, mildly, because this codebase's
arrays don't have a `.size` — `.length` — and borrowing `Set`/`Map` vocabulary for an array
count is a small false note even if nobody would seriously misread it.

## Step 3 — `d` → `meanPace`

**On the name.** This is the trap the exercise is named after. `d`, in a report about
kilometre markers, reads as *distance* to almost anyone who hasn't traced where it comes
from — and every other value in this domain that starts with a plausible letter for
"distance" (`markerKm`, `distanceKm` in `segmentsOf`) reinforces the wrong guess. But `d`
is assigned from `averagePaceSecondsPerKm(xs)`. It is a pace, in seconds per kilometre, not
a distance in kilometres at all — question 4 fails immediately once you check the
assignment instead of trusting the letter. `average`, considered alone, fails question 2:
average of what? This file computes more than one thing you could plausibly average.
`meanPace` says the unit implicitly (it's a *pace*) and the operation explicitly (it's a
*mean*), and it is true.

**A decision I'm not fully sure about:** the function that produces this value is called
`averagePaceSecondsPerKm`, not `meanPaceSecondsPerKm` — so why does the local variable say
`mean` while its own source says `average`? Because two lines later there is a
`meanSquare`, and the whole point of this function is that `meanSquare` and `meanPace` are
a matched pair — both "the mean of ___" — and seeing them named to match is what makes the
shortcut formula's shape (`meanSquare - meanPace * meanPace`) legible at a glance. Calling
this one `averagePace` instead would read fine on its own and would break that pairing:
`meanSquare - averagePace * averagePace` no longer visually rhymes, and the formula goes
back to looking like two unrelated numbers being subtracted. I chose local consistency
with `meanSquare` over global consistency with `averagePaceSecondsPerKm`'s own name. I
think that's the right call in a five-line function where both names are on screen at
once; I would not be surprised if a reviewer disagreed.

## Step 4 — `x2` → `meanSquare` (and the reduce's `a`, `s`)

```ts
// before
const x2 = xs.reduce((a, s) => a + s.paceSecondsPerKm ** 2, 0) / n;
// after
const meanSquare =
  segments.reduce((sum, segment) => sum + segment.paceSecondsPerKm ** 2, 0) / count;
```

**On the name.** `x2` looks like mathematical notation, which is exactly the problem —
mathematical notation is for people who already have the formula in front of them, and the
whole reason this code needs a name is that it doesn't. The candidate that worried me
here wasn't a bad one, it was `sumSquares` — plausible, reads naturally, and wrong: by the
time this line divides by `n`, the value is a *mean*, not a *sum*. `sumSquares` would have
been true one line earlier and false by the time it's assigned. That's question 4's most
dangerous failure mode — not an obviously bad name, but a name that used to be true and
wasn't updated when the code around it changed. `meanSquare` names what the variable holds
at the point it's declared, not what an earlier draft of the expression might have held.

The reduce's own parameters, `a` and `s`, get the same treatment: `sum` and `segment`,
matching the reduce two functions above in the same file
(`averagePaceSecondsPerKm`'s own `(sum, segment) => ...`). I didn't consider `acc`/`item` —
"accumulator" is how the parameter is used, not what it is (question 1), and "item" throws
away that we already know exactly what kind of item this is.

## Step 5 — `t` → `variance`

**On the name.** The most dangerous candidate in the whole file is not a single letter —
it's `spread`. The enclosing function is called `pacingSpreadSeconds`, so "this is the last
thing computed before the return, therefore it must be the spread" feels like it should
just be true. It isn't: `spread`, as this codebase already uses the word (see
`isEvenlyPaced` and `formatSpread` in `format.ts`), is `Math.sqrt(variance)` — the standard
deviation — and this value is what gets square-rooted, not the result of squaring. Name it
`spread` and the very next line, `Math.sqrt(Math.max(0, spread))`, reads as "take the
square root of the spread," which has the relationship backwards. A reviewer skimming for
`t`, `d`, `x2` would catch this instantly; a reviewer skimming for a name that already
sounds right next to the function's own name might not. That is exactly the failure mode
question 4 exists to catch, and it is the reason "is it true?" has to be checked against
the formula, not against how natural the name feels sitting next to its neighbours.

`t` itself is worth one more sentence. This is a *split times* report — `elapsedSeconds`
and `durationSeconds` are on every other line of this module — so `t` for "time" is not an
arbitrary bad guess, it's the single most plausible wrong answer available, precisely
because the domain's own vocabulary argues for it. `variance` is checkable against a
source that has nothing to do with this codebase — any statistics reference gives you
Var(X) = E[X²] − (E[X])² — which is a better test of truth than whether a name merely
sounds at home next to its neighbours.

## Where TypeScript makes this different — and where it doesn't help at all

Every parameter and every intermediate in this function is fully typed:
`xs: readonly Segment[]`, and `n`, `d`, `x2`, `t` all infer to `number`. Hovering any of
them in an editor shows a real, correct type, and that is worth being precise about what it
proves and what it doesn't. It proves `xs` isn't a `number` and `d` isn't a `string` — it
rules out the class of mistake where a name suggests the wrong *kind* of thing entirely.
It proves nothing at all about whether `d` should have been called `distance`: `distance`
would type-check exactly as well as `meanPace`, because both are `number`, and TypeScript
has no idea which noun belongs to which formula. Unlike `06-01`'s `?? 0` fallbacks — where
the type checker was visibly asking a question that pointed straight at the seam a rename
or extraction should fill — a `number` typed correctly and named wrong compiles in total
silence. If anything, seeing a real, specific type next to a bad name is worse than seeing
no type at all: it is easy to mistake "the editor shows me `Segment[]`" for "the editor has
confirmed this name," when it has confirmed only the shape. This is the sharpest way
Rename Variable differs from `06-01`'s `Extract Function` in this repository: there, the
compiler pointed at the tangle. Here, it has an opinion about everything except the one
thing wrong with the code.

## What it cost

Nothing ran differently before this refactoring and nothing runs differently after it —
that is Rename Variable's entire nature, and it is also its entire risk. The trade-off in
`meta.json` says it plainly: the test suite cannot tell a true rename from a false one,
only from a *behaviour change*, and a rename is never a behaviour change. If I had swapped
`variance` and `meanSquare` — given the actual variance the name `meanSquare` and vice
versa — every test in this exercise would still be green, `tsc` would still be silent, and
`oxlint` would have nothing to flag. The two would even *look* plausible independently;
only checking each one against the formula, not against how it reads next to its
neighbour, catches the swap. That is not a flaw in the tests — a rename that could break a
characterization test would mean the "rename" was secretly a logic change — but it does
mean the safety net for this particular refactoring is a careful reader, not a red X in a
terminal. `./rp names` (see `NAMING.md`) would not have caught any of the five original
names either: it flags vagueness, and `t`, `d`, and `x2` aren't vague, they're specific and
wrong, which is a failure only a reader who checks the arithmetic can see.

## If you took a different route

- **`averagePace` instead of `meanPace`.** Covered above — a real, defensible alternative
  that trades local consistency (matching `meanSquare`) for global consistency (matching
  `averagePaceSecondsPerKm`). I'd want to hear the case for it before calling my choice
  the only right one.
- **Renaming `a` and `s` as their own step, separate from `x2`.** I folded them into step
  4 because their correct names depend on already knowing what the expression around them
  computes — `s` can't confidently become `segment` in isolation from deciding that `x2`
  is a mean-of-squares over segments. Splitting them into a sixth commit would record a
  decision that was already made, not a new one.
- **A defensive name like `varianceUnclamped`** for `t`, to flag that it hasn't been
  through `Math.max(0, ...)` yet. I considered it and dropped it: the clamp exists purely
  to guard against a tiny negative float from floating-point rounding when the true
  variance is zero, not because `t` is a meaningfully different quantity before and after.
  A name for every intermediate step of a five-line function is its own kind of noise.

What is *not* a matter of taste: leaving `t`, `d`, `x2`, `n`, or `xs` as they were. None of
the five survives question 4, and a reviewer who lets any of them stand because "it's just
a rename, low stakes" has the risk backwards — low-stakes mechanics is exactly why there's
no excuse left not to get the name right. The same goes for the reduce's `a` and `s` once
everything around them has a real name: a lambda that still reads `(a, s) => ...` next to
`meanSquare` and `count` is an unfinished rename, not a style choice.
