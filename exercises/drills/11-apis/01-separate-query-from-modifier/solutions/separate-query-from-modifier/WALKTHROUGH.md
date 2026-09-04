# Walkthrough — a pure lookup plus an explicit hold

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, what it cost,
and where a query-and-modify pair should be left alone. Read it after you have your own
version, not before.

---

## What `findSeatAndReserve` actually promises

```ts
export function findSeatAndReserve(show: Show, section: string, customerId: string): Seat | null {
  const seat = openSeatsInOrder(show, section)[0];
  if (seat === undefined) return null;
  seat.status = "held";
  seat.heldBy = customerId;
  return seat;
}
```

Read only the name and the return type, and this looks like a lookup: it finds a seat, or
it doesn't. Read the body, and it also writes `held` and a customer id onto whatever it
found. The name is not lying by omission the way `checkCourse` did in drill-06-05 — "And
Reserve" is right there — but the promise a *caller* takes away from a name like this is
almost always the first half. Nobody reads `findSeatAndReserve(show, "Stalls", "quote")`
at a call site and thinks "this holds a seat." They think "this looks a seat up," because
`find*` is a query shape everywhere else in this codebase and in TypeScript's own standard
library, and the second verb reads as a footnote.

Two of this module's three callers proved it by construction: `nextSeatQuote` and
`sectionHasAvailability` both wanted only the answer, and both got the seat held anyway,
because the only function that could give them the answer also gave them the side effect.
Each invented a placeholder customer id — `"quote"`, `"availability-check"` — to feed a
parameter that had nothing to do with what they were asking. **That placeholder is the
smell's second symptom**, not a separate problem: a caller that has to make up a customer
to ask a question is a caller whose question was never really about a customer at all.

## Why this order

Split the *search* out first, before touching the mutation. `nextAvailableSeat` in step 1
is byte-for-byte the same search `findSeatAndReserve` already did — the only change is that
it now has its own name and `findSeatAndReserve` calls it instead of repeating it inline.
Nothing about what any caller receives can move at this step, because `findSeatAndReserve`
still does exactly what it did before, one level of indirection deeper. That is the whole
point: it converts "extract a name" and "change what runs when" into two separate risks
instead of one, and step 1 takes on none of the second kind.

Step 2 does the same for the mutation: pull `seat.status = "held"; seat.heldBy = customerId`
into `holdSeat`, and have `findSeatAndReserve` call it. Still nothing observable has moved
— `findSeatAndReserve` calls the query, then calls the modifier, in the same order, on the
same seat, for the same customer, every time. Two named pieces exist, and exactly one
caller (`findSeatAndReserve` itself) still glues them together.

Only step 4 changes what happens when a caller runs. That is why it is one caller, one
commit, same as steps 3 and 5: if the suite goes red, you know precisely which caller's
behaviour moved and can point at the diff that did it.

## Steps 1–2 — extracting without moving a caller

```ts
// after step 1
export function findSeatAndReserve(show: Show, section: string, customerId: string): Seat | null {
  const seat = nextAvailableSeat(show, section);
  if (seat === null) return null;
  seat.status = "held";
  seat.heldBy = customerId;
  return seat;
}

export function nextAvailableSeat(show: Show, section: string): Seat | null {
  return openSeatsInOrder(show, section)[0] ?? null;
}
```

**On the name.** `nextAvailableSeat` over `getNextSeat` or `findSeat`. Question 2 from
[`NAMING.md`](../../../../../../docs/NAMING.md) — could it be the name of something else
in this file? — kills `findSeat`: this module is
about to have a query *and* a modifier, and `find` alone does not say which. `getNextSeat`
fails question 1: "get" describes fetching, not what is fetched, and the whole reason this
function exists is to say precisely what it hands back — the next seat that is still
available, not merely "a" seat. `nextAvailableSeat` is a noun phrase, matching this
repository's convention for something that answers a question (`sortedFinishers`,
`averagePace` in drill-06-01), and it reads at every call site without the reader needing
to open the definition.

After step 2, `holdSeat` exists the same way, and `findSeatAndReserve` calls both in
sequence. Run the suite here: still green, and it has to be, because from outside the
module `findSeatAndReserve` behaves identically to the un-split version. This is the
migration mechanic from drill-06-05 applied to a bigger split — add the new shape next to
the old one, prove it compiles and behaves, and only then move traffic onto it.

## Steps 3–5 — one caller at a time

```ts
// holdNextAvailableSeat, before
return findSeatAndReserve(show, section, customerId);
// after
const seat = nextAvailableSeat(show, section);
if (seat === null) return null;
holdSeat(seat, customerId);
return seat;
```

`holdNextAvailableSeat` is the caller that genuinely wants both, so its new body still
calls both — the difference is that the sequencing is now visible at the call site instead
of hidden inside a function whose name only advertised half of it. This step is safe by
construction: `findSeatAndReserve` itself was already implemented as "call the query, then
call the modifier," so replacing the wrapper with its own two lines changes nothing about
what runs.

```ts
// nextSeatQuote, before
const seat = findSeatAndReserve(show, section, "quote");
// after
const seat = nextAvailableSeat(show, section);
```

This is the step that can change behaviour, and it is the point of the whole exercise:
`nextSeatQuote` stops holding a seat. The placeholder `"quote"` id disappears with it —
there is no longer a parameter to fill. `sectionHasAvailability` gets the identical
treatment in step 5, and `"availability-check"` goes with it.

**On the name.** `sectionHasAvailability` over `isSectionAvailable` or `sectionIsFull`
(negated at every call site). Question 3 — does it read at the call site? —
`if (sectionHasAvailability(show, "Stalls"))` reads as a sentence; `if
(!sectionIsFull(show, "Stalls"))` makes the reader negate a negation to find out what is
actually true. `has*` over `is*` here because the thing being asked about — *availability*
— is closer to a possession the section has than a state the section is in; both forms
appear in this repository's naming table and either would have passed review, so this one
is a preference, not a rule.

**On the name.** `holdSeat`, not `reserveSeat` or `bookSeat`. This module's own vocabulary
already distinguishes the three states a seat moves through — `open`, `held`, `booked` —
and a `Show`'s box office treats a hold and a booking as different things: a hold is
provisional and can lapse, a booking is final. Question 4 — is it true? — rules out
`bookSeat`: it would claim a stronger commitment than `status = "held"` actually makes.
`reserveSeat` was the first draft and I reverted it for the same reason `findSeatAndReserve`
was worth fixing in the first place: "reserve" is generic enough to mean either state, and
a name that could mean either of two things in the same file is exactly what question 2
warns against once `holdSeat` and a hypothetical future `bookSeat` would sit side by side.

## Step 6 — deleting what nothing calls

Once step 5 lands, `findSeatAndReserve` has no callers left in `src/`. TypeScript will not
tell you this on its own — an exported function with zero local call sites still compiles,
because something outside the module could import it — so, same as drill-06-05's step 5,
this is established by reading `callers.ts`, not by the compiler. Delete it, run the suite,
still green.

## What it cost

Six commits and two new named pieces for what started as one function. `holdNextAvailableSeat`
is the honest casualty: it used to get the query-then-hold pairing for free by calling one
function, and now it has to write the sequence out itself. For a module with one such
caller that is a small tax. For a module with a dozen callers that all legitimately want
"find and hold, right now, together," writing that sequence a dozen times would be worse
than the original smell — at that point the answer is a named helper that does exactly what
`findSeatAndReserve` did, kept deliberately separate from the query and the modifier it is
built from, so the callers that want the pairing get a name for it and the callers that
don't are never handed it by default. This drill doesn't need that helper because it has
exactly one caller in that position; a bigger version of this exact box office might.

I am not fully sure `sectionHasAvailability` earns its place as a third caller rather than
being something a consumer computes with `nextAvailableSeat(show, section) !== null`
directly. It is a one-line wrapper around a query, and drill-06-01's walkthrough calls that
shape out by name — *Lazy Element* — when it happens on the *query* side of a split. I kept
it because "is there anything left" reads better at a kiosk-display call site than a null
check does, and because it is the walkthrough's clearest illustration of "called inside a
condition" from the smell's description — but a reviewer who deleted it and inlined the
null check would not be wrong.

## The case this drill is *not* an example of

The book is explicit that Separate Query from Modifier has a genuine exception, and it is
worth stating plainly rather than leaving it implied: a query-and-modify pair that has to
be *atomic* should not be split, because splitting it can introduce a race that the
combined version never had. A stack's `pop` — look at the top, and remove it, as one
operation — is the standard example; split it into `top()` then `removePop()` and two
concurrent callers can both read the same top element before either removes it. A
compare-and-swap is the same shape on purpose: "check this value is still what I expect,
and if so, replace it" is only useful *because* the check and the replace happen as one
step nothing else can land inside of.

`holdNextAvailableSeat` is that same shape — read the next open seat, then write to it —
and the honest question is why splitting it here is safe when splitting a stack's `pop`
would not be. The answer is not "because seats are different from stacks." It is that
`Show` and its `seats` are plain, synchronous, in-memory data, mutated by ordinary
statements with nothing able to run between them. `nextAvailableSeat(show, section)`
returns, and the very next line runs `holdSeat` on the exact object reference it returned,
with no `await`, no callback, no other request able to interleave. Two calls that cannot be
interrupted between them are not actually two independent operations from a concurrency
standpoint — they only look that way in the source.

That stops being true the moment `Show` stops being an in-memory object and starts being a
row in a real, concurrently-accessed store. If `nextAvailableSeat` became a database read
and `holdSeat` became a separate write, two customers' requests really could interleave
between them — both read the same open seat, both then write `held` over it, and one
customer's hold silently overwrites the other's. At that point the fix is not to inline the
two calls back together in application code; it is to make the *combined* operation atomic
again at the layer that can actually guarantee it — a single conditional write, something
like "hold this exact seat only if its status is still `open`," reported back to the caller
as success or failure. `holdNextAvailableSeat` would still read as two names, but the
`holdSeat` step would need to become a query too — "did the hold actually take" — because a
`void` return can no longer tell the difference between "held" and "someone else got there
first."

This drill's suite cannot demonstrate that failure mode, because there is nothing in this
module able to interleave two calls — which is exactly the fact that makes the split safe
here and would make it unsafe on a shared, concurrently-written store without the extra
step above.

## If you took a different route

- **Extracting `holdSeat` before `nextAvailableSeat`.** Symmetric to the order shown; I
  went search-first because the two "cost" callers only ever needed the search, and getting
  that piece to exist first meant steps 4 and 5 were ready one commit sooner. Reasonable to
  reverse.
- **Keeping one placeholder-free `findSeatAndReserve` around as a convenience wrapper**,
  rather than deleting it in step 6 and writing `holdNextAvailableSeat`'s two lines by
  hand. Defensible for exactly the reason described above under "what it cost" — the
  tradeoff is real, and a codebase with more callers like it should probably make that call
  differently than this one does.
- **Naming the modifier `applyHold` instead of `holdSeat`.** Both pass all four questions;
  `holdSeat` reads slightly better at the call site (`holdSeat(seat, customerId)` vs.
  `applyHold(seat, customerId)`) and that is the only reason it won.

What is *not* a matter of taste: leaving `nextSeatQuote` or `sectionHasAvailability` calling
a function that holds a seat as a side effect, or inventing a placeholder customer id to
satisfy a parameter a caller has no real value for. Those are the two things this exercise
exists to remove, and the drill is not done while either survives.

## Where TypeScript changes this from the book

Fowler's own example for this refactoring, in JavaScript, is `alertForMiscreant`, which
sets a flag and returns a value in one pass over a list — there is no type system tracking
what either half promises. Here, splitting the two into `nextAvailableSeat: (show: Show,
section: string) => Seat | null` and `holdSeat: (seat: Seat, customerId: string) => void`
gives the split a signature-level tell that JavaScript can't: the query's return type says
"you get a seat or nothing," and the modifier's `void` return says "there is nothing here
to read, only something to do." A reader deciding whether a function is safe to call twice
in this codebase can often answer that from the signature alone, without opening the body —
`void` is close to a promise that nothing is being handed back to inspect, the same way
`Seat | null` is close to a promise that nothing is being changed. Neither promise is
airtight — `void` doesn't stop a function from mutating something, and TypeScript won't
catch it if it does — but it is a stronger hint than the untyped version ever had, and it
is one more reason `holdSeat`'s `void` return earns its keep here rather than returning the
seat it just mutated for convenience.
