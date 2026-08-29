# Walkthrough — branch.manager, not six forwards

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: count what each method actually does

`Branch` in `src/` has six public methods:

```ts
managerName(): string { return this.#manager.name(); }
managerEmail(): string { return this.#manager.email(); }
managerPhone(): string { return this.#manager.phone(); }
isManagerCertifiedForRareBooks(): boolean { return this.#manager.isCertifiedForRareBooks(); }
managerYearsOfService(): number { return this.#manager.yearsOfService(); }
isManagerOnLeave(): boolean { return this.#manager.isOnLeave(); }
```

Six methods, six single-line bodies, and every body is the same shape:
`return this.#manager.<same-named-thing>()`. Not one of them adds a default, checks a
precondition, formats the result, or combines two fields. `Branch` is not modelling
anything here — it is retyping `Manager`'s public surface with a different prefix on each
name.

That is **Middle Man**: a class earning its keep by standing between a caller and the
object the caller actually wants, without doing anything on the way through. The tell is
mechanical and checkable before you write a line of the refactoring — list every public
method, write down whether its body is more than a single delegated call, and see how many
rows are empty. Here, all six.

## Why this order: expose before you delete

I made `manager` a public field and left all six forwarding methods in place, still doing
nothing, for one full step. That step changes no behaviour a test could observe — nothing
calls `branch.manager` yet — and that is exactly why it comes first: it is the one move in
this drill that cannot break anything, so it costs nothing to do before the moves that
could.

The alternative — deleting the forwards first, then fixing whatever stopped compiling — is
tempting because it looks like fewer steps. It also means the six-line compiler-error list
*is* your only record of what needed to change, and if `branch-ops.ts` weren't the only
caller (a real codebase might have a dozen), you'd be fixing everything in one motion with
no green checkpoint until the very end. Exposing first, then moving callers one file at a
time, then deleting, means every intermediate state actually runs.

## Step 1 — `manager` becomes public

```ts
// before
readonly #manager: Manager;
// after
readonly manager: Manager;
```

**On the name.** It stays `manager` — question 2 from
[`NAMING.md`](../../../../../../docs/NAMING.md), could it be the name of something else on
this class? `Branch` has `id` and `location`; neither is a manager, so the short name stays
unambiguous the moment it's public. I considered `branchManager`, matching the pattern the
forwarding methods used (`managerName`, not `name`) — and rejected it on question 3: read
the call site. `branch.manager.name()` already carries "branch" in the receiver;
`branch.branchManager.name()` repeats it for nothing. The forwarding methods needed the
`manager` prefix because they lived directly on `Branch` next to nothing that told the
reader whose manager it was. A field reached through `branch.` doesn't have that problem —
the receiver already said it.

## Step 2 — the six call sites in `branch-ops.ts`

```ts
// before
branch.isManagerCertifiedForRareBooks() && !branch.isManagerOnLeave()
// after
branch.manager.isCertifiedForRareBooks() && !branch.manager.isOnLeave()
```

**On the name, again — the interesting part.** Look at what happened to `isManagerOnLeave`
versus `Manager.isOnLeave()`, its own method. The word "Manager" is in the first and not the
second, and after this step it's gone from the call site too — `branch.manager.isOnLeave()`
says "manager" exactly once, at the property access, not twice. That tells you something
about the forwarding methods that was easy to miss while they still existed: the `Manager`
prefix on `isManagerOnLeave`, `managerName`, and the rest was never disambiguating anything
on `Branch` — `Branch` has no field called `name` or `onLeave` for it to be confused with.
The prefix existed because the method was sitting on the wrong object, and a reader one hop
away from the data it describes needs more words to say the same thing a reader standing
next to the data does not. That is a cost of Middle Man beyond the obvious one: it doesn't
just add indirection, it makes names longer than the concept they name, because the name is
doing work — pointing at the *real* owner — that the file structure should have been doing
instead.

I updated all six call sites in one commit, the same call I made for the six chain
collapses in [`drill-07-07`](../../../07-hide-delegate/README.en.md): they are not six
independent judgement calls, they are one substitution applied six times, and splitting it
further would not give a reviewer anything new to check on the second through sixth diffs.

## Step 3 — deleting the six forwarding methods

Before deleting, I grepped for each method name across the exercise the way both neighbour
drills in this module do before removing anything: `managerName`, `managerEmail`,
`managerPhone`, `isManagerCertifiedForRareBooks`, `managerYearsOfService`,
`isManagerOnLeave`, one at a time. Zero hits outside `branch.ts` itself, confirming step 2
actually moved every caller. Then delete, and let `tsc` be the second check — if a caller
had been missed, deleting the method turns it from "unused code sitting there" into a
compile error, which is a stronger statement than a clean grep on its own.

**On the name, a third time.** I did not keep any of the six as a convenience re-export —
for instance, keeping `managerName()` alone, on the theory that name is the one thing
almost every caller wants. I considered it and rejected it on question 4: is it true that
`Branch` only forwards `name`? Once one forward survives, `Branch`'s public shape is lying
by omission — it looks like it made a decision about which manager facts are worth
exposing, when actually the decision was "I got tired of deleting." A middle man half
removed is not a smaller middle man; it's an inconsistent one, and a future reader has to
work out why five facts go through `.manager.` and one doesn't.

## What it cost

Six call sites in `branch-ops.ts` that used to say `branch.<something>()` now say
`branch.manager.<something>()` — every one of them now names `Manager` directly, where
before `Branch`'s six methods were the only place that name appeared. That is real: a
caller reading `escalationContact` today learns, from the call site, that branches have
managers and managers have names and phones. Before this refactoring, that same caller
could have gotten just as far reading only `Branch`'s method names.

I don't think that cost bites here, and the reason is the same reason the refactoring was
worth doing in the first place — see the closing section — but the thing I am genuinely
unsure about is smaller and more mechanical: `manager` as a plain public field versus a
`manager(): Manager` accessor method. This module has both precedents already —
[`drill-07-05`](../../../05-extract-class/README.en.md)'s `Member` uses getter methods for
`id` and `name`; [`drill-07-07`](../../../07-hide-delegate/README.en.md)'s `Member` uses
plain public fields for the same two. I matched the field style, mostly because `manager`
holds a reference to a whole object rather than a primitive, and a field reads slightly more
honestly there — `branch.manager` says "here is the object," where `branch.manager()` reads
like it might be computing something. A reviewer who prefers this module's other convention
of exposing everything through a method, for the freedom to change the internal storage
later without a signature change, would have a fair complaint.

## If you took a different route

- **Deleting the forwarding methods before updating callers**, fixing whatever the compiler
  flagged. Faster to type, and you lose the green checkpoint between "callers moved" and
  "old surface gone" — worth doing once you're confident, not on your first pass.
- **Introducing an intermediate `branchManager(branch): Manager` free function** instead of
  a field, so callers write `branchManager(branch).name()`. Solves nothing a public field
  doesn't already solve, and adds a function to learn. I can't find a case for it here.
- **Leaving `Manager` un-exported from `index.ts`** while `branch.manager` is publicly
  reachable. That's what the solution actually does, and it's worth calling out rather than
  assuming: nothing stops an external caller from writing
  `const m: typeof branch.manager = ...` and getting full use of `Manager`'s methods without
  ever importing a name for its type. Hiding the type from the module's public exports does
  not hide the object graph once you've exposed a path to it. If truly restricting access to
  `Manager`'s type were a goal, exposing `branch.manager` at all would already have been the
  wrong call.

What is *not* a matter of taste: leaving even one of the six forwards in place "for
convenience," discussed above under step 3. An inconsistent middle man costs a reader more
than a consistent one, because now the shape itself needs explaining.

## Where TypeScript makes this different from the book

Fowler's Remove Middle Man walks through finding every caller by hand, the same as any
JavaScript refactoring in that book — there is no compiler to lean on for step 2's safety.
Here, changing `#manager` to `manager` (step 1) is what makes the *rest* of the refactoring
mechanically checkable: once the field is public, deleting a forwarding method in step 3
turns any caller you missed into `error TS2339: Property 'managerName' does not exist` at
its exact call site, rather than a runtime `undefined is not a function` discovered by
whoever happens to exercise that path next. The private-to-public field change is a small
edit, but it's the edit that converts "did I get all six callers?" from a question you
answer by rereading the codebase to a question the compiler answers for you.

## The question this drill and its inverse both have to answer

[`drill-07-07`](../../../07-hide-delegate/README.en.md) adds two forwarding methods so that
six call sites stop needing to know a `Member` has a `Membership`, which has a `Tier`. This
drill deletes six forwarding methods so that the same six call sites start saying, plainly,
that a `Branch` has a `Manager`. Read next to each other, they look like contradictory
advice — hide the delegate, expose the delegate — and that is exactly the wrong way to
remember either of them.

The actual test is a count, applied to whichever class is in front of you: how many methods
forward, how many call sites would change, whether the object on the other end is part of
the interface you actually want to publish, and whether the caller already knows that
object exists for some reason that has nothing to do with the forwarding methods
themselves. `Membership` and `Tier` failed all four checks in `drill-07-07` — six chained
call sites, all wanting one number, from a `Tier` that no caller had any independent reason
to know about. `Manager` passes all four here — six forwarding methods, one caller each, and
every one of those callers is branch-operations code that was never confused about a branch
having a manager; that's not a leaked implementation detail, it's the fact the escalation
card exists to communicate. Two classes, the same question, opposite answers, because the
counts are opposite — not because one refactoring is more correct than the other in
general. Count first, in your own codebase, before reaching for either drill's name.
