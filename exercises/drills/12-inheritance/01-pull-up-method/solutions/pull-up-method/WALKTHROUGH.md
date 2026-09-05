# Walkthrough — one billingAmountCents(), shared by both lesson types

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: are these two methods actually the same?

`PrivateLesson.billingAmountCents()` and `GroupLesson.billingAmountCents()` in `src/` read:

```ts
// PrivateLesson
billingAmountCents(): number {
  const tuitionCents = (this.tutor.hourlyRateCents * this.durationMinutes) / 60;
  return Math.round(tuitionCents + this.#materialsFeeCents);
}

// GroupLesson
billingAmountCents(): number {
  const tuitionCents = (this.tutor.hourlyRateCents * this.durationMinutes) / 60;
  return Math.round(tuitionCents + this.#suppliesFeeCents);
}
```

Line for line, the same shape: tuition from the tutor's rate and the minutes booked, plus a
flat fee, rounded once at the end. The only difference is which private field supplies the
fee. That is the whole of the "honest complication" this drill exists to make you sit with:
the book's Pull Up Method examples show two bodies that are already identical, and real
duplicate code is almost never that polite. Before you can pull anything up, you have to
answer a harder question than "are these similar" — you have to answer "are these the *same
thing*, described two different ways."

Here, they are. `#materialsFeeCents` and `#suppliesFeeCents` are both populated from the
exact same constructor property, `materialsFeeCents` — `GroupLesson`'s constructor just
assigns it to a differently-named private field:

```ts
// GroupLesson, before this drill
constructor(props: GroupLessonProps) {
  super(props);
  this.#suppliesFeeCents = props.materialsFeeCents;
  this.#students = props.students;
}
```

That is not a real difference in what the fee *means* — it is a naming accident, the kind
that happens when the second lesson type gets written by someone who did not reread the
first one closely enough. The tell that it is safe to treat as an accident rather than a
real distinction is the constructor: the *public* name was never inconsistent, only the
private storage was. If `GroupLessonProps` had called it `suppliesFeeCents` too, this would
be a different, harder exercise — you would first have to go ask someone at Beckworth
whether materials and supplies fees are actually meant to be the same line item, and no
refactoring catalog entry can answer that question for you.

## Why this order: agree on a name before you touch a field

I renamed the private field first, moved the field to `Lesson` second, and moved the method
last. Each step is safe specifically because of what came before it:

- Renaming first means that by the time I look at Pull Up Field, both subclasses already
  agree on what to call the thing being pulled up. Trying to pull up two differently-named
  fields at once means either picking one name and hoping it's the right one, or doing the
  rename *during* the field's move — two judgement calls happening in the same commit.
- Moving the field before the method means `Lesson` has somewhere to put the value the
  method needs before the method arrives asking for it. Attempting the method move first
  would mean writing `billingAmountCents()` on `Lesson` against a field that does not exist
  there yet, and letting TypeScript's error message tell you what step you skipped.

## Step 1 — renaming the field, not the property

```ts
// before
this.#suppliesFeeCents = props.materialsFeeCents;
// ...
return Math.round(tuitionCents + this.#suppliesFeeCents);

// after
this.#materialsFeeCents = props.materialsFeeCents;
// ...
return Math.round(tuitionCents + this.#materialsFeeCents);
```

Tests are green before and after this step, because nothing observable changed — the field
still holds the same value, computed the same way, from the same constructor input. That is
what makes it safe to do as its own commit rather than folding it into the field's move: a
step that changes zero call sites is a step where "did I break something" has exactly one
possible cause, a typo, and the compiler catches that for you.

**On the name.** I chose `materialsFeeCents` over `suppliesFeeCents` — question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md): which one is true to what the field is
*for*? Both drift equally on their own; the deciding fact is that
`PrivateLesson` already used `materialsFeeCents` and had one more reference in the codebase
than `GroupLesson` did (the constructor property name), so renaming `GroupLesson`'s field to
match cost one edit instead of two. That is a practical tiebreaker, not a claim that
"materials" is a more correct word than "supplies" for a flat per-lesson charge — a fair
reviewer could prefer the reverse rename, and nothing about the domain settles it either
way.

## Step 2 — a checkpoint, not a diff

Nothing to commit here, which is the point of listing it. Read both `billingAmountCents()`
bodies side by side and confirm they are now identical, character for character. If step 1
had been a coincidence — if the two fees had actually diverged in value on some input I had
not tested — this is where I would have caught it, before pulling up a method that quietly
picks one behaviour and discards the other.

## Step 3 — Pull Up Field

```ts
// Lesson, before
export interface LessonProps {
  readonly tutor: Tutor;
  readonly durationMinutes: number;
}
export abstract class Lesson {
  protected readonly tutor: Tutor;
  protected readonly durationMinutes: number;
  protected constructor(props: LessonProps) {
    this.tutor = props.tutor;
    this.durationMinutes = props.durationMinutes;
  }
  abstract invoiceDescription(): string;
}

// Lesson, after
export interface LessonProps {
  readonly tutor: Tutor;
  readonly durationMinutes: number;
  readonly materialsFeeCents: number;
}
export abstract class Lesson {
  protected readonly materialsFeeCents: number;
  protected constructor(props: LessonProps) {
    // ...
    this.materialsFeeCents = props.materialsFeeCents;
  }
}
```

`PrivateLessonProps` and `GroupLessonProps` already extended `LessonProps`, so adding
`materialsFeeCents` there and deleting it from each subclass's own props interface is the
whole move — both subclasses still accept exactly the same constructor argument shape from
the outside, because `materialsFeeCents` was always one of the properties callers passed.
Nothing about the public constructor signature changed; only which class stores the value
changed.

**On the name.** The field keeps its name across the move — question 3, does it read at the
call site? `new PrivateLesson({ ..., materialsFeeCents: 500, ... })` already reads correctly
before this step and would read identically after a hypothetical rename, so there is no call
site pushing for a change. I considered `feeCents`, shorter and true of both lesson types
equally now that it lives on the shared class — and rejected it on question 2: `Lesson`
has no other fee, but a class that only bills one flat fee today is exactly the kind of
class that grows a second one, and `feeCents` would stop identifying anything the moment it
did. `materialsFeeCents` is slightly too specific to "private lesson materials" for a
group lesson's supply costs, and I don't think that's fully resolved — see "What it cost"
below.

## Step 4 — Pull Up Method

```ts
// Lesson, after
billingAmountCents(): number {
  const tuitionCents = (this.tutor.hourlyRateCents * this.durationMinutes) / 60;
  return Math.round(tuitionCents + this.materialsFeeCents);
}
```

Deleted from both `PrivateLesson` and `GroupLesson` — by this point their bodies are
identical to each other and to what `Lesson` now has, so the deletion is a formality the
compiler would catch if I got it wrong: any remaining subclass copy would just shadow the
new one silently, which is why I diffed the three bodies one more time before deleting
rather than trusting that "I copied it correctly."

**On the name.** `billingAmountCents`, unchanged from both subclasses. Question 1 — does it
survive a rewrite of the body? Yes: if Beckworth ever switched from a flat materials fee to
a tiered one, `billingAmountCents()` would still be true, because it never promised *how*
the amount was computed, only that it answers "what does this lesson bill for." A name like
`tuitionPlusFlatFeeCents` would have failed the moment that promise changed, which is
exactly the trap question 1 exists to catch.

## Step 5 — the union type gets to retire

```ts
// invoice.ts, before
type BillableLesson = PrivateLesson | GroupLesson;
export function invoiceLine(lesson: BillableLesson): string { /* ... */ }

// invoice.ts, after
export function invoiceLine(lesson: Lesson): string { /* ... */ }
```

`BillableLesson` existed only because `Lesson` didn't declare `billingAmountCents()` — the
union was standing in for "either concrete lesson type, which both happen to have this
method." Once the method is on `Lesson` itself, the stand-in has nothing left to do. This
step is not required by the "done when" checklist — the union still compiles and still
works after step 4 — but leaving it in place would mean `invoice.ts` keeps advertising a
distinction (`PrivateLesson | GroupLesson`, not `Lesson`) that the rest of the codebase no
longer needs to make. I think this is worth doing; a stricter reading of "did the drill ask
for this" would say it's optional, and that reading isn't wrong either.

## What it cost

`Lesson` now holds a `materialsFeeCents` field it did not have an opinion about six months
of this codebase's fictional history ago, and both subclasses are permanently committed to
treating their flat fee as the same kind of thing. If Beckworth ever needs group lessons to
charge *per student* instead of one flat supplies fee for the room, `billingAmountCents()`
stops being shared, and someone has to partially reverse this exact drill — either by
overriding it in `GroupLesson` (which reintroduces the duplication this drill removes, just
with an inheritance layer around it) or by finding a different shape entirely, closer to
what [`drill-12-04`](../../../04-push-down-method/README.en.md) is about.

The thing I am least sure of is the field's name. `materialsFeeCents` reads naturally on
`PrivateLesson`, where "materials" (sheet music, a practice book) is literally what the fee
is for. On `GroupLesson` it is closer to shared classroom supplies — close enough to be
defensible, not obviously the word a Beckworth admin would pick first. I chose it because it
already existed on one side and cost one rename instead of two; a reviewer who insisted on a
more neutral `flatFeeCents` would have a real point.

## If you took a different route

- **Renaming to `suppliesFeeCents` instead of `materialsFeeCents`.** Equally valid — my
  tiebreaker (fewer edits) is a coin flip with a slight weight on one side, not a rule.
- **Pulling up the field and the method in one commit.** Would still pass every test; I
  split them so a reviewer can tell, from the diff alone, that step 3 changes nothing
  observable and step 4 is where the real consolidation happens.
- **Keeping `BillableLesson` in `invoice.ts`.** Discussed above — a defensible choice to
  leave alone, since nothing forces its removal.

What is *not* a matter of taste: pulling up `billingAmountCents()` while `#materialsFeeCents`
and `#suppliesFeeCents` were still two different names. That would compile as two identical
method bodies sharing one class only by coincidence of arithmetic, and the first person who
renamed one of the two "identical" private fields for an unrelated reason would silently
break the assumption that made the merge safe in the first place. Renaming first is not
optional caution here; it's the step that turns a guess into a fact.

## Where TypeScript makes this different from the book

Fowler's Pull Up Method mechanics say: check the method bodies are identical, then move the
method and delete the old copies, and — as a documented sub-case — if the method uses a
field, Pull Up Field first. In JavaScript that check is manual: read both bodies, trust your
eyes, move on. Here, once the field was pulled up in step 3, TypeScript would have refused
to compile step 4 if I had gotten the field name wrong on either subclass — a missing or
misspelled field turns into `error TS2339` instead of a silently wrong invoice. The
compiler cannot tell you whether pulling the field up was the *right* call, only whether the
code that assumes it happened will run — but for the mechanical half of this exercise, that
narrower check is the one doing the daily work.

## The question this drill and its inverse both have to answer

[`drill-12-04`](../../../04-push-down-method/README.en.md) removes a method from a
superclass because only one subclass ever uses it. This drill adds one to a superclass
because *both* subclasses use it, identically. Read next to each other, the two might look
like they're answering different questions — when do you move code up the hierarchy, when
do you move it down — but the actual test is the same one, run in both directions: **who
needs this, and does everyone who inherits it actually want it?**

Here, both `PrivateLesson` and `GroupLesson` compute a bill the same way, so
`billingAmountCents()` moving up costs nothing — nobody inherits a promise they can't keep.
`drill-12-04`'s `Tutor` hierarchy fails that test from the other side: `weeklyPayrollHours()`
sits on `Tutor`, but only `StaffTutor` is ever paid that way, so every `FreelanceTutor` that
inherits it inherits a method the type system says it has and the business says it should
never be asked to answer. A superclass method every subclass genuinely needs belongs up. One
most subclasses would refuse is a lie about what the superclass promises — and pushing it
down is how you stop making that promise. Same question, opposite directions, because the
counts point opposite ways.
