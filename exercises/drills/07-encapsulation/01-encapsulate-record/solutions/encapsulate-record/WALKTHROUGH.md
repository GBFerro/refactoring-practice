# Walkthrough — a class with three getters, not a public interface

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and the one
design question this drill actually asks you to answer.

---

## Before anything: what "everywhere" means here

`Loan` is a seven-field interface, and four files hold references to instances of it:
`renewals.ts` reads `returnedOn` and `renewalCount` and then writes `dueOn` and
`renewalCount`; `returns.ts` writes `returnedOn`; `status.ts` and `overdue.ts` read
`dueOn` and `returnedOn`. Nothing distinguishes an intended write from an accidental one —
`loan.dueOn = "2026-01-01"` compiles from any of the four files, today or in whatever file
gets added next month. That is **Mutable Data**: not that the record changes, records are
allowed to change, but that *anywhere holding a reference can change it, in any way, with no
name attached to the change*.

This is a different shape of the smell from drill-06-06's. There, one module-level
`settings` object was shared by import; the fix was to stop exporting the *variable*. Here
there is no shared variable to stop exporting — every file gets its own `Loan` reference
legitimately, as a function argument, and holds onto it for as long as it needs to. What has
to be encapsulated is not a binding, it is the **type**: every instance of `Loan`, wherever
it travels, needs to refuse the same set of writes. A class does that; an interface cannot.

## Why the class comes first, empty of guarantees

Step 1 turns the interface into a class and changes nothing else — every field is still
public, still mutable, still assignable from any of the four files. Tests are green for an
uninteresting reason: nothing has been removed yet.

That emptiness is deliberate. The alternative — going straight to private fields — means
one commit does three things at once: reshapes the type, moves two behaviours onto it, and
closes the door behind them. If a test breaks, there are three candidate causes. Doing the
reshape alone first means steps 2 and 3, which move real behaviour, are the only steps
where a broken test tells you something specific.

## Steps 2 and 3 — the two writes become methods

```ts
// before, in returns.ts
export function returnLoan(loan: Loan, returnedOn: string): void {
  loan.returnedOn = returnedOn;
}

// after
export function returnLoan(loan: Loan, returnedOn: string): void {
  loan.markReturned(returnedOn);
}
```

One line moves onto the class almost unchanged. `renewLoan` is the more interesting move,
because its guard clauses read fields before writing them:

```ts
// after, on Loan
renew(today: string): RenewalOutcome {
  if (this.returnedOn !== null) {
    return { renewed: false, reason: `loan ${this.id} was already returned` };
  }
  if (this.renewalCount >= MAX_RENEWALS) {
    return { renewed: false, reason: `loan ${this.id} has no renewals left` };
  }
  this.dueOn = addDays(today, LOAN_PERIOD_DAYS);
  this.renewalCount = this.renewalCount + 1;
  return { renewed: true };
}
```

`MAX_RENEWALS` moves with it, from `renewals.ts` back into `loan.ts`. It was only ever
`renewLoan`'s business, and now `renewLoan` is two lines calling `loan.renew(today)` — the
constant has nowhere else to live.

**On the name.** `renew`, not `renewLoan`, on the class — the method already lives on a
`Loan`, so repeating the noun would fail question 3 from
[`NAMING.md`](../../../../../../docs/NAMING.md): at the call site, `loan.renewLoan(today)`
carries a word the receiver already told you. `loan.renew(today)` reads as the sentence it
is. The free function in `renewals.ts` keeps the longer name, because at *its* call sites —
outside this file, where there is no `loan.` prefix in view — `renewLoan` is the one that
says what and `renew` on its own is not (question 1: `renew` what?).

**On the name, again.** I rejected `markAsReturned` for the other method, in favour of
`markReturned`. Both are true (question 4); `markAsReturned` is not obviously false, but
"as" is decoration the call site does not need — `loan.markReturned(returnedOn)` already
reads as a completed action without it. A few characters, chosen for the sentence at the
call site (question 3) rather than for symmetry with the noun `returnedOn`.

## Step 4 — the fields disappear, and the decision this drill is about

Once both writes are methods, one question is still open: what happens to `dueOn`,
`returnedOn`, and `renewalCount` themselves? Three real answers, and this is close kin to
the question drill-06-06 asked about the whole `settings` record — worth reading that
walkthrough's step 8 if you have not, because two of the three options below are the same
options it rejected, for the same reasons, just one level down: not "what does a getter for
the *whole record* return," but "does *this field* get a getter at all."

**Leave them public.** Free, and it is exactly what step 1 already did. Rejected for the
reason this whole drill exists: any file with a `Loan` reference could still write
`loan.renewalCount = 0` and nothing would object. Encapsulating the two writes into methods
does not matter if the fields are still open for business next to them.

**Give every field a getter *and* a setter**, mirroring the shape 06-06 rejected outright
for the whole settings object. A `setDueOn` and `setRenewalCount` would compile, and they
would be exactly as bad as the raw fields — a setter is a public field wearing a longer
name. Not seriously considered.

**Give only the fields an existing caller reads their own getter, and nothing else.** This
is what the solution does. `status.ts` and `overdue.ts` need to read `dueOn` and
`returnedOn`; the tests need to read `renewalCount` to check a refusal left it untouched.
Three getters, no setters — the only way to change any of the three fields is `renew` or
`markReturned`, which is exactly the set of writes this domain actually performs.

**On the name, a third time.** The three getters keep the field names exactly —
`get dueOn()`, not `get currentDueOn()`. 06-06 prefixed two of its getters with `current`
(`currentDuesCents`, `currentLateFeeRatePercent`) specifically to disambiguate the value
*now* from the value the season *started* with — two versions of the same fact, needing two
names. `dueOn` has no such second version anywhere in this file; there is nothing for
`currentDueOn` to distinguish itself from, so the prefix would answer question 4 by
asserting a distinction that does not exist. Same convention, applied to a case where it
does not fire — not a rule broken, a rule correctly not invoked.

The cost, stated plainly: **the class is smaller than the record it replaced.** There is no
getter for `checkedOutOn`'s relationship to `dueOn`, no generic way to ask "give me
everything about this loan." A future caller that legitimately needs a sixth thing —
say, a notice-printing module that wants to know how many renewals are left, not just how
many have happened — adds `renewalsRemaining()` by hand. That is more work than the field
already being there. I chose it anyway, for the same reason 06-06 did: a getter that exists
because a caller reads it is checkable; a getter that exists because a record might
someday need it is a guess, and `Loan` should not carry a guess about `07-02`'s problem
before that drill exists.

## What it cost, honestly

The one I am least sure about is `renew`'s two guard clauses staying inside one method.
`renew` now reads two fields and writes two fields in one call — encapsulating the record
gave that sequence a name, but it did not make it any more atomic than it was as a free
function. A caller cannot observe `renewalCount` incremented without `dueOn` also having
moved, because nothing calls only half of `renew` — but that is true by accident of there
being one call site inside the class, not by anything the type system enforces. If `renew`
grows a second internal caller someday, this stops being free. I left it, because splitting
"check" from "act" here would be *Separate Query from Modifier*, a different refactoring
solving a problem this drill's tests do not exercise.

The other place I went back and forth: whether `id` deserves to be computed inside the
class at all, given it is `` `${itemId}#${checkedOutOn}` `` — a detail nobody outside
`loan.ts` should have opinions about, and a real library would probably assign loan ids from
a sequence, not a composite key. I kept the composite because it makes every test's loan
independently identifiable without a fixture counter, and because changing it is a decision
about the domain, not about encapsulation — folding it into this drill would be answering a
question nobody asked.

## Where TypeScript changes this from the book

Fowler's *Encapsulate Record* walks through wrapping a record with getters and setters in
JavaScript, where "please call the method instead of touching the field" is enforced by
nothing but the reader's good faith — a setter method and a raw field assignment look
identical from three files away. The `#dueOn` private field in step 4 is not that: it is a
parse error to write `loan.dueOn = x` from outside the class, in every file, including ones
that do not exist yet. That is the whole reason this drill is worth doing in TypeScript
specifically — the book's version of "done" is a convention; this repository's version of
"done" is `tsc` refusing to compile the mistake.

## If you took a different route

- **Getters for all seven fields, "for completeness."** Compiles, passes every test here,
  and is the first thing I wrote before deciding against it. It costs nothing today and
  everything the first time someone reads `loan.checkedOutOn` from three call sites and
  assumes it must matter somewhere, because why else would it have a getter?
- **A `toSummary()` method returning `{ dueOn, returnedOn, renewalCount }` instead of three
  separate getters.** Defensible if `status.ts` and `overdue.ts` always needed all three
  together; they do not — `overdueFineCents` never reads `renewalCount`, and a shared
  summary type would hand it one anyway. Splitting them keeps each caller's dependency
  visible in its own signature.
- **Passing `today` into the class as a constructor argument instead of a method
  parameter**, so `renew` and the future overdue check would not need it repeated. Real
  option, and it trades one clarity for another: a `Loan` that remembers "today" is a
  `Loan` whose behaviour depends on when it happened to be constructed, which is a stranger
  invariant than passing the date to every call that needs one.

What is *not* a matter of taste: leaving any of `dueOn`, `returnedOn`, or `renewalCount`
publicly writable, or adding a getter that returns more than one field at once "just in
case." Either one reopens exactly the door this drill exists to close — see 06-06's
walkthrough, which reaches the identical verdict about the whole record one level up from
here.
