# Walkthrough — no getter at all, borrow/return/query methods instead

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and the decision
this drill is actually structured around.

---

## Before anything: this is not drill-07-01 again

[`drill-07-01`](../../../01-encapsulate-record/README.en.md) turned a raw `Loan` record
into a class with private fields and three getters, and its whole judgement call was
*which* fields earn a getter. If you just finished it, the tempting plan here is the same
recipe: make `#loans` private, add `get loans()`, done. Try it and the tests still pass —
which is exactly the trap:

```ts
// looks encapsulated. is not.
export class MemberAccount {
  readonly memberId: string;
  #loans: Loan[];

  get loans(): Loan[] {
    return this.#loans;
  }
  // ...
}
```

`account.loans` no longer resolves to a public field — good, `#loans` really is private,
and `tsc` really will refuse `account.loans = []`. But `account.loans.push(fakeLoan)`
still compiles, still runs, and still mutates the real array, because the getter handed
back the live reference. The privacy stops one kind of write and does nothing about the
other. **Encapsulating a scalar field and encapsulating a collection field are not the same
move**, and the getter recipe that closed 07-01 does not close this one. That is the whole
reason this is its own drill and not a second example bolted onto the first.

## Where the smell actually is

Four files hold a `MemberAccount` reference and reach into `.loans` directly:
`borrowing.ts` reads its length and pushes; `returns.ts` searches it and splices;
`due-soon.ts` maps and filters it; `account.ts`'s own `currentLoanCount` reads its length.
Nothing stops a fifth file from doing the same, and nothing stops any of the four existing
ones from doing something worse than what they do today — a stray `account.loans = []`
compiles from any of them right now.

## Why the shell, then writes, then reads, then privacy

Step 1 reshapes `MemberAccount` into a class with nothing extracted yet — same emptiness as
07-01's first step, for the same reason: one step that changes structure without moving
behaviour, so every later step that *does* move behaviour is the only plausible cause if a
test breaks.

Writes before reads, this time, rather than "simplest first" — `returnItem` (step 2) is one
`findIndex` and one `splice`, `borrow` (step 3) is two guards and a `push`. Both are
finished, self-contained operations: once moved, nothing about them can be gotten more
"correct" later. The reads are different. `loanCount` (step 4) is trivial by itself, but
`loansDueSoon` (step 5) is where a half-finished encapsulation is most tempting to leave
half finished — see the rejected getter above. Doing the two real writes first means that
by the time you reach the query that actually raises the collection question, `#loans` is
already only reachable through methods for every write path, and the question left is
purely "how does a read get out safely," not tangled up with "and also, is this thing still
writable from outside."

## Steps 2–4 — mechanical, once you have seen 07-01

```ts
// before, in returns.ts
export function returnItem(account: MemberAccount, itemId: string): boolean {
  const index = account.loans.findIndex((loan) => loan.itemId === itemId);
  if (index === -1) return false;
  account.loans.splice(index, 1);
  return true;
}

// after
export function returnItem(account: MemberAccount, itemId: string): boolean {
  return account.returnItem(itemId);
}
```

`borrow` moves the same way, carrying `MAX_LOANS_PER_MEMBER` with it — it was only ever
`borrow`'s constant, and once `borrow` is a method, the constant has nowhere else to live.
`loanCount` moves the same way again, one field read behind one getter.

**On the name.** `borrow`, not `borrowItem`, on the class — `account.borrow(itemId, dueOn)`
already has an implicit subject in `account`, and question 3 from
[`NAMING.md`](../../../../../../docs/NAMING.md) says check the call site: repeating "item"
adds nothing there. The free function in `borrowing.ts` keeps the longer name, for callers
with no `account.` prefix in view — the identical trade 07-01 made for `renew` versus
`renewLoan`.

**On the name, again.** `returnItem` breaks that pattern on purpose:
`account.returnItem(itemId)`, not `account.return(itemId)`. `return` is a reserved word —
legal as a method name in modern JavaScript, but it reads as the keyword before it reads as
the verb, and a name that fights the syntax highlighter has already lost question 3. Unlike
`borrow`, dropping "Item" here would save four characters and cost a clear name; I kept the
longer one on both the method and the free function.

## Step 5 — the query, and the actual reason a field gets no getter

`loansDueSoon` filters and sorts. Moved onto the class as written, it looks like nothing
special:

```ts
loansDueSoon(today: string, withinDays: number): DueSoonEntry[] {
  return this.#loans
    .map((loan) => toDueSoonEntry(loan, today))
    .filter((entry) => entry.daysUntilDue >= 0 && entry.daysUntilDue <= withinDays)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
```

But notice what it returns: `DueSoonEntry`, a type with three fields including a computed
`daysUntilDue`, freshly built per call — not `Loan`, and not a slice of `#loans`. This is
the moment the actual design question in this drill gets answered, and it gets answered by
noticing that **nobody in this file has ever asked for "the loans."** Every real caller
wants something narrower: how many, can I add one, give one back, what's due soon. Once you
build the method each of those questions deserves, there is no remaining caller to build a
`loans`-shaped getter *for*.

**On the name, a third time.** `loansDueSoon`, not `getLoansDueSoon` or `dueSoonLoans`.
`get` fails question 1 the same way it always does in this repository's convention — it
describes fetching, not the question being answered — and the convention table in
[`NAMING.md`](../../../../../../docs/NAMING.md) calls for a noun phrase where a function
answers a question, not a `render`/`format` verb: this returns data, not display lines.
`dueSoonLoans` was the other candidate, and I rejected it on question 3: at the call site,
`account.loansDueSoon(today, 5)` reads left to right as "the account's loans, due soon,"
in the order the words are asked; `dueSoonLoans` reverses that and reads as a category
label first, a subject second.

## Step 6 — private, and the three options this drill weighs

`drill-06-06` asked what a getter for a whole *record* should hand back, and rejected the
live object and a defensive copy in favour of intention-named functions for every real
caller. The same three shapes exist here, one level up — for a *collection* instead of a
record — and each one picks up a wrinkle a scalar record never had to answer for.

**Return `#loans` directly**, or a getter that does — the rejected snippet at the top of
this file. Structural mutation (`push`, `splice`, `length = 0`) is unguarded, exactly the
smell this drill exists to close. Worse than 06-06's equivalent case, because a record's
fields are each one value; a collection is a whole family of mutating methods, and blocking
none of them is a wider door than blocking none of a handful of assignments.

**Return a copy — `[...this.#loans]`.** Stops structural mutation reaching the account:
a caller's `push` lands on their own array, not this one. But it introduces a failure mode
06-06's flat record never had to worry about, because a record's fields were primitives:
**a caller can call a mutating method on the copy, watch it return normally, and believe
something happened.** `account.loansDueSoon` would keep returning the old list forever,
with no error, no warning, nothing — the mutation is not blocked, it is *swallowed*. A
compile error teaches a caller immediately that they had the wrong idea. A silent no-op
teaches them nothing, right up until a report is wrong in production. `Loan`'s own fields
are `readonly` in this exercise precisely so this drill doesn't also have to relitigate
07-01's element-level question — but even with that granted, the array-level copy still
has this hole, and it is the more dangerous one.

**Return a read-only view — `ReadonlyArray<Loan>`, or `Object.freeze`d.** Closer: the type
refuses `.push` at compile time, and a frozen array throws at the attempt, in `"use
strict"` code, at runtime too. This is genuinely 06-06's `readonly`-modifier argument
recurring verbatim: a compile-time-only guarantee is real, and also erasable by any caller
willing to write `(loans as Loan[]).push(x)` — the exact move that walkthrough already
named as the reason a `readonly ClubSettings` wasn't enough on its own. Nothing new to add
there; it applies again, unchanged.

**Never expose the collection.** What step 5 already did without ceremony: `borrow`,
`returnItem`, `loanCount`, `loansDueSoon` are the entire vocabulary this file needs, and
none of them is "give me the array." This is the option the solution commits to, for a
reason sharper than 06-06's version of the same conclusion: there, the whole-record getter
was rejected because a caller *could* misuse it; here, no caller has ever asked for it in
the first place. Rejecting a getter nobody uses costs nothing today. It costs the next
caller who does have a real use for the raw list — see "what it costs," below.

## What it cost, honestly

Nobody in this exercise needs "every loan, as `Loan[]`." But a real library eventually
grows a caller that does — an end-of-month export, a librarian's "show me everything on
this account" screen. That caller gets nothing today; it has to become
`MemberAccount#allLoans()` or similar, written by hand, and whoever writes it faces the
exact copy-versus-view choice this walkthrough just made for `loansDueSoon` — except now
for the whole collection, where a copy's silent-no-op risk is harder to dismiss because a
"show everything" caller is far more likely to think they're looking at something they can
edit. I did not pre-build that method. Building an accessor for a caller that does not
exist yet is the same mistake in the other direction — see 07-01's rejected
"getter-for-completeness" — and I would rather this drill's readers hit that decision live,
with a real caller in front of them, than inherit a choice I made speculatively.

The other place I am not fully certain about: `borrow`'s two checks — the cap and the
duplicate-item rule — now live inside one method, in a fixed order. Encapsulating the
collection gave that pair of checks a name, exactly as encapsulating `decideEntry` in
06-06 gave its check-then-act sequence a name without making it atomic. If a future rule
needs the checks in the other order, or needs to run only one of them, `borrow` has to be
edited directly — nothing about this design makes that safer than editing the old free
function would have been. It is a real, small debt, and it is not this drill's problem to
retire.

## Where TypeScript changes this from the book

The book's *Encapsulate Collection* argues, in JavaScript, for exactly this shape — no raw
getter, `add`/`remove` methods, and (where a caller must see the contents) an unmodifiable
view built from the array rather than the array itself. In TypeScript the interesting
addition is what step 6 demonstrates and 06-06 already established: `ReadonlyArray<T>`,
like `readonly`, is a type-checker fiction erased at compile time. It stops an *accidental*
`.push()` — a real, common bug — and stops nothing from a caller willing to assert past it.
The book cannot draw that line as sharply, because JavaScript has no readonly array type to
tempt you into over-trusting in the first place.

## If you took a different route

- **A read-only view instead of no exposure at all**, if `loansDueSoon`'s filtering
  genuinely needed to live outside the class. It does not, here — the class owns the only
  code that reads `#loans` — but in a design where an unrelated module legitimately needs
  to iterate every loan for its own purpose, `Object.freeze(this.#loans.map((l) => ({
  ...l })))` (freezing a deep-ish copy, not the live array) closes both holes at once, at
  the cost of an allocation per call. Defensible; I did not need it because I had nowhere
  to point it.
- **One combined `borrowOrRenew` method**, collapsing `borrow` for a new item and a
  hypothetical "extend an existing due date" into one entry point. Real option if renewals
  ever join this drill's scope; out of scope here the same way `configureSeason`'s combined
  reset was in 06-06 — a plausible future shape, not a decision this exercise needs to
  make.
- **Storing loans in a `Map<string, Loan>` keyed by `itemId`** instead of an array, which
  would make the duplicate-item check in `borrow` and the lookup in `returnItem` both
  O(1) instead of O(n). Genuinely better at scale, and I did not do it because at the scale
  of one member's account — five loans, by the cap this file itself enforces — the
  difference is not observable, and an array prints and iterates more simply for the one
  reader this code has.

What is *not* a matter of taste: a getter, public field, or return value anywhere that
hands back `#loans` itself or a shallow copy of it and calls that "encapsulated." A copy
that a caller can mutate without effect is not a smaller bug than the live array — it is
the same bug with a quieter failure mode, and quieter is not safer.
