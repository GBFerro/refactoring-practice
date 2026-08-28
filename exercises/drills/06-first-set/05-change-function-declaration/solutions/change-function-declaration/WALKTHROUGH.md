# Walkthrough — rename to say what it does, then drop the parameter the catalogue already carries

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, what it cost, and
where I would defend a different call. Read it after you have your own version, not before.

---

## Two mechanics, and why this file uses the slower one

*Refactoring* gives Change Function Declaration two mechanics, and the book is explicit
that which one you reach for is a judgement call, not a rule:

**The simple mechanic.** Change the declaration — rename it, add or remove a parameter,
whatever the shape needs — then find every caller and fix it, all in one sitting, one
commit. It is fast and it is correct whenever you can be confident you will actually find
every caller: a small function, a codebase you can grep in full, nobody outside your control
depending on the old shape.

**The migration mechanic.** Add the new declaration *next to* the old one. Have the old one
delegate to the new one (or the reverse, if that is easier), so both work at once. Move
callers across one at a time, running the suite after each. Delete the old declaration only
once nothing calls it. Slower, and that is the entire point: every step is small enough that
a red suite tells you exactly which edit broke something, and you are never more than one
caller away from a working state.

`checkCourse` has three callers, all in `callers.ts`, all in a file this exercise already
owns — by the simple mechanic's own criteria, this change qualifies for the fast route, and
[`STEPS.md`](./STEPS.md) shows that route too, in one commit. This walkthrough takes the
slow one anyway, on purpose: the migration mechanic is the one you cannot safely improvise
the first time you need it for real, on a function with thirty callers across four packages
you do not fully control. Three callers in one file is exactly the size of problem where
practicing the motion is cheap and the motion is the thing worth having automatic.

## Why `apiFrozen: false`, and what the callers arrangement buys

`tests/callers.spec.ts` imports `describeCourse`, `seatsRemaining`, and
`describeWithPrerequisite` — the three functions the club's booking tools actually call — and
never `checkCourse` or `requireCourse` by name. That is not an oversight; it is what makes
this drill possible at all. Change Function Declaration changes a signature by definition,
so a suite that imports the lookup directly would have to be rewritten the moment you renamed
it, which defeats the purpose of a *characterization* suite: something that tells you whether
behaviour changed, not whether you kept a name it never should have cared about.

Freezing the three callers instead means the suite has an opinion about what a caller
returns and throws, and no opinion at all about how the lookup underneath is named, shaped,
or how many functions currently share the job. During step 1, when both `checkCourse` and
`requireCourse` exist and every caller still goes through the old one, the suite cannot tell
the difference — which is correct, because from outside the module nothing has changed yet.
That is what `apiFrozen: false` is for: it says "the tests below pin behaviour at the
boundary the callers see, not the shape of what they call," which is exactly the promise a
signature-changing refactoring needs from its safety net.

## Step 1 — the risky one, done first and alone

```ts
// before
export function checkCourse(catalogue: CourseCatalogue, season: string, code: string): Course {
  const course = catalogue.courses.find((candidate) => candidate.code === code);
  if (course === undefined) {
    throw new Error(`No course "${code}" in the ${season} catalogue.`);
  }
  return course;
}

// after
export function requireCourse(catalogue: CourseCatalogue, code: string): Course {
  const course = catalogue.courses.find((candidate) => candidate.code === code);
  if (course === undefined) {
    throw new Error(`No course "${code}" in the ${catalogue.season} catalogue.`);
  }
  return course;
}

export function checkCourse(catalogue: CourseCatalogue, season: string, code: string): Course {
  return requireCourse(catalogue, code);
}
```

This is the step everything else depends on, and it is the only one that can change
behaviour. `catalogue.season` and the `season` parameter are the same string at every call
site *today*, but that is a fact about the callers, not about `checkCourse`'s body — you
cannot see it by reading this function in isolation, only by reading every caller and
trusting you found them all. The migration mechanic turns that trust into a check: make
`checkCourse` stop reading its own `season` and delegate to a function that reads
`catalogue.season` instead, then run the suite. Green means every caller's `season`
argument agreed with its own catalogue, for every case the suite covers, before a single
caller line moved. If a caller had ever passed a mismatched season, `describeCourse(spring,
"YOGA-101")`'s error-message test would have caught it right here, pointing at exactly this
commit.

**On the name.** `requireCourse` over `findCourse`, which I wrote first and reverted.
Question 4 from [`NAMING.md`](../../../../../../docs/NAMING.md) — *is it true?* — is the one
that kills `findCourse`: a function named `find*` promises `Course | undefined`, the way
`Array.prototype.find` does, and a caller who trusts that promise will call it without a
try/catch and get an uncaught exception instead of the `undefined` they were told to expect.
`requireCourse` makes the assertion part of the name instead of hiding it, which is question
1 — it says *what* the function guarantees, not *how* it looks the course up.

## Steps 2 to 4 — one caller, one commit

```ts
// describeCourse, before
const course = checkCourse(catalogue, catalogue.season, code);
// after
const course = requireCourse(catalogue, code);
```

Each of the three callers gets this same edit, each its own commit. `describeWithPrerequisite`
has two call sites — the course and, when there is one, its prerequisite — and both move
together in step 4 rather than splitting further, because they carry no independent risk:
both were already going through `checkCourse` → `requireCourse` as of step 1, so moving
either one first tells you nothing the other doesn't. That is different from the extract-
function drill's duplicated-block split, where the two copies could have drifted apart and
splitting the commit was what let you tell which copy broke something. Here there is nothing
to tell apart — the split would be ceremony, not safety.

After each of these three commits the suite is green, and it stays green for the same
reason step 1's did: `tests/callers.spec.ts` never depended on which lookup a caller used,
only on what the caller itself returns or throws.

**On the name.** No new name gets introduced in these three steps, which is itself worth
noting — moving a call site is not a naming decision, and resisting the urge to also rename
`catalogue` or `code` while you are in the neighborhood keeps the diff readable as *one*
move per commit.

## Step 5 — deleting the wrapper

```ts
// deleted
export function checkCourse(catalogue: CourseCatalogue, season: string, code: string): Course {
  return requireCourse(catalogue, code);
}
```

Once step 4 lands, nothing in `src/` calls `checkCourse`. TypeScript will not tell you this
on its own — an exported function with no local callers compiles cleanly, because something
outside the module might still import it — so the fact you can delete it is something you
have to establish by reading `callers.ts`, the same way you established step 1 was safe by
reading it. Delete, run the suite, still green: proof that the wrapper really was load-
bearing for nothing.

**On the name and the parameter, together.** This is the step where the two smells this
drill is about actually disappear — not step 1, which only *added* the honest name, and not
steps 2-4, which only moved callers onto it. `checkCourse` and its unused `season` keep
existing, just unreachable, until this commit removes them. A name is not fixed until the
lying one is gone, only shadowed by a truthful one sitting next to it.

## What it cost

Five commits for a change with three call sites in one file is more ceremony than the
change needs, and I am not fully sure the migration mechanic was the right teaching choice
over just showing the simple mechanic as the primary route with this as the "and here is
the alternative" footnote — I went back and forth and kept it this way around because the
book presents the simple mechanic first as the default, and a drill that only ever showed
the default would not teach you to reach for the other one when a real fifty-caller function
forces your hand. That is a judgement call about pedagogy, not about the code, and a
reasonable reviewer could want it reversed.

The one thing I am confident about: making `checkCourse` delegate to `requireCourse` in step
1, rather than the reverse, was correct and not a coin flip. Delegating the *old* name to
the *new* one means every existing caller keeps working through an unmodified call site
while the new shape gets proven out underneath it — the alternative, keeping `checkCourse`'s
body and having a still-unused `requireCourse` call into it, would have left the risky
`season` → `catalogue.season` substitution for the very last step, after every caller had
already moved, which is exactly when a mistake is hardest to isolate.

## If you took a different route

- **The simple mechanic**, shown at the bottom of `STEPS.md`: rename, drop the parameter,
  fix all three callers, one commit. Defensible, arguably better-sized for this exercise's
  actual scope, and the right default for any change this small in a codebase you own
  outright.
- **Splitting step 4** into two commits, one per call site inside
  `describeWithPrerequisite`. Harmless, just unnecessary here — see the reasoning above.
- **Keeping the parameter but renaming it**, e.g. `season` → `catalogueSeason`. This is not
  a real alternative; it treats the smell as a naming problem when the actual defect is that
  the parameter is redundant data, and renaming it would leave two ways to say the season in
  every call site, just with a longer second one.

What is *not* a matter of taste: leaving `checkCourse` in place once nothing calls it, and
keeping a name that promises a boolean for a function that throws. Those are the two things
this exercise exists to remove, and the drill is not done while either survives.

## Where TypeScript changes this from the book

Fowler's examples are JavaScript, so finding "every caller" of a function being changed is
a manual search — grep, or trust. In TypeScript, the simple mechanic gets a mechanical
safety net for free: tighten `checkCourse`'s signature in place and `tsc --noEmit` lists
every remaining call site that no longer type-checks, as compile errors with file and line.
That is a real reason to prefer the simple mechanic when it applies — the compiler is doing
the "find every caller" step *for* you.

The migration mechanic gets less of that benefit, and it is worth being honest about why:
while `checkCourse` and `requireCourse` coexist, both compile, so TypeScript has nothing to
flag until step 5 deletes the old one — at which point, same as above, any caller you missed
becomes a compile error rather than a runtime surprise. The type system's help arrives at the
end of the migration instead of the start of it, which is one more reason the simple
mechanic is worth reaching for first, and the migration one only when the caller count or
the ownership of those callers makes "just fix them all now" not a promise you can keep.
