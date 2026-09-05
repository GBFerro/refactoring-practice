# Walkthrough — a boolean field where the subclass used to be

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and where I am
still not certain. Read it after you have your own version, not before.

---

## Before anything: what is `TrialStudent` actually varying?

```ts
export class TrialStudent extends Student {
  override termFeeCents(): number {
    return Math.round(this.input.baseFeeCents * TRIAL_FEE_FACTOR);
  }

  override kindLabel(): string {
    return "Trial";
  }
}
```

Two overridden methods, and both are driven by exactly one thing: whether this enrolment
is a trial. Not "varies with more state the longer you look" — the comment on
`TrialStudent` in `src/` says the rest of what used to differ (rental eligibility, notice
period, re-booking priority) already got retired or pulled level with every other student.
What is left is a class whose only job is to answer one yes/no question a different way.

That is **Lazy Element**: a piece of structure — here, an entire class in a hierarchy — not
pulling its weight. The tell is specific and checkable: grep every override in the
subclass, and confirm each one reduces to a fixed value keyed off data the object already
holds, never a computation that actually branches on more than that one thing. If you find
an override that inspects a *different* field, or that calls another method polymorphically,
stop — that class earns its keep and this is the wrong drill for it.

## Why this order: prove it before you route through it

The tempting shortcut is to jump straight to step 3 — change `enrolStudent` to always build
`Student` — and let the compiler tell you what is missing. That works, but it collapses two
separate questions into one diff: *is my copy of the trial logic correct*, and *is it safe
to stop building `TrialStudent`*. If the test suite fails after that single combined step,
you do not know which question you got wrong.

Steps 1 and 2 answer the first question with the risk turned off: the new branches in
`Student` are unreachable while `enrolStudent` still hands trial input to `TrialStudent`, so
nothing they contain can affect any test yet. That is deliberate — it lets you write and
re-read the copy at leisure, with the suite as a no-op sanity check, before step 3 makes it
live.

## Steps 1–2 — the branches, written where nothing can see them yet

```ts
// Student, after step 1
termFeeCents(): number {
  return this.input.trial
    ? Math.round(this.input.baseFeeCents * TRIAL_FEE_FACTOR)
    : this.input.baseFeeCents;
}
```

`this.input.trial` is available for the taking — it was already on `EnrolmentInput`, read
by `enrolStudent` to pick a constructor and by nothing else. `TrialStudent` never had to
manufacture a type code the way the book's canonical example does (a `Person` class with no
existing field to distinguish `Male` from `Female` until one is added by hand); it just had
to bother reading a field that was sitting right there. That is worth noticing on its own:
the hardest part of Remove Subclass, in the book, is often manufacturing the flag. Here it
already existed, which is what made the subclass a shortcut nobody needed to take a second
time, not a necessity.

**On the name.** I left the constant `TRIAL_FEE_FACTOR` named exactly as it was in
`TrialStudent`, unchanged by the move to `Student`. Question 1 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — does the name say *what*, or *how* — is
why: `TRIAL_FEE_FACTOR` says what the number means, never which class holds it, so moving
it costs nothing. If it had been called `OVERRIDE_RATE` or `SUBCLASS_MULTIPLIER`, the move
would have forced a rename, because the old name would have gone from true to false the
moment there was no longer an override doing the multiplying.

## Step 3 — the branch goes live

```ts
// before
export function enrolStudent(input: EnrolmentInput): Student {
  return input.trial ? new TrialStudent(input) : new Student(input);
}
// after
export function enrolStudent(input: EnrolmentInput): Student {
  return new Student(input);
}
```

**This is the step that can change behaviour**, and the only reason it is safe is that
steps 1 and 2 already put an exact copy of `TrialStudent`'s logic in place and the suite
was green with that copy sitting unreachable. If the copy had a typo — `* 0.6` instead of
`* TRIAL_FEE_FACTOR`, say — this is the step where the suite would catch it, and it would
be obvious which of the five steps introduced the bug.

**On the name.** `kindLabel()` kept its name through this step too, and I want to flag the
alternative I rejected: `type()`. Question 2 — could this be the name of something else in
this file — says no to `type()` immediately; every object in every module could plausibly
have a `type()`, which means the name identifies nothing about *what kind of thing* this
type is. `kindLabel()` survives question 2 because "kind" and "label" together commit to
"a short, displayable word for what sort of student this is," which nothing else on
`Student` could be confused for.

## Step 4 — deleting the file

Once `enrolStudent` no longer imports `TrialStudent`, nothing in the exercise references
it. Delete `trial-student.ts`. Nothing here is Remove Subclass's mechanics specifically —
it is the payoff of having done steps 1–3 correctly, made visible as a diff that only
removes lines.

## Step 5 — `protected` stops earning its keep too

```ts
// before
protected readonly input: EnrolmentInput;
// after
readonly #input: EnrolmentInput;
```

`protected` exists to grant subclasses access a private field would deny. Once step 4
removes the only subclass, `protected` is a promise to a reader that never gets kept — it
says "something else in this hierarchy needs to reach in here," and after this drill nothing
does. Tightening it to a true private field is not, strictly, part of Remove Subclass in the
book; it falls out of it, the same way `06-01`'s mutable position counter fell out of
switching a loop to `map`. I kept it as its own commit rather than folding it into step 4,
because a reviewer diffing step 4 alone should see a pure deletion, not a deletion mixed
with an access-modifier change.

**On the name.** `#input` versus `input`: TypeScript's private-field syntax (`#input`) is
not available to a `protected` field, so this rename was forced by the visibility change,
not chosen freely — the one case in this drill where the name had no real alternative to
weigh. Worth naming precisely because most of `NAMING.md`'s questions assume you are
choosing between candidates; sometimes the language hands you exactly one option and the
only judgement left is whether to take it.

## What it cost

Grep for `class .* extends Student` and you now get nothing — there used to be an
immediate, structural answer to "does Beckworth have more than one kind of student?", and
now that answer is buried inside an `if`-shaped expression in `termFeeCents()` and another
in `kindLabel()`, findable only by reading the class instead of the file tree. For two
methods and two branches, I think that is a clear win. I would not be as confident if
`Student` had six methods each with their own trial-vs-regular branch, or if the branches
disagreed with each other about what counts as "trial" — at that point the field is doing
the same job a subclass did, just spread across more places instead of one, which is a
regression, not a simplification. I do not have a crisp rule for exactly when the balance
tips; I would start worrying around three or four branch points.

## The question this drill and its inverse both have to answer

`drill-12-06` — Replace Type
Code with Subclasses, in this same module — does the exact opposite move for the exact
opposite reason: it takes a type code that a growing pile of conditionals keeps checking and
turns it into subclasses, one per value, so each behaviour that varies with the code lives
in its own place instead of in a switch. This drill takes a type code that used to justify
subclasses and folds it back into a field, because the behaviour that used to vary has
drained down to a single check repeated in two small methods.

Both are correct. The book teaches both because real code moves in both directions over
its life: a type code accumulates enough conditional logic that pulling it into subclasses
stops the switch from growing a fourth, fifth, sixth case each with its own copy-pasted
branch — and later, requirements change or get simplified until a subclass that once
carried real behaviour is back down to one fact about one object. A repository that only
ever taught the first move — extract subclasses, and never showed them being removed —
would not be teaching refactoring. It would be teaching a preference dressed as a rule,
and Fowler's own point about "when to stop" applies to hierarchies exactly as much as it
does to any other structure: the shape a codebase deserves depends on how much its
behaviour actually varies *right now*, not on how it was drawn the last time someone
touched it. The honest position is symmetric: create a subclass when behaviour starts to
vary in a way a conditional is straining to express; remove it when that variation drains
back out. Neither direction is the "advanced" one.

## If you took a different route

- **A `StudentKind` string union (`"regular" | "trial"`) instead of a boolean.** Genuinely
  defensible, and the one I went back and forth on longest. A union scales better if a
  third kind shows up — a boolean forces an awkward second boolean or a breaking type
  change, while a union just grows a member. I chose the boolean because exactly two kinds
  exist today and `EnrolmentInput.trial` already existed as a boolean before this drill
  touched anything; introducing a union would have been a second, unrelated refactoring
  (Replace Primitive with a richer type) riding along with this one. If a third kind
  appears, that is the moment to revisit this choice — and, per the note above, quite
  possibly the moment `drill-12-06`'s move becomes the right one again.
- **Deleting `TrialStudent` before touching `enrolStudent`.** Would not compile in between
  — a bigger single step disguised as safety. If it feels like one large nervous edit
  instead of five small confident ones, that feeling is the point of doing it this way
  instead.

What is *not* a matter of taste: the exact rounding in `termFeeCents()` (`Math.round`,
half-away-from-zero) and the exact strings `"Regular"` and `"Trial"` in `kindLabel()`. Both
are pinned by the shared test suite, and changing either while "just" removing a subclass
would be a behaviour change wearing a refactoring's clothes.

## Where TypeScript changes this from the book

Fowler's version of Remove Subclass is written against JavaScript, where nothing stops a
method from silently failing to override what it thinks it overrides — a typo in a method
name creates a new method instead of a compile error. Here, `noImplicitOverride` in
`tsconfig.base.json` means every `override` keyword in `trial-student.ts` is checked against
`Student` before step 4 even runs: if step 1 or 2 had renamed a method instead of copying its
body into the existing one, the compiler would refuse to build `TrialStudent` at all, long
before a test could tell you something was wrong. The type system does not replace the
inspection this drill asks you to do — reading `TrialStudent` in full before touching it —
but it does mean a specific, common slip in this exact refactoring turns into a compile
error instead of a silent behaviour change.
