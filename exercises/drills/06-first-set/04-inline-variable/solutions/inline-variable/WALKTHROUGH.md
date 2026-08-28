# Walkthrough — only the variables that earn their line

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, which names had to earn their keep, and
where the judgement actually lives. Read it after you have your own version, not before.

---

## Before anything: find the ones that don't earn it

Inline Variable has an unusual property among the chapter 6 refactorings: it is almost
always mechanically safe, and almost never obviously worth doing. Extract Function fixes a
function you cannot read. Inline Variable fixes a variable you didn't need to read in the
first place — a smaller, quieter kind of damage, one declaration at a time.

Skim the file once and ask, for every `const`: **how many times is this name actually
used, after this line?**

- Used once, one line below the declaration, holding an expression not reused elsewhere →
  a candidate. `const duration = segment.durationSeconds;` is exactly this.
- Used more than once → not a candidate. Inlining duplicates the expression at every call
  site — one kind of clutter traded for another.
- Reassigned anywhere → not a candidate at all. Inline Variable's own precondition
  (chapter 6) is that the variable is assigned exactly once. `let fastest` in
  `fastestSegment` fails this before "does it earn its line" is even asked.

That count is the whole method. The hard part is that "used once" is a syntactic fact, and
the question that matters — *is once actually once?* — is not. That is what step 9 is
about.

## Why leaves first

I worked from the small, self-contained utility functions (`paceSecondsPerKm`,
`averagePaceSecondsPerKm`, `totalSeconds`, `formatPace`, `formatDuration`) up to the
functions that call them. Unlike Extract Function there is no data-dependency forcing this
order — each function's locals are independent of the others. I kept it anyway: the leaf
functions are one or two variables each, so the first few steps build the rhythm — inline,
run the suite, commit — while the risk is near zero. By the time you reach `segmentsOf` and
`renderSegment`, which each shed five or six variables in one step, you have done it eight
times already and know what "the tests still read the same" looks like.

> Inlining top-down instead breaks nothing. It just front-loads steps 6 and 9 — the two
> worth doing slowly — onto a moment when you have no rhythm yet.

## Steps 1–5 — the leaves

```ts
// before
function paceSecondsPerKm(segment: Segment): number {
  const duration = segment.durationSeconds;
  const distance = segment.km;
  return duration / distance;
}
// after
function paceSecondsPerKm(segment: Segment): number {
  return segment.durationSeconds / segment.km;
}
```

`duration` and `distance` each say *what* a field means, but the field names already say
that — `durationSeconds` and `km` are not mysterious. Same story for `total`/`distance` in
`averagePaceSecondsPerKm`, `wholeMinutes`/`remainingSeconds` in `formatPace`, and the pair
`last`/`lastElapsed` in `totalSeconds`, which collapse in one step because `lastElapsed` is
a pure restatement of the return value: inline it first and `last` falls in the same
breath, no second commit needed — this is one expression read twice, not two
independently-written copies that could disagree.

**On the name.** `hasHours` in `formatDuration` is the interesting rejection. I considered
keeping it — `return hasHours ? ... : ...;` reads a little more like prose. But question 3
from [`NAMING.md`](../../../../../docs/NAMING.md) is about the call site, and there is no
call site here — the only reader is the line directly below the declaration. A boolean
built to be read once, immediately, by the same eyes that just wrote the comparison it
names, is not paying for itself; `hours > 0` in the ternary is already just as readable.

## Step 6 — `segmentsOf`, and the one that stays

```ts
// before
const previous = splits[index - 1];
const previousKm = previous?.km ?? 0;
const previousElapsedSeconds = previous?.elapsedSeconds ?? 0;
const label = split.label;
const km = split.km - previousKm;
const elapsedSeconds = split.elapsedSeconds;
const durationSeconds = split.elapsedSeconds - previousElapsedSeconds;
return { label, km, elapsedSeconds, durationSeconds };
// after
const previous = splits[index - 1];
return {
  label: split.label,
  km: split.km - (previous?.km ?? 0),
  elapsedSeconds: split.elapsedSeconds,
  durationSeconds: split.elapsedSeconds - (previous?.elapsedSeconds ?? 0),
};
```

Six variables go. `previous` does not — the first of three survivors, and reason one:
**used more than once.** It feeds both `.km` and `.elapsedSeconds`; inlining it means
writing `splits[index - 1]` twice, a second independent place to get the index arithmetic
wrong.

There is a second thing riding on this variable that has nothing to do with naming: for
`index === 0`, `previous` is `undefined`, and both `?? 0` fallbacks exist *only* for that
case. Inline `previous` carelessly (write `previous.km` instead of `previous?.km`) and the
first segment throws instead of measuring from the start line — the test *"measures the
first leg from the start line, not from the mat before it"* exists to catch exactly this.
When a variable's fallback only matters for one input, that is a sign it is not the simple
alias it looks like.

## Step 7 — `renderSegment`, and the name that survives by not being a name

```ts
// before
const label = segment.label.padEnd(LABEL_WIDTH);
const elapsed = formatDuration(segment.elapsedSeconds).padStart(ELAPSED_WIDTH);
const duration = `+${formatDuration(segment.durationSeconds)}`.padStart(DURATION_WIDTH);
const pace = formatPace(paceSecondsPerKm(segment));
const columns = [label, elapsed, duration, pace];
const row = columns.join(" ");
return row.trimEnd();
// after
const columns = [
  segment.label.padEnd(LABEL_WIDTH),
  formatDuration(segment.elapsedSeconds).padStart(ELAPSED_WIDTH),
  `+${formatDuration(segment.durationSeconds)}`.padStart(DURATION_WIDTH),
  formatPace(paceSecondsPerKm(segment)),
];
return columns.join(" ").trimEnd();
```

`label`, `elapsed`, `duration`, `pace` and `row` all go. `columns` does not, and it is used
exactly once — same as the five that just left, yet the verdict is opposite.

**On the name.** `columns` survives because it names the *shape* of a four-line array
literal before that literal is consumed, not because the value needs a second identity.
Question 2 from `NAMING.md` — could it be the name of something else in this file? — is a
test a worse name (`values`, `parts`, `result`) would fail here; `columns` passes it,
because this function builds exactly one thing called columns. I kept the literal
multi-line rather than folding it straight into `.join(" ")`, matching the same pattern in
the chapter 6 Extract Function drill's `renderFinisher` — a list spread across four lines
reads as a list; the same array inlined into one `.join()` call reads as one long
expression you must parse before you know it was a list. This is a formatting judgement,
not a behavioural one, and a reviewer who disagrees is not wrong.

What did **not** survive is `row`, one line below `columns`: same single use, opposite
verdict, because `row` restates `columns.join(" ")`, which the return statement already
says one line down. `columns` names a *shape*; `row` names a *result the next line already
names*.

## Step 8 — `fastestSegment`, where the name was never going to survive

```ts
// before
const pace = paceSecondsPerKm(segment);
const isFirstOrFaster = fastest === undefined || pace < paceSecondsPerKm(fastest);
if (isFirstOrFaster) {
  fastest = segment;
}
// after
if (fastest === undefined || paceSecondsPerKm(segment) < paceSecondsPerKm(fastest)) {
  fastest = segment;
}
```

`pace` and `isFirstOrFaster` go. `fastest` does not — reason two of three, structurally
distinct from `previous`: `fastest` is **reassigned**. Inline Variable's own precondition
rules it out before any judgement about naming or reuse applies; "inline" means "replace
every read with the single expression that produced it," and there is no single expression
once there have been several assignments.

I nearly kept `isFirstOrFaster`, on the theory that `if (isFirstOrFaster)` reads like
prose. I inlined it because of the test *"awards the fastest leg to the earliest of
equally fast legs"* — the comparison uses `<`, not `<=`, and that one character is the
entire contract. Question 4 — is it true? — the name says "faster"; the guarantee the
tests actually pin is "strictly faster, so ties keep the earlier one," which the name
doesn't carry and the raw `<` does, right there in the condition it would have hidden.

## Step 9 — `hasEvenPacing`, the one that isn't what it looks like

```ts
// before
const average = averagePaceSecondsPerKm(segments);
return segments.every((segment) => {
  const pace = paceSecondsPerKm(segment);
  const difference = Math.abs(pace - average);
  return difference <= EVEN_PACING_SECONDS;
});
// after
const average = averagePaceSecondsPerKm(segments);
return segments.every(
  (segment) => Math.abs(paceSecondsPerKm(segment) - average) <= EVEN_PACING_SECONDS,
);
```

`pace` and `difference` are ordinary. `average` is the third survivor, and the one worth
the most attention here, because it is the only one that *looks* exactly like the ones
that should go.

Count its textual occurrences: one, inside the callback. By the rule I opened with —
"used once, one line below its declaration" — `average` looks like a candidate. It is not,
because the callback it is captured in runs once per segment, and
`averagePaceSecondsPerKm(segments)` is not free — it sums every segment's duration and
distance. Inline it and the function still returns the same boolean, so the test suite
would not catch it, but a report over sixty splits now recomputes that total sixty times
instead of once. This is the one place in the file where "no observable behaviour change"
and "no cost change" come apart, which is why the `meta.json` review focus names this
variable directly: it is the one the tests cannot see and a reviewer has to.

`average` passes question 1 from `NAMING.md` — it says *what*, not *how* — and that is
exactly why leaving it is safe *and* why it is easy to miss: a good, honest name gives no
hint that it is the multiplicity-sensitive one.

## Step 10 — `renderSummary`

Seven variables collapse in this step: `total`, `distance`, `fastestPace`, `isEven`,
`totalLine`, `fastestLine`, `pacingLine`. `fastest` stays, for the same first reason as
`previous`: read three times (`fastest === undefined`, `fastest.label`,
`paceSecondsPerKm(fastest)`), and `fastestSegment(segments)` is an O(n) scan, not a
constant. Inlining `fastest` would call it up to three times per report — the same shape
of mistake as step 9, just easier to spot, because the call is spelled out at every site
instead of hiding inside a closure.

I did not split this into two commits the way a step with real behaviour risk would (see
the reference drill's steps 2–3). There is none here: every inlined expression is copied
verbatim from its own declaration, not reconstructed from memory.

## Step 11 — `renderSplitReport`, and what is left

`heading`, `segmentLines`, `summaryLines` and `lines` all restated a value used once.
`segments` stays — read twice, feeding both `segments.map` and `renderSummary(segments)` —
the same first reason as `previous` and `fastest`, a third time.

**What is left, and what it cost.** Three variables survive out of roughly two dozen that
existed before this drill, and no two survive for the same reason:

1. `previous`, `fastest` (in `renderSummary`), and `segments` — **used more than once.**
   Inlining any of them trades one name for one duplicated expression.
2. `fastest` inside `fastestSegment` — **reassigned.** Ruled out categorically, before any
   judgement about reuse or naming applies.
3. `average` — **captured by a callback invoked more than once.** The syntax says "used
   once"; the runtime says otherwise, and only the runtime's answer matters for cost.

Now the honest part. `columns` in `renderSegment` is a fourth thing that survived, and its
reason — readability of a multi-line literal — is genuinely a matter of taste in a way the
other three are not. I am not fully confident it is right; a reviewer who inlines it into
one `.join(" ")` call is not making a mistake, and I would not flag it in review. A
walkthrough where every decision reads as obviously correct is not teaching the judgement,
it is performing it.

**Where TypeScript changes this from the book.** Fowler's Inline Variable examples are
untyped, so a reader has to trust that "used once" really means used once. Here,
`noUnusedLocals` in `tsconfig.base.json` makes half the mechanical check automatic — delete
a variable's last read and the compiler flags the now-dead declaration immediately. It does
not help with the two judgement calls that actually matter (multiplicity through a closure,
and the reassignment precondition) — the type checker is perfectly happy to let you inline
`average` into a callback without a word of complaint.

## If you took a different route

- **Inlining top-down instead of leaves-first.** Fine — nothing here has a dependency order
  the way Extract Function's accumulator did. You will just hit the two slow steps before
  you have a feel for the rhythm.
- **Keeping `hasHours` or `isFirstOrFaster`.** Defensible in isolation; I would push back
  gently on both, but neither is the thing this exercise exists to catch.
- **Inlining `columns`.** Also defensible.

What is *not* a matter of taste: inlining `previous`, `fastest`, or `segments` down to
their duplicated expressions, or inlining `average` inside the `every` callback. The first
three trade one name for a second copy of the same lookup; the fourth changes how often a
computation runs while leaving every test green. A test suite — this one included — will
not catch three of these four for you.
