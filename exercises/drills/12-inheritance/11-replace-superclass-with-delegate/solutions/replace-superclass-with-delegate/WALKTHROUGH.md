# Walkthrough — `LessonArchive` holds a `LessonRoster`, and is not one

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: count what the subclass actually wants

`src/lesson-roster.ts` declares six public methods: `add`, `insertAt`, `removeAt`,
`replaceAt`, `entries`, `count`. `LessonArchive extends LessonRoster` and overrides two of
them:

```ts
override insertAt(): never {
  throw new Error("LessonArchive is append-only: cannot insert at a position");
}

override removeAt(): never {
  throw new Error("LessonArchive is append-only: entries cannot be removed");
}
```

Two refused outright. Three inherited and wanted as-is (`add`, `entries`, `count`). That
leaves one — `replaceAt` — that is neither refused nor, on reflection, wanted: an archive of
completed lessons is supposed to be a permanent record, and "replace an entry" is exactly
the kind of edit that record exists to rule out. It just never got overridden. Nobody wrote
`override replaceAt(): never { throw ... }` next to the other two, and there is no
compiler error, no lint warning, and no failing test to tell you it's missing — `replaceAt`
type-checks fine, inherited unchanged, silently mutating an archive that every comment in
this file describes as immutable.

That is **Refused Bequest**, and the `replaceAt` gap is not a separate bug sitting next to
the smell — it *is* the smell, worked all the way through to its actual consequence. A class
that inherits an interface it mostly does not want has taken on an obligation: remember,
forever, to block every method that does not belong, as new ones get added to the parent
and old assumptions stop holding. `LessonArchive` kept that obligation for two of four
methods and dropped it for the third. Refusing piecemeal does not fail loudly. It fails by
omission, on whichever method you happened not to think of.

## Why this order: add before you remove

I gave `LessonArchive` its own `#roster` field and its three forwarding methods (steps 1–2)
*while it still extended `LessonRoster`*. For one full step, `LessonArchive` is
simultaneously a subclass of `LessonRoster` and a wrapper around one — redundant, and
exactly why that redundancy is worth a step of its own. Nothing observable changes yet:
every existing caller still goes through the inherited surface, unaware three brand-new
methods now sit on top of it doing the same job through a different path.

The alternative — dropping `extends LessonRoster` first, then fixing whatever the compiler
flags — collapses the safe half of this refactoring and the risky half into one commit.
Here, with a small, fully-controlled exercise, that would probably still work. In a real
codebase, where you cannot be certain nothing reaches past the three safe methods to call
`add`'s siblings directly on some `LessonRoster`-typed reference, doing the addition first
means every subsequent step keeps the suite green against a `LessonArchive` that is
provably still a working `LessonRoster` — right up until the one step that deliberately
stops it from being one.

## Step 1 — a private field, redundant on purpose

```ts
export class LessonArchive extends LessonRoster {
  readonly #roster = new LessonRoster();
  // ...
}
```

`LessonArchive` now holds a second, entirely separate `LessonRoster` instance — its own
inherited storage sits unused right alongside it. That duplication is temporary and
deliberate: it lets step 2 build and prove the delegate-based methods before anything
depends on them, and it is gone again by step 4.

**On the name.** `#roster`, not `#delegate` or `#inner`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md): the name should survive a rewrite of the
body, and `#roster` says *what it is* — a `LessonRoster` — not *what role it plays in this
refactoring*. `delegate` is a mechanism's name, useful in prose like this walkthrough, but
a poor field name: it would still be called `delegate` long after anyone reading the class
had forgotten this refactoring ever happened, at which point the name would describe a
design pattern instead of a thing.

## Step 2 — three forwards

```ts
add(lesson: Lesson): void {
  this.#roster.add(lesson);
}

entries(): readonly Lesson[] {
  return this.#roster.entries();
}

count(): number {
  return this.#roster.count();
}
```

Each one calls straight through to the private field. Tests still pass unchanged at this
point, because nothing calls these three new methods yet — every existing test still
exercises the inherited path. That is what makes this step safe to do before step 3 checks
anything: pure addition cannot regress a suite that was already green.

**On the name.** All three keep `LessonRoster`'s own names — `add`, not `record` or
`archive`; `entries`, not `all` or `list`. Question 3: read the call site.
`archive.add(lesson)` already tells you what's happening because the receiver is named
`LessonArchive` — repeating that in the verb (`archive.archive(lesson)`, `archive.record(lesson)`)
would not clarify anything the receiver hadn't already said, and it would break the one
useful property these three names have today: a caller migrating from
`LessonRoster`-shaped code to `LessonArchive`-shaped code doesn't have to relearn a single
verb.

## Step 3 — confirm before you cut

This step changes no code. Before removing the inheritance relationship, I grepped the
exercise for every one of `LessonRoster`'s six method names, looking specifically for a
caller that reaches an archive through `insertAt`, `removeAt`, or `replaceAt` — the ones
about to disappear — or that holds a `LessonArchive` in a variable typed as `LessonRoster`,
which would keep the inherited surface reachable through a side door even after step 4.
Found none. This is the same check `drill-07-07` and `drill-07-08` both run before deleting
an accessor: "I rewrote every call site I found" and "there is no call site left" are
different claims, and only rereading the diff checks the first one.

## Step 4 — stop inheriting

```ts
// before
export class LessonArchive extends LessonRoster {
  override insertAt(): never { throw new Error(/* ... */); }
  override removeAt(): never { throw new Error(/* ... */); }
}

// after
export class LessonArchive {
  readonly #roster = new LessonRoster();
  // add, entries, count — from step 2, unchanged
}
```

`extends LessonRoster` is gone, and with it, both throwing overrides — there is nothing
left to override. `replaceAt`, the one nobody remembered to block, disappears the same way,
without anyone having to remember it a second time. That is the actual argument for this
refactoring, not a preference about class hierarchies in the abstract: a method that was
never inherited cannot be forgotten-and-left-exposed, because forgetting only endangers
things you still have.

`tests-fixed/` is where this gets checked directly rather than argued in prose — see below.

## What it cost

Three one-line methods that used to be free. `add`, `entries`, and `count` did not need
writing while `LessonArchive extends LessonRoster`; now they do, and if `LessonRoster` ever
grows a genuinely useful fourth safe method — a `latest(): Lesson | undefined`, say — it
does not arrive on `LessonArchive` automatically the way it used to. Someone has to notice
it exists, decide it's wanted, and add a fourth forward by hand. Inheritance was giving this
class free upgrades for methods it never asked to refuse; losing that is a real cost, not
just the cost of the two methods this drill's whole premise says should never have been
free in the first place.

The part I am less certain about: `add`, `entries`, and `count` happen to have exactly the
same names and signatures as their `LessonRoster` counterparts, which makes the forwards
feel almost too easy — three lines, no judgment calls, done. If `LessonArchive` had wanted a
*differently shaped* safe operation — say, archiving a whole term's worth of lessons at
once instead of one at a time — this same refactoring would have required designing that
new shape, not just copying three signatures across. I got lucky that the safe subset here
needed no redesign. I would not assume that generalizes to every Refused Bequest you meet.

## If you took a different route

- **Extracting an interface (`type Archivable = { add; entries; count }`) that both
  `LessonRoster` and the delegate-holding `LessonArchive` implement**, so callers can be
  typed against the interface rather than the concrete class. Reasonable, and worth doing
  the moment a second class wants to be "archive-shaped." With exactly one implementer, it
  is a layer with nothing yet to abstract over.
- **Making `#roster` a constructor parameter (dependency injection) instead of a field
  initializer**, so a test could substitute a fake `LessonRoster`. Fine instinct in general;
  here `LessonRoster` has no external dependencies of its own (no clock, no I/O), so a fake
  would just be a second, slower `LessonRoster`.
- **Keeping the two throwing overrides as documentation** even after removing `extends`,
  by adding matching methods on `LessonArchive` that throw the same errors. I considered
  this, for readers who might type `archive.insertAt(...)` out of habit and want a clear
  message instead of a compiler error. I rejected it: a compiler error at the call site is
  strictly more informative than a runtime throw, arrives before the code ships instead of
  when it runs, and does not require `LessonArchive` to keep re-declaring methods it does
  not have.

What is *not* a matter of taste: leaving even one refused method un-overridden, the way
`replaceAt` was left in `src/`. That gap is not a smaller version of Refused Bequest — it's
the version that ships to production silently, and it is the entire reason this
refactoring is worth doing rather than just writing a third `override … : never` and
calling it finished.

## `tests-fixed/`, and why the shared suite could not carry this

[`tests-fixed/no-forgotten-mutation.spec.ts`](../../tests-fixed/no-forgotten-mutation.spec.ts)
checks that `LessonArchive` has no `replaceAt` property at all. It cannot live in
`tests/`, because `tests/` has to compile and pass against `src/` too, and against `src/`
the check would fail on purpose — `replaceAt` is exactly the method the challenge forgot to
block, and it happily accepts a call there. That disagreement between the two versions is
not a coincidence to work around; it is the one thing this drill's target actually repairs,
and `fixesBug: true` exists in `meta.json` for precisely this shape of exercise: a
refactoring that does more than reorganize code, because the old code was wrong in a way
the shared suite is structurally unable to pin.

## Where TypeScript makes this different from the book

Fowler's Refused Bequest examples lean on a runtime check — `UnsupportedOperationException`
in Java's own collection framework is the canonical real-world instance, thrown by a
supposedly-`List`-shaped object that refuses to actually support every `List` operation.
TypeScript's structural type system changes what "refuses" can mean here in a way the book's
examples do not have available: once `LessonArchive` stops declaring `extends LessonRoster`,
`replaceAt` is not merely unimplemented, it is absent from the type — `archive.replaceAt`
is a compile error, not a method that exists and throws. The Java version of this fix still
needs the throwing override, because Java's nominal typing means `LessonArchive` either
`implements List` (and must provide every method, refusing loudly where it must) or it does
not participate in code written against `List` at all. TypeScript's structural typing makes
the delegate genuinely narrower than its source, not just differently-behaved at the same
width — a distinction the book's Java examples cannot draw, because Java does not let a
class un-inherit a method's mere existence.

## Where this sits next to `drill-12-10`

[`drill-12-10`](../../../10-replace-subclass-with-delegate/README.en.md) also ends with a
class holding a delegate rather than participating in a parent-child relationship, and it
is tempting to file both drills under "replace inheritance with composition" and stop
there. Resist it — the two diagnoses are different, and only one of them is this drill's.

`drill-12-10`'s `TermPricing` hierarchy was never wrong about *what* it modelled: a standard
term genuinely is a kind of term pricing, and every method the base class declared, every
subclass genuinely wanted. Its problem was capacity — one hierarchy, one axis, and a second
axis with nowhere to go. `LessonArchive`'s problem is the opposite shape entirely: the
hierarchy was never short on room, it was over-generous. `LessonRoster` offered six
methods and `LessonArchive` wanted three, refused two outright, and quietly inherited a
fourth it should have refused too. Ask which question fits the code in front of you: *is
this hierarchy full, with a second axis it has nowhere to put?* — that's `drill-12-10`.
*Does this subclass spend its overrides refusing most of what it inherits, and can you
trust that every refusal actually got written?* — that's this one. A hierarchy can fail
either test, both, or neither. Neither drill is the default reach for "delegate" — the
count you take first is what decides which one, if either, applies.
