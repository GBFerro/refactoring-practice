# Walkthrough — one class per instrument family, one switch left in the factory

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and where I am
not fully certain. Read it after you have your own version, not before.

---

## Before anything: two type codes, one decision

`Instrument` carries two string fields that both look, on the page, like the same kind of
thing:

```ts
private readonly category: InstrumentCategory;   // "string" | "brass" | "woodwind" | "percussion"
private status: LendingStatus;                    // "available" | "onLoan" | "inRepair"
```

Only one of them is this drill's target, and the reason is not that `category` has more
conditionals on it, though it does - it is switched on in three separate methods, which is
**Repeated Switches**: the same decision, forked in three places that must be kept in sync
by hand. `status` is read in exactly one place (`isAvailableToLend`) and written in three
small mutators, which is not a smell at all yet.

The reason that actually decides this is sharper than counting switches, and it is worth
stating before touching any code: **`category` is set once, in the constructor, and never
changes again for the life of the object. `status` is *supposed* to change - checking an
instrument out, returning it, sending it for repair are the whole point of the class.**
An object cannot change its class at runtime. Turning `category` into a subclass costs
nothing, because nothing ever needed to reassign it. Turning `status` into a subclass would
mean that calling `checkOut()` on an `Instrument` had to somehow turn it into a different
kind of object *in place*, while every existing reference to it - an entry sitting in an
array passed to `renderLendingBoard`, say - kept pointing at the old one. There is no way to
do that. This is the test to apply before reaching for this refactoring at all, and it is a
harder constraint than "is there a switch": a repeated switch over a field that mutates is
not a subclassing opportunity, no matter how tempting the symmetry looks - it is a field a
subclass could otherwise plausibly represent, ruled out by the one property that actually
matters. [`drill-12-07`](../../../07-remove-subclass/README.en.md) starts from the far side
of this exact line: a type code (`trial`) that was briefly a subclass and got folded back
into a field once the behaviour that justified the split drained away. Both drills are
policing the same boundary from opposite directions.

## Why this order: one family at a time, not one method at a time

[`drill-10-04`](../../../../10-conditional-logic/04-replace-conditional-with-polymorphism/README.en.md) - Replace Conditional with
Polymorphism - looks similar on the page: a type code, several switches, ending in classes
and a factory. It even solves the same chapter-3 smell, Repeated Switches. But its route
moves *method by method*: pick `appointmentDurationMinutes`, move all three of its cases
onto the classes, then move on to the next switch. That order makes sense there because the
thing varying by type was never a persistent object - a fresh `AppointmentType` string
arrives with every booking call, gets classified, and is thrown away. There is nothing to
build "wrong" about one type before another; every appointment type is independent data,
requested afresh each time.

Here the thing varying by type is a `Instrument` that gets constructed exactly once, by
`addInstrument`, and then lives in the library for months - checked out, returned, repaired,
checked out again. Replacing its type code means replacing *which class an actual, ongoing
object is*, not just which value a temporary calculation used. So this route goes *family by
family*: build `StringInstrument` completely, route real string instruments through it,
confirm the suite is still green, and only then start on brass. Each step commits to one
family's identity being right before the next family is touched, because getting a family's
identity wrong here is not a bad number in a report - it is every string instrument in the
library quietly carrying wrong data for as long as it exists.

## Step 1 — four empty subclasses, nothing wired in

```ts
export class StringInstrument extends Instrument {}
```

Four of these, all identical, all unused. `addInstrument` still always returns a plain
`Instrument`. This is scaffolding, not a refactoring in itself - it exists so that steps 2
through 6 are each a small, one-directional move instead of "invent the class and populate
it and wire it in" as one large edit.

## Steps 2 and 3 — proving the pattern once, safely

```ts
// step 2 - StringInstrument, still unused
override rentalDepositCents(): number {
  return 5000;
}
```

Copied verbatim from `Instrument`'s `"string"` case. Nothing calls `StringInstrument` yet,
so this step cannot change any test's result - which means I can compare the three copied
numbers against the three original `case` bodies at my leisure, the way
[`drill-12-07`](../../../07-remove-subclass/README.en.md) writes its field-reading branches
before routing anything through them.

```ts
// step 3 - the live step
export function addInstrument(input: InstrumentInput): Instrument {
  switch (input.category) {
    case "string":
      return new StringInstrument(input);
    default:
      return new Instrument(input);
  }
}
```

**This is the step that can change behaviour.** If step 2's copy had a typo - `4500`
instead of `5000` - this is where the suite catches it, and it is obvious which of the two
steps introduced the bug. The `default` clause is deliberate: three categories still need
the old, still-correct `Instrument` behaviour, and a `switch` without it would force me to
either duplicate every remaining case or add a case I am not ready to write yet.

## Steps 4 through 6 — the same move, three more times, faster

Brass, woodwind, and percussion each get their override and their `case` in one commit
apiece, rather than split like string was. This is not carelessness; it is the payoff of
having done the careful version once. By step 4 the pattern has been validated end to end -
copy, verify by inspection, route, watch the suite stay green - and repeating the full
ceremony three more times would teach nothing a reader hasn't already seen. `drill-10-04`
makes exactly this call in its own `STEPS.md` ("the three are independent... doesn't
matter"), for the same reason.

Step 6 ends with a small deletion worth calling out on its own:

```ts
// before step 6
switch (input.category) {
  case "string": return new StringInstrument(input);
  case "brass": return new BrassInstrument(input);
  case "woodwind": return new WoodwindInstrument(input);
  default: return new Instrument(input);
}
// after
switch (input.category) {
  case "string": return new StringInstrument(input);
  case "brass": return new BrassInstrument(input);
  case "woodwind": return new WoodwindInstrument(input);
  case "percussion": return new PercussionInstrument(input);
}
```

Once every value of `InstrumentCategory` has its own `case`, `default: return new
Instrument(input)` is unreachable - TypeScript's exhaustiveness checking over the literal
union proves it, not just my reading of the code. Deleting it is Remove Dead Code arriving
inside a chapter 12 drill, the same way *Replace Temp with Query* showed up uninvited inside
[`06-01`](../../../../06-first-set/01-extract-function/README.en.md). Refactorings come in
flocks; the catalog organises them for reading, not for the order they actually happen in.

## Step 7 — `Instrument` becomes abstract, and `override` disappears

```ts
// before
rentalDepositCents(): number {
  switch (this.category) { /* four cases */ }
}
// after
abstract rentalDepositCents(): number;
```

With the `default` branch gone, nothing ever constructs a bare `Instrument` - every live
object is one of the four subclasses. The switch bodies and the `category` field are now
provably dead, so they go, and the three methods become `abstract`.

This step also *removes* the `override` keyword from all four subclasses, and that
direction surprised me a little. While `Instrument` was concrete, `noImplicitOverride` in
`tsconfig.base.json` required `override` on every subclass method shadowing a real
implementation - the compiler was right to demand it, because there was a real method being
shadowed. The moment `Instrument` declares `rentalDepositCents` as `abstract`, a subclass
implementing it is satisfying a contract, not overriding a body, and this repository's
convention (see `drill-10-04`'s classes, which never write `override` against an abstract
member) is to leave the keyword off. TypeScript will accept `override` on an abstract
implementation too - it is not an error either way - but the two say different things to a
reader, and only one of them is true at each point in this route. Watching the keyword
become required, then optional-but-wrong-flavoured, then gone, step by step, is a very
concrete way to see that `abstract` versus `concrete` is not cosmetic in TypeScript the way
it can feel in the book's JavaScript, which has no such check at all.

## Step 8 — the constructor stops asking for more than it needs

```ts
// before
constructor(input: InstrumentInput) { this.instrumentName = input.name; ... }
// after
constructor(name: string) { this.instrumentName = name; ... }
```

**On the name.** This step exists because of question 4 in
[`NAMING.md`](../../../../../../docs/NAMING.md): is it true? A parameter named `input` of
type `InstrumentInput` promises the whole shape - name *and* category - but by step 8
nothing in `Instrument` reads `category` any more. The parameter was still true in the sense
that it type-checked, but it was no longer honest about what the constructor actually
needed, and a reader skimming the signature would reasonably expect `category` to matter
here. Narrowing to `name: string` makes the signature say exactly what it uses. The
candidate I rejected was leaving it as `InstrumentInput` and adding a comment explaining
that `category` is unused - a comment fixing a name is always the wrong fix when narrowing
the parameter is available and free.

**On another name**, from earlier in this file: `addInstrument`, not `createInstrument` or
`newInstrument`. Question 3 - does it read at the call site - is what decided it.
`addInstrument({ name: "...", category: "brass" })` reads as an action on the library; `new
Instrument(...)` never appears outside this module at all any more, and hiding the four
constructors behind one named function is exactly
[`drill-11-08`](../../../../11-apis/08-replace-constructor-with-factory-function/README.en.md)'s
move, arriving here as a side effect of needing *some* place for the surviving switch to
live rather than as a refactoring in its own right.

**A third name**, on the field this drill deliberately does not touch: `status`, not
`state`. "State" is heavily overloaded in this codebase's own vocabulary - the *Replace
Type Code with Subclasses* mechanics themselves have a well-known State-pattern-based
variant for exactly the case where the code changes at runtime, which is not the shape used
here. Calling the field `status` sidesteps a reader mistaking the field's name for a
pointer toward machinery this class does not use.

## What it cost

Four files where there was one field and three switches. Scanning "what does every
category cost" used to mean reading one function top to bottom; now it means opening four
files and reading one line out of each. For a category that will plausibly grow a fourth or
fifth *behaviour* - not just another constant - that trade is worth it. I am **not fully
sure it was worth it here**, and I want to say so rather than pretend the choice was
obvious: every one of these twelve methods (three per category, four categories) is a
single `return` of a literal. Nothing about how a brass instrument's deposit is *computed*
differs from a percussion instrument's - only the number does. A `Record<InstrumentCategory,
{ depositCents: number; maintenanceWeeks: number; accessory: string }>` plus one lookup
function would have solved the repeated-switches problem with a fifth of the code and no
class hierarchy at all - it is a table, dressed as behaviour. I chose subclasses anyway
because this drill's job is to teach the mechanics named in its own title, and because a
real version of this class would plausibly grow a behaviour a table cannot hold - a
woodwind's maintenance interval depending on humidity readings, say - at which point the
subclasses were already there. That is a bet on the future, not a fact about today's code,
and a reviewer is entitled to disagree with it.

## If you took a different route

- **A lookup table instead of subclasses.** Covered above - genuinely defensible, arguably
  the more honest answer for data this uniform. Worth doing as a second pass once you have
  done the subclass version once, to feel the size difference for yourself.
- **Building all four subclasses before routing any of them.** Would leave a longer stretch
  where the suite is green but proves less, because four unread copies sit unreachable at
  once instead of one. Not wrong, just a larger step disguised as four small commits.
- **Skipping the split between steps 2 and 3 for every category, not just the first.** I
  considered this and rejected it - see steps 4 through 6 above for where I did allow it,
  and why doing it for *every* category would have removed the one place a first-time reader
  gets to watch the safe-then-live pattern work before being asked to trust it unsplit.

What is *not* a matter of taste: leaving `LendingStatus` alone. However this exercise is
solved, an instrument's category becoming four classes and its lending status becoming a
fourth and fifth class alongside them would be a bug waiting to happen the first time
`checkOut()` needed to turn one live object into another. That line does not move.

## Where TypeScript makes this different from the book

Fowler's account of this refactoring is written for a language with no compile-time
exhaustiveness check at all: a `switch` that quietly falls through a case nobody remembered
to add just evaluates to `undefined` and keeps going. Here that failure mode is closed
mechanically, twice. `addInstrument`'s switch does not compile without a case or a default
for every member of `InstrumentCategory`, and step 6 could delete its `default` only
because the compiler - not a reviewer, not a test - had already confirmed the other four
cases cover everything. Try adding a fifth instrument category to the union after finishing
this drill and the build breaks at `addInstrument`, at the exact line that used to be safe,
before a single test runs. Fowler's JavaScript would build the same broken switch without a
complaint, and the missing case would surface later, at runtime, as a `NaN` in someone's
invoice.
