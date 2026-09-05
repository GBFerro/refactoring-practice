# Walkthrough — one `TermPricing`, a plan object standing in for the subclass

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: what the hierarchy is spending its one axis on

`src/` has an abstract `TermPricing` and two subclasses, `StandardTermPricing` and
`IntensiveTermPricing`, each overriding three methods: `sessionsPerTerm`,
`ratePerSessionCents`, and `categoryDiscountCents`. Read the third one in both files before
touching anything:

```ts
protected categoryDiscountCents(grossCents: number): number {
  switch (this.category) {
    case "adult":
      return 0;
    case "child":
      return 3000;
    case "concession":
      return Math.round(grossCents * 0.15);
  }
}
```

Identical. Not "the same idea, coded twice" — the same fourteen characters of logic, once
per subclass, because student category was never the axis this hierarchy was built to
carry. `StandardTermPricing` and `IntensiveTermPricing` exist to answer one question — how
long is the term — and every time the school needed a second question answered — what does
this student's category do to the price — the only place to put the answer was inside
whichever branch of the first question happened to be executing. Add a fourth category
tomorrow (a staff-family discount, say) and you edit two files that have nothing to do with
each other except that they both happen to compute a price.

That is **Repeated Switches**: not two switches that happen to look alike, but one switch
that has no single home, recurring wherever the code that needs it was already standing.
The single-inheritance hierarchy is not broken — it is full. It committed its one axis to
term length, and category has nowhere left to go except duplication.

## Why this order: remove the duplication before you touch the axis

I pulled the switch up to a single copy on `TermPricing` (step 1) *before* introducing
anything about plans or delegates. The alternative — going straight for the delegate while
the switch is still duplicated in two subclasses — means every subsequent step has to keep
both copies in sync, and a typo in one of them would be indistinguishable from a real
behaviour change caused by the refactoring you're actually trying to do. Pulling the switch
up first is safe on its own (it is Pull Up Method, from earlier in this chapter, applied to
two bodies already proven identical) and it means every step after it touches exactly one
copy of the discount logic, not two.

> This is the same note the reference drill makes about *Replace Temp with Query* showing
> up inside an *Extract Function* exercise: **refactorings come in flocks.** The catalog
> files them under separate chapters for reading; a real hierarchy in trouble usually needs
> two or three of them, in an order the book does not choose for you.

## Step 1 — pull up the switch

```ts
// before: identical in StandardTermPricing and IntensiveTermPricing
protected categoryDiscountCents(grossCents: number): number { switch (this.category) { /* ... */ } }

// after: on TermPricing, concrete, and deleted from both subclasses
protected categoryDiscountCents(grossCents: number): number { switch (this.category) { /* ... */ } }
```

Nothing about the numbers changes. What changes is that there is now exactly one place a
fourth category would be added, and `sessionsPerTerm` / `ratePerSessionCents` are the only
methods still forcing the subclasses to exist.

## Step 2 — a plan, not yet wired to anything

```ts
export interface TermLengthPlan {
  readonly sessionsPerTerm: number;
  readonly ratePerSessionCents: number;
}

export const STANDARD_TERM: TermLengthPlan = { sessionsPerTerm: 10, ratePerSessionCents: 4499 };
export const INTENSIVE_TERM: TermLengthPlan = { sessionsPerTerm: 4, ratePerSessionCents: 9000 };
```

This step compiles and changes nothing observable — nothing constructs a `TermPricing` with
a plan yet. That is deliberate, the same reason `drill-07-08` exposes a field for one whole
step before any caller reads it: additions that nothing calls cannot break a test that
already passes, so they are free to do before the steps that could.

**On the name.** `TermLengthPlan`, not `TermLengthOptions` or `TermLengthConfig`. I
considered both. "Options" and "Config" are the generic-suffix family
[`NAMING.md`](../../../../../../docs/NAMING.md) warns about under question 2 — they would
fit almost any two-field data holder in this codebase, which means they identify nothing
about *this* one. "Plan" earns its place on question 4: it is not a set of choices the
caller makes (there is nothing optional or configurable about it from the caller's side) —
it is the fixed shape a term of a given length has already committed to. A plan is
something you follow, not something you tune.

## Step 3 — `TermPricing` reads its own numbers

```ts
export class TermPricing {
  constructor(
    private readonly plan: TermLengthPlan,
    private readonly category: StudentCategory,
  ) {}

  sessionsPerTerm(): number {
    return this.plan.sessionsPerTerm;
  }
  // ratePerSessionCents likewise, used only inside termFeeCents
}
```

`sessionsPerTerm` and `ratePerSessionCents` stop being `abstract` and start reading from
`this.plan`. The two subclasses still exist at this point, and their overrides of these two
methods are now dead — they return the exact numbers the base class would already return,
just via a different route. I left them in for this one step rather than deleting them
alongside this change, so that step 4 is "delete something now provably redundant" and not
"delete something while also changing what replaces it."

**On the name.** The field is `plan`, not `termLengthPlan` or `lengthPlan`. Question 3 —
read the call site: `this.plan.sessionsPerTerm` already says everything it needs to inside
a class called `TermPricing`, where nothing else could plausibly be called `plan`. Repeating
`TermLength` in the field name would answer a question the surrounding class name and the
field's own type already answer twice over.

## Step 4 — the subclasses become plan binders

```ts
// before: computed
export class StandardTermPricing extends TermPricing {
  sessionsPerTerm(): number { return SESSIONS_PER_TERM; }
  protected ratePerSessionCents(): number { return RATE_PER_SESSION_CENTS; }
}

// after: nothing left to override
export class StandardTermPricing extends TermPricing {
  constructor(category: StudentCategory) {
    super(STANDARD_TERM, category);
  }
}
```

This is the step where the subclasses stop doing anything at all except naming a constant.
Compare the two class bodies above: the first genuinely computes something (a lookup into a
local constant, admittedly, but a method body with a return type to honour); the second is
a constructor whose only job is to remember which plan its own name promised. Once a
subclass's entire contribution is "pick a value and hand it to `super`," the subclass has
stopped being a specialization and started being a very expensive constant.

## Step 5 — inline at the call site, then delete

```ts
// before, in pricing.ts
export function priceTerm(request: TermPricingRequest): TermPricing {
  return request.length === "standard"
    ? new StandardTermPricing(request.category)
    : new IntensiveTermPricing(request.category);
}

// after
export function priceTerm(request: TermPricingRequest): TermPricing {
  return new TermPricing(termLengthPlan(request.length), request.category);
}
```

`priceTerm` was the only caller of either subclass constructor — I confirmed that by grep
before deleting anything, the same check `drill-07-07` and `drill-07-08` both run before
removing an accessor. With the one call site rewritten, `StandardTermPricing.ts` and
`IntensiveTermPricing.ts` have no reader left; deleting them and running `tsc` a second time
is the check that actually matters, because a stray reference anywhere else in the exercise
turns into a compile error the moment the files are gone, not a runtime surprise discovered
later. `TermPricing` drops `abstract` at the same step: nothing forces a subclass to fill in
anymore, so nothing should require one to exist to be constructed.

This is the refactoring's actual moment. Everything before it was preparation; this step is
where a decision that used to live in the type system (*which* subclass am I?) moves into a
value that lives in a field (*which* plan does this object hold?).

## What it cost

The honest version: `new TermPricing(STANDARD_TERM, category)` and
`new TermPricing(INTENSIVE_TERM, category)` are not obviously easier to read at their call
site than `new StandardTermPricing(category)` was. A subclass name is free documentation —
anyone reading `StandardTermPricing` in a stack trace, a debugger, or an error message knows
instantly what kind of pricing they're looking at. After this refactoring, a debugger shows
`TermPricing { plan: { sessionsPerTerm: 10, ratePerSessionCents: 4499 }, category: "child" }`
— correct, but you have to know that 10 sessions at 4499 cents means "standard" the way you
used to just read it off the class name.

I am not fully sure that trade is free even here, and it gets worse, not better, if this
codebase ever needs to answer "is this a standard-length term?" as a question in its own
right — today nothing does, but `instanceof StandardTermPricing` used to answer it for
free, and `this.plan === STANDARD_TERM` is a strictly worse version of the same check,
easy to get wrong if a plan is ever cloned or rebuilt instead of reused by reference. If
that need shows up, the honest fix is to give `TermLengthPlan` an explicit `readonly
length: TermLength` field and compare *that* — not to reach for the delegate identity as a
substitute type tag. I did not add it pre-emptively, because nothing in this exercise asks
for it and a field nobody reads is exactly the kind of guess *Speculative Generality* warns
against. I flag it here because "we might need to compare these later" is a real, specific,
answerable question, and pretending it isn't would be its own kind of dishonesty.

## If you took a different route

- **Turning `TermLengthPlan` into its own tiny class instead of a plain object with two
  constants.** Reasonable, especially if the plan grows a third field or some derived
  behaviour of its own later. Overhead here, where it is two numbers and nothing else.
- **Keeping `StandardTermPricing` and `IntensiveTermPricing` as thin, no-logic wrapper
  functions instead of deleting them outright** — e.g. `standardTermPricing(category)`
  returning `new TermPricing(STANDARD_TERM, category)`. Defensible if call sites elsewhere
  in a larger app read better naming the length than passing a constant; in this exercise
  there is exactly one call site, and it reads the constant's name directly, so the wrapper
  would be a function that exists only to rename an import.
- **A discriminated union instead of a class** — `type TermPricing = { kind: "standard" | "intensive"; category: StudentCategory }` plus free functions operating on it. This is a
  legitimate TypeScript-flavoured alternative to the whole exercise, not just to this step,
  and it is discussed below.

What is *not* a matter of taste: leaving `categoryDiscountCents`'s switch duplicated while
doing everything else in this file. That duplication is the actual smell this drill exists
to remove, and every one of the five steps above is safe specifically because step 1
removed it before anything else moved.

## Where TypeScript makes this different from the book

Fowler's own worked example for Replace Subclass with Delegate (a `Booking` with a
`PremiumBooking` subclass) is Java, where "just use a plain object with two fields" is a
heavier decision than it sounds — Java has no anonymous object literals as cheap as
`{ sessionsPerTerm: 10, ratePerSessionCents: 4499 }`, so the delegate almost always ends up
as its own named class even when, as here, it is genuinely only data. In TypeScript, an
`interface` plus two `const` values *is* the idiomatic version of "a delegate that is only
data," and reaching for a class here — giving `TermLengthPlan` a constructor and methods it
does not need — would be importing a Java-shaped answer into a language that does not
require it. The discriminated-union alternative mentioned above exists for the same reason:
TypeScript's structural typing makes "a value that carries its own kind as data" a first-
class, compiler-checked idiom, where Java would need either the class hierarchy this drill
just removed or a separate enum plus a switch — arguably not much of an improvement over
where we started.

## Where this sits next to `drill-12-11`

[`drill-12-11`](../../../11-replace-superclass-with-delegate/README.en.md) also ends with an
object holding a delegate instead of standing in an inheritance relationship, and it would
be easy to remember both drills as "replace the parent-child thing with a
has-a thing" and stop there. That would flatten two different diagnoses into one slogan.

Here, the hierarchy was never wrong about what it modelled — `StandardTermPricing` really
is a kind of `TermPricing`, and every method `TermPricing` declared, both subclasses
genuinely wanted. The problem was arithmetic: one hierarchy, one axis, and a second axis
that had already arrived. `drill-12-11`'s problem is not arithmetic at all — its subclass
does not want most of what its superclass offers, at any axis count. Ask which question
each drill is actually answering before reaching for either one: *do I need a second,
independent way to vary, and is duplicating logic across existing subclasses the only way
I've found to fake it?* is this drill's question. *Does the subclass actually want the
bulk of what it inherits, or does it spend most of its overrides refusing it?* is
`drill-12-11`'s. A hierarchy can fail either test, both, or neither — they are not two
names for one lesson.
