# Walkthrough — insuredValueCents lives on Instrument

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, and — the part this drill is actually
about — why one of the two identically-declared fields moves and the other does not.
Read it after you have your own version, not before.

---

## Before anything: two fields, one candidate

`WindInstrument` and `StringInstrument` each declare two fields the other also declares,
under the same name:

```ts
readonly insuredValueCents: number;
readonly gradeLevel: number;
```

The obvious move is "both are duplicated, pull both up." That is wrong for one of them,
and the whole point of this drill is noticing which.

**Check usage, not declaration.** `insuredValueCents` is read in exactly one place outside
these classes — `monthlyInsurancePremiumCents`, which multiplies it by a fixed rate and
does not care which subclass it came from. Both subclasses' constructors set it from a
`props.insuredValueCents` that means the same thing in both callers: what the school's
insurer would pay out if the instrument were lost. Same name, same type, same origin, same
consumer. That is what "the same field" actually means — not that two declarations look
alike side by side.

`gradeLevel` fails that test immediately. `WindInstrument.isSuitableFor` compares it against
a student's grade to decide whether they are ready for this instrument. `StringInstrument.
restorationCostMultiplier` uses it to scale a repair-cost estimate against the quality of
the instrument's timber. Same name, same declared type — `number`, 1 to 5 — and not the
same field. Nothing downstream would break today if you merged them: each instance would
still hold its own value, and the tests would still pass. The damage is not a test failure;
it is a future reader who sees `Instrument.gradeLevel` and reasonably assumes it means one
thing everywhere, then uses a wind instrument's suitability threshold where a string
instrument's timber tier belongs.

That asymmetry — one merge is free, the other is a trap that never trips an alarm — is why
this drill exists. Pull Up Field for methods is checked by the compiler: call the wrong
signature and it will not build. Pull Up Field for a *field* is checked by nothing but
reading what touches it.

## Why this order

Fowler's version of this move, applied literally: add the field to the superclass, then
remove it from each subclass, one at a time, running the suite after each removal. I follow
that shape exactly, because the alternative — remove both subclasses' declarations in one
commit — means a broken test after that commit could belong to either class, and you find
out which by bisecting a diff instead of reading a commit message.

I do the field-by-field decision — checking usage on both `insuredValueCents` and
`gradeLevel` — entirely before step 1. Once you start moving code, "does this actually
match" gets harder to ask honestly; you have already committed to the move and the question
starts to feel rhetorical.

## Step 1 — grow `Instrument`, touch nothing observable

```ts
// before
protected constructor(id: string, name: string) {
  this.id = id;
  this.name = name;
}

// after
protected constructor(id: string, name: string, insuredValueCents: number) {
  this.id = id;
  this.name = name;
  this.insuredValueCents = insuredValueCents;
}
```

Both subclasses now pass `props.insuredValueCents` to `super`, *in addition to* keeping
their own field and initializer. For one commit, the value is stored twice on every
instance — once by the base constructor, once by the subclass's own assignment, which runs
second and wins because it is the more specific declaration. Nothing a caller can observe
changes. This step exists purely so step 2 and step 3 each have something to delete rather
than something to invent.

**On the name.** `insuredValueCents`, not `insuredValue` or `insurance`. This is question 4
from [`NAMING.md`](../../../../../../docs/NAMING.md) — is it true? — applied to a unit, not
a description: every other money field in this codebase is suffixed `Cents`, and dropping it
here would make the one field that is not obviously a dollar amount indistinguishable from
one that is. `insurance` was the first draft and was rejected at question 2: it could be a
policy number, a provider name, or a boolean for "is this instrument insured at all." A
value that is specifically the amount insured for needs to say so.

## Steps 2 and 3 — delete one subclass's copy, then the other's

```ts
// WindInstrument, before
readonly insuredValueCents: number;
readonly gradeLevel: number;

constructor(props: WindInstrumentProps) {
  super(props.id, props.name, props.insuredValueCents);
  this.insuredValueCents = props.insuredValueCents;
  this.gradeLevel = props.gradeLevel;
}

// WindInstrument, after
readonly gradeLevel: number;

constructor(props: WindInstrumentProps) {
  super(props.id, props.name, props.insuredValueCents);
  this.gradeLevel = props.gradeLevel;
}
```

`StringInstrument` gets the identical edit in the next commit. Two commits, not one, for the
same reason `STEPS.md` gives: if a test fails after step 2, it is about `WindInstrument`
specifically, because `StringInstrument` has not been touched yet. Collapsing them into one
commit would save two lines of ceremony and cost you that signal the one time you need it.

Order between the two does not matter — I did `WindInstrument` first only because it is
declared first in `index.ts`.

## What did not change, and why that is the point

`monthlyInsurancePremiumCents` and `totalMonthlyInsurancePremiumCents` are byte-identical
before and after this entire drill:

```ts
export function monthlyInsurancePremiumCents(instrument: RentedInstrument): number {
  return Math.round(instrument.insuredValueCents * INSURANCE_RATE);
}
```

`RentedInstrument` is `WindInstrument | StringInstrument` — a union of two concrete
classes, not the abstract `Instrument`. TypeScript lets you read `.insuredValueCents` off a
union whenever every member of the union has it, regardless of *where* each member got it
from. That was already true before this refactor, because both subclasses declared the
field themselves. It stays true after, because both subclasses now inherit it. The pull-up
does not fix a type error here — there wasn't one. What it fixes is that the field's
declaration and initializer existed twice, in two files, with nothing forcing them to agree
if one insurance policy detail changed and the other edit got missed.

**On the name.** `RentedInstrument`, not `Instrument`, as the parameter type. Question 3 from
`NAMING.md` — does it read at the call site? — `monthlyInsurancePremiumCents(instrument)`
reads the same either way, so this one is really about question 4: is the type *true*? Every
instrument this school owns is rented to someone eventually, but that is not what the
billing code needs to assert; it needs "a wind or string instrument, specifically," because
those are the only two concrete shapes that exist. Typing the parameter as the abstract
`Instrument` would be true today and would silently stop being true the day a third
subclass — a percussion kit, say — is added without a rental-billing story yet.

## The field that does not move

`gradeLevel` stays declared twice, once per subclass, for the entirety of this drill. That
is not an oversight; leaving it alone is the harder half of the exercise. If you pulled it
up too — and the mechanical steps for it would look identical to `insuredValueCents`'s — the
suite would still pass, because nothing exercises `Instrument.gradeLevel` directly; only
`WindInstrument.isSuitableFor` and `StringInstrument.restorationCostMultiplier` read their
own copy, unaffected by what the base class happens to also call `gradeLevel`. That silence
is exactly why this is worth flagging in a walkthrough rather than trusting the tests to
catch it.

**On the name.** I considered renaming the two fields — `suitabilityGrade` on
`WindInstrument`, `timberGrade` on `StringInstrument` — to make the non-relationship
impossible to miss. Question 1 from `NAMING.md`: does the name say *what*, not *how*? Both
proposed names pass. I left them as `gradeLevel` anyway, and I am not fully sure that was
right — see below.

## What it cost, and what I am unsure about

**The cost that is easy to state:** `Instrument`'s constructor now takes three positional
parameters instead of two, and every future subclass must supply an
`insuredValueCents` even if the honest answer is "this one is never actually insured" — a
loaner practice kazoo the school hands out for a week, say. Nothing in the type system
would let that subclass opt out; it would have to pass `0` and hope nothing downstream
mistakes zero-insured for uninsured. That is a real, if speculative, cost of centralizing
the field.

**What I am not sure about:** leaving `gradeLevel` under the same name on both subclasses.
The argument for keeping it is that each name is independently well-earned — `gradeLevel`
genuinely says *what*, not *how*, on both `WindInstrument` and `StringInstrument` — and
renaming either one only to avoid a coincidence is optimizing for a reader comparing the two
files side by side, which is a narrower audience than the reader who only ever opens one of
them. The argument against is that the coincidence is precisely what makes the wrong pull-up
tempting in the first place, and a repository built to teach this exact judgment call might
reasonably want to remove the temptation rather than merely resist it. I chose to leave it,
because I think an exercise that hands you a real near-miss teaches more than one that
renames the near-miss away. A reviewer could reasonably disagree.

## If you took a different route

- **Deciding both fields belonged together as a `RentalTerms` value object**, holding
  `insuredValueCents` and nothing else, composed into `Instrument` rather than inherited.
  Defensible, and arguably the more scalable answer if a third or fourth shared field shows
  up later. Overkill for one field today — see chapter 7's *Extract Class*, a different
  drill, for when that composition is worth its own ceremony.
- **Skipping step 1** and editing all three files in one commit. It works. You lose the
  "which subclass, exactly, broke this" signal step 2 and 3 are built to preserve, and for
  a two-subclass hierarchy that signal is worth more than the one commit you save.

What is *not* a matter of taste: pulling up `gradeLevel` because it is declared the same way
as `insuredValueCents`. Matching declarations are a place to *look*, never a reason to
merge on their own — the reason has to be that the two fields are read and written for the
same purpose, and here they demonstrably are not.

## Where TypeScript changes the shape of the problem

Fowler's book, working in Java, would likely give both fields a getter on each subclass and
worry about whether the superclass's constructor signature is worth the churn across every
caller that constructs a subclass directly. TypeScript's structural typing removes half of
that worry here: because `RentedInstrument` is a union of the two concrete classes rather
than a reference to the abstract `Instrument`, no external caller's type signature had to
change at all — the union already exposed `.insuredValueCents` before the pull-up, and still
does after, regardless of which class the field is physically declared on. The refactor is
purely internal, with a public surface that never had to be told it happened. That would
still be true in Java through an interface with a getter, but nobody writes a two-line
getter-only interface for a single field in Java without a linter demanding to know why it
exists; TypeScript's unions make expressing "either of these two shapes, whichever it is"
free enough that it stops looking like ceremony.
