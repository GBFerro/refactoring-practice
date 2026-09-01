# Walkthrough — two closings, one shared summary

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: a function with two reasons to change

`renderDispatchNote` in `src/` takes a stop and a boolean, `forCourier`, and produces the
whole note: header, item lines, a weight line, and a closing line. The boolean exists
because a route driver's note and a third-party courier's note are not the same document.
A driver needs the weight in grams — that is what the co-op's own scale prints — and a line
asking them to sign for the delivery. A courier bills by the kilogram and is not an Ashgrove
employee, so the note needs a liability line instead of a signature request.

That is **Divergent Change**: this one function has two separate reasons to be edited. If
the co-op changes what a driver's note says, someone opens `renderDispatchNote` and edits
the `else` branch. If the courier's insurer changes what the liability line has to say,
someone opens the exact same function and edits the `if` branch. Neither change has
anything to do with the other, and both land in the same sixteen lines.

This is the mirror image of the smell in `drill-08-03`. There, three callers had drifted
apart *by accident* — the same computation, copied three times, one copy quietly wrong.
Here, two callers want *genuinely different things on purpose*, and the accident is that
someone decided a shared function was the place to reconcile that, rather than two
functions that each say plainly what they want.

## The signal, stated plainly

Every function that takes two callers eventually has to answer: do they want the same
thing? `drill-08-03`'s answer was yes, once a one-line bug was fixed. Here the answer is
no, and it was never going to become yes — a driver's signature line and a courier's
liability disclaimer are not almost the same sentence with a typo between them. They are
two different sentences that happen to sit in the same position in the output.

The tell is not "the branches are long" or "there are two callers." Plenty of shared
functions have two callers and a short `if`. The tell is **what the branches are for**: a
flag whose two arms exist to serve two different audiences, each with their own reason to
change independently of the other. Once you can name the audiences — "the driver" and "the
courier" — and see that a change one of them asks for has zero bearing on the other, the
function is not really shared. It is two functions that have not been born yet.

## Why this order

Extract the common part first, *then* move each caller's own piece out to meet it. The
tempting shortcut is to jump straight to deleting `renderDispatchNote` and writing two new
functions from scratch. Resist it — that throws away the guarantee that the header and item
lines stay byte-for-byte the same for both audiences, which is exactly the guarantee this
refactoring exists to keep. Extracting `renderStopSummary` first, with `renderDispatchNote`
still calling it internally, is a no-op you can run the suite against before touching either
caller. Everything after that is subtraction, not rewriting.

## Step 1 — extract `renderStopSummary`

```ts
// before: one function does everything
export function renderDispatchNote(stop: DispatchStop, forCourier: boolean): string[] {
  const lines = [ /* header, deliver-to, item lines */ ];
  const grams = totalWeightGrams(stop.items);
  if (forCourier) { /* ... */ } else { /* ... */ }
  return lines;
}

// after: the same output, via a named prelude
function renderStopSummary(stop: DispatchStop): string[] {
  return [ /* header, deliver-to, item lines */ ];
}
export function renderDispatchNote(stop: DispatchStop, forCourier: boolean): string[] {
  const lines = renderStopSummary(stop);
  const grams = totalWeightGrams(stop.items);
  if (forCourier) { /* ... */ } else { /* ... */ }
  return lines;
}
```

Ordinary Extract Function, and the tests do not move — this step changes nothing a caller
can observe. It exists purely so steps 2 and 3 have something safe to call.

**On the name.** I did not call this `renderDispatchNote` — the name already in use — and
give the branching function a new one instead. I want to flag why, because leaving the name
where it was would have been less work. Question 4 in
[`NAMING.md`](../../../../../../docs/NAMING.md) is "is it true?", and once this function
stops returning the closing lines, "dispatch note" is no longer an honest description of
what it hands back — a dispatch note has a closing; this does not. `renderStopSummary` says
what it actually is: enough to identify the stop and what's in it, nothing about how the
note ends. I rejected `renderNoteHeader`, because "header" already names something narrower
inside the output (the first line) and would collide; and `renderCommonLines`, which fails
Question 2 — every function in this file produces lines that are common to *something*, so
"common" identifies nothing in particular.

## Step 2 — move the courier's closing out

```ts
// dispatchToCourier, before
export function dispatchToCourier(stop: DispatchStop): string[] {
  return renderDispatchNote(stop, true);
}

// dispatchToCourier, after
export function dispatchToCourier(stop: DispatchStop): string[] {
  const kilograms = totalWeightGrams(stop.items) / 1000;
  return [
    ...renderStopSummary(stop),
    `Total weight: ${formatKilograms(kilograms)} kg`,
    "Courier handoff — Ashgrove liability ends at pickup.",
  ];
}
```

`dispatchToCourier` now calls `renderStopSummary` directly and builds its own tail. It no
longer calls `renderDispatchNote` at all — the `if (forCourier)` branch inside that function
is now unreachable from this caller, though nothing has deleted it yet. `formatKilograms`
moves with it: it exists for exactly one audience, so once that audience owns its own
closing, the formatter belongs there too, not in a file both audiences import.

I did the courier before the driver for a small reason worth stating: the courier's closing
does more work (a unit conversion, not just a pass-through), so if the copy-and-adjust is
going to go wrong anywhere, it goes wrong here, where there is still a working
`renderDispatchNote` sitting right next to it to compare output against by eye.

**On the name.** `formatKilograms`, not `formatWeight` — the function it was extracted from
already had a sibling concept, whole grams, formatted by nothing more than string
interpolation. `formatWeight` would fail Question 2 in
[`NAMING.md`](../../../../../../docs/NAMING.md): both the gram line and the kilogram line
are "weight," so a name that says only "weight" does not tell you which unit you are
looking at without opening the function. `formatKilograms` commits to the unit in the name,
matching this repository's convention for a unit-bearing value — the same reason the book's
`paceSecondsPerKm` from `06-01` carries its unit rather than being called just `pace`.

## Step 3 — move the driver's closing out

```ts
export function dispatchToDriver(stop: DispatchStop): string[] {
  const grams = totalWeightGrams(stop.items);
  return [
    ...renderStopSummary(stop),
    `Total weight: ${grams} g`,
    "Please sign at the door to confirm receipt.",
  ];
}
```

Same move, the simpler half. After this step, `renderDispatchNote` has no callers left —
both `if` and `else` are dead code, in the technical sense the compiler cannot see yet
because the function is still exported and still syntactically callable.

**On the name.** `dispatchToDriver` and `dispatchToCourier`, not `printDriverManifest` /
`printCourierHandoff`, which is what I wrote first. Question 1 — what, or how — is the
reason I changed it: nothing in this module prints anything, and modeling the name on a
downstream side effect (paper coming out of a printer) describes a mechanism these
functions have no say over. `dispatchToDriver` names the event that produces the note — the
stop being handed to one kind of carrier or another — the same way `drill-08-03`'s
`completeRouteStop` names an event rather than an output format. I kept the two names
parallel (`dispatchTo*`) on purpose: they are the two arms of the same original decision,
and reading them side by side should say so.

## Step 4 — delete `renderDispatchNote`

Nothing calls it. Delete the function, the `forCourier` parameter that existed only to
steer it, and both branches. This is where "the shared part is shrinking" stops being a
figure of speech: by the time you reach this step, `renderDispatchNote`'s *entire remaining
body* is the two branches — the shared prelude already left in step 1. A function whose
whole content is "pick which of two unrelated things to do" was never sharing anything. It
was routing.

That is the concrete moment this drill exists to name: not when a shared function first
grows a flag — that can be perfectly fine, see below — but when what is left inside the
function, once you subtract the truly common lines, is *entirely* audience-specific. At
that point the function's shared portion is zero, and keeping it means one file has two
unrelated reasons to change with no compensating benefit. Delete it.

## What it cost

I am not fully at peace with one part of this: `formatKilograms` now lives in `dispatch.ts`
as a private helper reachable only from `dispatchToCourier`, and `totalWeightGrams` lives in
`note.ts` and is called by both closings. That is an asymmetry — one shared query, one
private formatter — and it is correct (grams-to-kilograms is genuinely only the courier's
business), but a reviewer skimming the file layout could reasonably ask why one caller
"owns" a helper and the other doesn't need to. I considered giving `dispatchToDriver` a
matching no-op `formatGrams` for symmetry and decided against it: a function that exists
purely so two files look alike is exactly the kind of thing this refactoring is supposed to
remove, not add back for tidiness.

I am also not fully certain step 1 deserves to be its own commit rather than folded into
step 2. The argument for keeping it separate is the one I gave above — it is provably a
no-op, checkable by eye, before anything with actual behavioral risk happens. The argument
against is that it is a very small commit and a reviewer has to open it to see that it does,
in fact, do nothing. I kept it separate. A reviewer who prefers fewer, slightly larger
commits for this exercise size would not be wrong.

## If you took a different route

- **Deleting `renderDispatchNote` in the same commit as step 3**, since by then it truly is
  dead. Defensible — I split it out mostly so "remove dead code" reads as its own idea in
  the history, echoing chapter 8's own `Remove Dead Code`, which is a different drill
  (`08-09`) but the same instinct arriving early.
- **Keeping one shared `closingFor(stop, audience)` helper** that itself branches, rather
  than two independent closings. I tried this. It reintroduces the exact problem: a single
  function with two reasons to change, just renamed and moved one level down. If you find
  yourself writing a helper whose whole job is "do one of two unrelated things," that is
  usually a sign the split did not go far enough, not that it went too far.
- **A `DispatchAudience` discriminated union with a switch**, in case a third audience
  arrives later. I did not do this, and this is the one thing here that is not simply a
  matter of taste: reaching for polymorphism or a type-driven switch *before* there is a
  second real branch point to justify it is solving a problem you do not have yet.
  `drill-10-04`, *Replace Conditional with Polymorphism*, is the right chapter for that
  decision — once there is a third audience with its own divergent needs, not before.

## The sibling: when the code wants to go the other way

[`03-move-statements-into-function`](../../../03-move-statements-into-function/README.en.md)
is this drill's mirror. There, three callers each computed a total before calling
`renderReceipt`, and the fix was to fold that computation into the function once every
caller was confirmed to want the same thing. Here, one function computed a closing for two
callers, and the fix was to hand each caller its own closing once it was clear they did
not.

The signal that tells the two apart is not "how many statements are involved" or "how many
callers there are" — it is what the shared part is worth once you are honest about how much
of it is actually shared. `08-03`'s precondition holds when fixing the disagreement costs
nothing to the function's shape — there, one word, `Math.max`. This drill's precondition
holds once fixing the disagreement would cost the function its shape entirely: the only way
to make `renderDispatchNote` serve both audiences honestly was a flag whose two arms shared
no logic, which means the "shared" function's shared portion had shrunk to nothing. When a
function's genuinely common lines outweigh its per-caller lines, move statements in. When a
caller-specific flag's branches have grown until the common lines are the minority — or
disappear, as they nearly did here — move statements back out to callers, and let the
function's name shrink to match what it actually still does.

## Where TypeScript changes this from the book

As in `08-03`, dropping a parameter — here, `forCourier` — meant the compiler enforced part
of the safety net for free: once `renderDispatchNote` no longer existed, any leftover call
to it would fail to compile, not fail silently at runtime. What the compiler had no opinion
on is the part that mattered most for *this* drill: it cannot tell you whether two branches
of a boolean flag are actually related work that happens to differ, or two unrelated pieces
of work that happen to share a parameter list. `forCourier: boolean` type-checked perfectly
well right up until the moment I deleted it. Recognizing Divergent Change is a judgment
call about *why* code changes over time, which is not something any type system observes.
