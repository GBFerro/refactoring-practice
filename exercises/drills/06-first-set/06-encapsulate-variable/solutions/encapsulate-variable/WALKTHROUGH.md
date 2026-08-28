# Walkthrough — named functions, not a shared object

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and the
decision the drill actually exists to make you confront.

---

## Before anything: encapsulation is not the hard part

`settings` is one object with five fields, imported by four files. Wrapping it in getters
is not difficult, and if that were the whole exercise it would not need a walkthrough. The
mechanical half takes about five minutes:

```ts
// before, in club-settings.ts
export const settings: ClubSettings = { /* ... */ };

// after — a getter next to the variable, no callers touched yet
let settings: ClubSettings = { /* ... */ };
export function remainingCapacity(): number {
  return settings.capacity - settings.memberCount;
}
```

The actual question this drill asks is what happens next: once every field has a getter,
what does a caller that needs the *whole* record get back? That question is where most of
the judgement in this file lives, and it is worth answering before writing a single
accessor — otherwise you write four scalar getters, hit a caller that wants three fields at
once, and reach for a shortcut under pressure instead of by decision.

## Why encapsulate before splitting the callers

The temptation is to fix one caller completely — redirect every field `registration.ts`
touches, verify it, move to the next file. That still works here, but it repeats the
getter-shape decision once per file instead of once. Writing all eight accessor functions
first, while every caller still reads `settings` directly, means the decision about what a
getter returns gets made exactly once, before any caller depends on the answer.

## Steps 1 and 2 — the accessors, before any caller moves

```ts
// added to club-settings.ts; settings is still exported at this point
export function currentDuesCents(): number {
  return settings.duesCents;
}
export function admitOneMember(): void {
  settings.memberCount = settings.memberCount + 1;
}
```

Tests are green here for a slightly suspicious reason: nothing has been *removed*. The four
callers still import `settings` and read it directly; the new functions are dead code from
the test's point of view. That is fine — this step is additive on purpose, so that step 7
(deleting the export) is the only step where a mistake would show up as a compile error
instead of a silent behaviour change.

**On the name.** `admitOneMember`, not `incrementMemberCount`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md): does the name say *what* or *how*?
`incrementMemberCount` describes the assignment (`memberCount = memberCount + 1`) — it
would still be a lie if admitting a member ever needed to do anything else, like stamping a
join date. `admitOneMember` describes the domain event, and at the call site in
`registration.ts` it reads as the sentence it is: "the club admits one member." Rejected
also: `addMember`, which takes no count and reads as though it could take an applicant —
question 4, is it true? It is not; the function takes nothing and returns nothing.

## Steps 3–5 — the read-mostly callers

`roster.ts` only reads, so redirecting it is close to mechanical:

```ts
// before
import { settings } from "./club-settings";
export function spotsRemaining(): number {
  return settings.capacity - settings.memberCount;
}

// after
import { remainingCapacity } from "./club-settings";
export function spotsRemaining(): number {
  return remainingCapacity();
}
```

This looks like a function calling a function that does the same one-line thing, which
raises a fair question: is `spotsRemaining` now a Remove Middle Man candidate? Not yet, and
not by accident. `club-settings.ts` is the only file allowed to know the record's field
names; `roster.ts` is the public face the rest of the program imports through
(`index.ts` exports `spotsRemaining`, never `remainingCapacity`). The middle man is the seam
between "how the record is shaped" and "what the roster board is asked" — the two
vocabularies are allowed to diverge, and right now they simply happen not to.

`treasury.ts` and `season.ts` redirect the same way — one import swapped for another,
suite green after each file. Neither is interesting enough to slow down for; that is the
point of doing the accessor design once, up front, in steps 1–2.

## Step 6 — `registration.ts`, last for a reason

```ts
// before
export function decideEntry(applicant: Applicant): EntryDecision {
  if (!settings.registrationOpen) {
    return { accepted: false, reason: `registration is closed for ${applicant.name}` };
  }
  if (settings.capacity - settings.memberCount <= 0) {
    return { accepted: false, reason: `the club is full for ${applicant.name}` };
  }
  settings.memberCount = settings.memberCount + 1;
  return { accepted: true };
}
```

This function reads two fields and, on the accept path, writes a third — in that order,
inside one function. It is last because it is the only caller where a mistranslation could
change *when* the mutation happens relative to the reads, and the tests that catch that
("rejects entry while registration is closed, without touching the member count") only mean
something once the earlier, simpler files have already proven the accessors themselves are
correct.

```ts
// after
export function decideEntry(applicant: Applicant): EntryDecision {
  if (!registrationIsOpen()) {
    return { accepted: false, reason: `registration is closed for ${applicant.name}` };
  }
  if (remainingCapacity() <= 0) {
    return { accepted: false, reason: `the club is full for ${applicant.name}` };
  }
  admitOneMember();
  return { accepted: true };
}
```

Encapsulating the variable did not remove the coupling between reading capacity and then
changing it two lines later — `decideEntry` still has to get the order right by hand,
nothing enforces "check, then admit" as one atomic step. That coupling is real and it is
out of scope: it is a check-then-act race in anything concurrent, and the fix for it is a
different move (folding the check into `admitOneMember` itself, or *Combine Functions into
Class*), not *Encapsulate Variable*. Naming the field access does not fix a bug that was
never about naming.

## Step 7 — the variable disappears

```ts
// before
export const settings: ClubSettings = { /* ... */ };

// after
let settings: ClubSettings = { /* ... */ };
```

Two things change at once, and both matter: `export` is dropped, and `const` becomes `let`.
Dropping `export` is the actual refactoring — it is the line that turns "please don't
import this" from a convention into a compile error. `settings` genuinely needs
reassignment now that it is mutated only through functions in this file (`configureSeason`
replaces every field at once at the start of a season), so `let` is not a downgrade; it was
already what the variable's behaviour needed, just previously hidden behind direct field
mutation that never touched the binding itself.

**On the name.** The interface stays `ClubSettings`, not renamed to something like
`ClubState`. Question 2 — could it be the name of something else? — argues for `ClubState`,
since "settings" suggests configuration a person chooses, and `memberCount` is not a
setting, it is a running count. I kept `ClubSettings` anyway: renaming the type without
renaming the file, the exported functions, or the domain vocabulary used everywhere else
would fix one word while leaving four others inconsistent, and a half-fixed name is worse
than a slightly-loose one. This is a case where question 4 (is it true?) says "not quite,"
but the fix is bigger than this drill and belongs in a separate rename pass, not folded
silently into an unrelated refactoring.

## Step 8 — the decision the drill is actually about

Once every field is behind a function, one design question is still open: what does a
caller get when it needs the whole record, not one field? Three real answers exist.

**Hand back the live object.**

```ts
export function getClubSettings(): ClubSettings {
  return settings;
}
```

Rejected outright. This is not really encapsulation — every caller can still do
`getClubSettings().memberCount = 999`, and now the mutation is one function call away from
looking sanctioned. A `readonly` modifier on `ClubSettings`'s fields would stop this at the
type level *inside this codebase*, but nothing prevents a caller from asserting a wider
type past the `readonly`, and nothing at all stops it once the value reaches plain
JavaScript code that never sees the `readonly` keyword. Encapsulate Variable exists to make
"who can change this" answerable by reading one file; this option makes it answerable by
reading one file *and trusting every caller to respect a type annotation*, which is not the
same guarantee.

**Hand back a copy.**

```ts
export function getClubSettings(): ClubSettings {
  return { ...settings };
}
```

Genuinely safe — no caller can reach the live record through this. But it buys safety with
a subtler problem: a copy is a snapshot, and this module's real callers need a *current*
value, not a value-as-of-the-moment-they-asked. Two calls to `getClubSettings()` thirty
lines apart could return two different answers with nothing distinguishing a stale read
from a fresh one — they are the same type. It also does not solve the actual problem this
drill's callers have, which is never "give me the whole record," it is always "give me one
field" or "do one specific thing." A copy is the right tool for a caller that legitimately
needs a consistent multi-field snapshot; none of the four files here are that caller.

**Push every operation behind an intention-revealing function.** This is what the solution
does: `currentDuesCents`, `remainingCapacity`, `admitOneMember`, `configureSeason`, and so
on — five fields, eight functions, no function that returns or accepts the whole record
except `configureSeason`, which exists because starting a season legitimately is a
five-field operation.

I committed to this option, and the cost is real, not hypothetical: **the surface only
grows**. Add a sixth field — say, a waitlist count — and there is no generic `set` to reuse;
someone writes `admitToWaitlist()` by hand, choosing a name, every time. A
`getClubSettings()` / `setClubSettings()` pair would have absorbed that field for free. I
chose the narrower surface anyway because every one of today's four callers wants a
specific operation, never the raw record, and a function named for what it does is
checkable by a reviewer in a way `setClubSettings({ memberCount: settings.memberCount + 1
})` is not — the reviewer would have to reconstruct the intention from an object literal
instead of reading it in the function name.

## What it cost, honestly

The one I am least sure about is `configureSeason`. It sets three configuration fields
(dues, rate, capacity) and resets two operational ones (`memberCount` to zero,
`registrationOpen` to true) in a single function, and the name only advertises the first
job — read literally, "configure" does not promise a reset, so by question 4 the name is
not quite true. The counter-argument, also true: a real committee never configures a
season's price *without* resetting the roster for the new season, and splitting this into
`configureSeason` plus `resetRoster` would let a caller configure without resetting, which
nothing in this domain wants. I left it as one function. A reviewer who split it would not
be wrong.

The other honest gap: `admitOneMember` and `raiseDuesBy` both mutate with no return value
and no confirmation. That is faithful to the original code's behaviour — `decideEntry`
never checked whether the increment "succeeded" because there was nothing to fail — but it
means the function name is the only signal a caller has that a mutation happened at all.
Fine for five call sites in one file; I would not want it at fifty.

## Where TypeScript changes this from the book

Fowler's *Encapsulate Variable* examples are JavaScript, where "please don't reach into
this" is a comment or a naming convention at best. Dropping `export` in step 7 is a
TypeScript-specific win the book's examples cannot fully have: it is a compiler error, at
every call site, immediately, rather than a lint warning or a code-review catch. The
`readonly` modifiers on `SeasonConfig`'s fields are the same story in miniature — they stop
`season.ts` from mutating the config object a caller handed it, which in plain JavaScript
would only be catchable by a test that happens to check for it.

## If you took a different route

- **Redirecting `registration.ts` first, not last.** Works, and the tests would still catch
  a mistake — they just catch it less specifically, because a broken read-then-write in the
  first file redirected gives you less evidence about whether the accessors or the caller
  is at fault.
- **One `settings` accessor object instead of eight top-level functions** — e.g.
  `export const clubSettings = { duesCents: () => settings.duesCents, admitOneMember: () =>
  { /* ... */ }, };`. Same encapsulation, different ergonomics: callers write
  `clubSettings.admitOneMember()` instead of an import. Defensible; I find the flat imports
  read better at each call site (question 3), but this is close enough to be a coin toss.
- **Naming the getters after the fields exactly** (`duesCents()` instead of
  `currentDuesCents()`). Also defensible, and shorter. I added `current` only on the two
  values that change over a season's lifetime (dues, late-fee rate) to distinguish "the
  value right now" from "the value the season started with" — `capacity` and
  `registrationOpen` get no prefix because there is no second version of them to
  disambiguate from.

What is *not* a matter of taste: leaving `settings` exported anywhere in the final state,
or handing the live record back from any getter. Either one means the refactoring did not
happen — the smell would still be present, just one indirection layer deeper and harder to
see.
