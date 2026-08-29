# Walkthrough — one `loanLimit()` query, not a chain

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: count the chain, and what each link is for

`loan-desk.ts` in `src/` has six functions, and all six contain the same three-dot walk:

```ts
member.membership().tier().loanLimit()
```

Grep for it before touching anything — it is worth seeing all six at once, not one at a
time as you happen across them. Every one of the six only ever wants the number at the end.
None of them formats a tier name, none of them reads `Membership.startedOn`, none of them
holds onto the `Membership` or `Tier` object for a second call. The chain is not *used* for
navigation; it is *paid* for navigation, six times, to reach a value that could be asked for
directly.

That is **Message Chains**: not "too many dots" as a style complaint, but a client that
knows the shape of a structure it has no business knowing — that `Member` has a
`Membership`, that a `Membership` has a `Tier`, and that a `Tier` is where the number
actually lives. If tomorrow a `Membership` computed its loan limit some other way — a
promotional override, say — every one of these six call sites would need to know that too,
because they reach past `Membership` to get the number instead of asking it.

## Why this order: hide the far hop before the near one

The chain has two hops past `Member`: `Member` → `Membership`, and `Membership` → `Tier`.
I hid the far one first — gave `Membership` its own `loanLimit()` — before touching
`Member` at all.

The reason is what the *other* order tempts you into. Hide the near hop first and you have
to decide what `Member.loanLimit()` does before `Membership.loanLimit()` exists, and the
easy answer is `return this.#membership.tier().loanLimit();` — which compiles, passes every
test, and is a Message Chain again, just one level shallower and now hiding *inside* a
method whose name promises it isn't one. `Member.loanLimit()` would look hidden from the
outside while still doing exactly the reaching-through the refactoring exists to remove.
Hiding the far hop first means that by the time `Member.loanLimit()` gets written, the only
honest thing for it to call is `this.#membership.loanLimit()` — one hop, because that is
all that is left to reach.

> The same shortcut is worth checking for in your own attempt: does `Member.loanLimit()`
> call `this.#membership.loanLimit()`, or does it skip straight to
> `this.#membership.tier().loanLimit()`? If it's the second one, `Membership`'s own hide
> never happened — it just moved out of view.

## Step 1 — `Membership.loanLimit()`

```ts
// before
tier(): Tier {
  return this.#tier;
}

// after, tier() untouched, loanLimit() added
loanLimit(): number {
  return this.#tier.loanLimit();
}
```

Tests still exercise the src chain unchanged at this point — nothing calls the new method
yet. That is deliberate: this step is pure addition, and pure addition cannot break
anything the suite already checks. It is safe specifically *because* it changes nothing
observable yet.

**On the name.** `loanLimit()`, matching the name already on `Tier`. I considered
`tierLoanLimit()` — naming exactly where the number comes from — and rejected it on
question 4 from [`NAMING.md`](../../../../../../docs/NAMING.md): is it true, and does it
stay true? A name that announces *which delegate* answers the question is a name that
already knows too much about its own future. The entire point of this refactoring is that
callers of `Membership.loanLimit()` should never need to learn a `Tier` exists; a method
called `tierLoanLimit` teaches them anyway, from the method signature, even after every
caller has been rewritten. `loanLimit()` says what the method answers, not how — question 1
— and reusing the exact name `Tier` already carries costs nothing, because nothing else on
`Membership` could plausibly be called that (question 2).

## Step 2 — `Member.loanLimit()`

```ts
membership(): Membership {
  return this.#membership;
}

loanLimit(): number {
  return this.#membership.loanLimit();
}
```

Same shape, one hop shallower. **On the name, again** — I kept `loanLimit()` here too,
rather than something like `memberLoanLimit()` to distinguish it from `Membership`'s method
of the same name. Question 3 is what settles it: read the call site. `member.loanLimit()`
already tells you whose limit it is — the receiver is a `Member` — so a prefix repeating
that fact would be answering a question the call site had already answered. Three classes,
one name, and each call site is unambiguous about which one you're looking at because the
receiver says so.

## Step 3 — collapsing the six call sites

```ts
// before, all six functions
member.membership().tier().loanLimit()
// after
member.loanLimit()
```

Unlike the duplicate-block caution in the module-6 reference drill — where two copies of
the same logic might have quietly drifted apart before you noticed — these six call sites
were never independent logic to compare. Each one always meant "this member's loan limit,"
and the chain was always the same three calls in the same order. There is nothing to check
for disagreement here, so I did all six in one commit rather than splitting them the way
that reference drill splits a genuine duplicate. Splitting six identical substitutions six
ways would not give a reviewer six different judgement calls to weigh — it would give them
six copies of the same one.

I ran the suite after all six were done, not after each — the risk this step carries is a
typo in one of six near-identical lines, and the full suite catches that just as well in
one pass as in six.

## Step 4 — deleting the accessors that got you here

```ts
// Membership — tier() deleted
// Member — membership() deleted
```

Before deleting, I grepped the exercise for `.membership()` and `.tier()` the way the
inline-class drill next door grepped for a class's methods before removing it: not because
I distrusted step 3, but because "I just replaced every call site" and "no call site
remains" are different claims, and only one of them is checked by rereading your own diff.
Grep confirmed it; the compiler then confirmed it a second, stronger way — deleting the
methods and running `tsc` turns any site I missed into a compile error instead of a runtime
surprise, which is the check that actually matters once the methods are gone rather than
merely unused.

## What it cost

Two forwarding methods, on two classes, each returning exactly what the field one level
down already held. That is real: `Membership.loanLimit()` and `Member.loanLimit()` add no
logic, only indirection, and a reader who wants to know *where the number actually comes
from* now reads two one-line methods instead of one line of chained calls to find out.

The less obvious cost is the one in the trade-off line: `Membership.tier()` had exactly the
public callers this drill removes, and once it's gone, nothing constructs a reason to keep
it around "just in case." If a future feature needs the tier itself — a badge on the
member's card showing `Senior`, say, rather than the number the tier carries — someone has
to add `Membership.tier()` back, and they have to notice that they need to. I am not fully
sure that is the right trade for *this* codebase; I made the call because nothing in the
current six functions, or anywhere else in the exercise, has ever asked for the tier as
anything other than a means to a loan limit, and hiding a delegate nobody uses for anything
else is the textbook case. But "nobody uses it *yet*" is a bet, not a proof, and it is the
kind of bet [`drill-07-08`](../../../08-remove-middle-man/README.en.md) asks you to weigh
from the opposite direction — see below.

## If you took a different route

- **Hiding both hops in one step**, writing `Member.loanLimit()` straight to
  `this.#membership.tier().loanLimit()` without ever giving `Membership` its own method.
  Compiles, passes every test in this exercise, and is the shortcut called out above: it
  looks hidden from `loan-desk.ts` but leaves `Membership` navigated-through instead of
  asked, which is the same problem one level in. Not equally defensible — see below.
- **Naming the forwarding methods differently at each level** (`membershipLoanLimit` on
  `Member`, say) to make the layers visually distinct. Reasonable instinct, and I think it
  loses on question 3: the receiver already tells you the layer, so the extra word repeats
  information the call site already carries.
- **Doing all four steps in two commits** (both additions together, then both call-site
  and deletion changes together). Would still be safe, since additions and the final
  deletion don't overlap in what they touch. I kept them as four because each one answers a
  different question a reviewer might ask, and a four-line `git log` is cheap.

What is *not* a matter of taste: `Member.loanLimit()` reaching two levels down instead of
one. A hide that skips a hop is not a smaller hide — it's the same Message Chain, moved one
method inward and given a name that claims it isn't there any more.

## Where TypeScript makes this different from the book

Fowler's Hide Delegate examples are JavaScript, where "private" is convention — an
underscore, a comment, a closure if the author was disciplined. Here, `#membership` and
`#tier` are true private fields: once `Membership.tier()` and `Member.membership()` are
deleted, there is no syntax left in this package that can reach `#tier` from outside `Tier`
or `#membership` from outside `Member`, and the compiler enforces that on every build, not
just on the day of the refactoring. The book's version of "hidden" means *nobody currently
does this*; the TypeScript version, once you delete the accessor, means *nobody can*. That
is a stronger guarantee than the refactoring's name promises in the source material, and it
is worth noticing precisely because step 4 is the step that earns it — right up until that
deletion, the encapsulation here is exactly as soft as the book's.

## The question this drill and its inverse both have to answer

[`drill-07-08`](../../../08-remove-middle-man/README.en.md) deletes forwarding methods from
`Branch`, because `Branch` forwards six methods to its `Manager` and does nothing else with
any of them. This drill *adds* forwarding methods to `Member` and `Membership`, for what
looks like the same reason in reverse. They are not actually opposite answers to the same
question — they are the same question, asked at two different counts, and the honest way to
tell which side of the trade you are on is to count, not to reach for a rule of thumb.

Here: two forwarding methods added, six chained call sites removed. The delegate
(`Membership`, then `Tier`) was never part of what any client actually wanted to talk
about — every one of the six functions wanted a number, not an object — and nothing outside
`loan-desk.ts` had any other reason to know `Membership` or `Tier` existed. Hiding wins on
every count that matters: fewer things to know at each call site, no loss of any capability
a caller was using.

`drill-07-08`'s `Branch` is the mirror image on the *count* that matters there: six
forwarding methods already exist, each with exactly one caller, and the object behind them
(`Manager`) is not some incidental implementation detail — it is a real object every one of
those callers would be perfectly happy to hold a reference to directly, because the caller
already knows a branch has a manager; that's not hidden information, it's the org chart.
Ask the same question of both drills and the counts point opposite ways on purpose. That is
the actual lesson, and it's worth resisting the urge to remember it as "hide delegate when
extending, remove middle man when deleting" — the shape that matters is always: how many
methods forward, how many call sites would change, whether the delegate is part of the
interface you want to publish, and whether the client already knows the delegate exists for
some other, independent reason. Count first. The refactoring's name comes after.
