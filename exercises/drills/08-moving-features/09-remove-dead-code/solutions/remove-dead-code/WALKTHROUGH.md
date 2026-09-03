# Walkthrough — three branches deleted, one left alone

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary — the method behind each deletion, why the fourth branch survives, and what I am
still not entirely comfortable with. Read it after your own version, not before.

---

## This drill is different in kind, not just in mechanics

Every earlier drill in this module moves code without changing what it does, checked the
same way each time: run the suite, watch it stay green. That check works because those
drills touch code something still calls.

Remove Dead Code breaks it. By definition, nothing calls the code you're deleting — so the
suite staying green after you delete `HARVEST-FAIR-2019`, and staying green after you
*don't* delete `FOUNDER-RATE`, look identical to the test runner. Passing tests confirm you
didn't break anything reachable; they cannot confirm you correctly identified what was
unreachable. That confirmation has to come from elsewhere, and building it is the entire
exercise — the delete itself, once you have it, is one line.

## The method

Four questions, asked of every branch before you touch it. None of them alone is proof;
together they're as close to proof as reading a codebase gets.

**1. Find every caller.** Not just literal call sites — grep for the string, but then ask
what else in this module could *produce* that string without ever writing it as a literal.
A value assembled from a condition, a lookup, or a default is still a caller. It just
doesn't show up in a search for its own text.

**2. Ask what the type system already rules out.** If a parameter's type were a closed union
and a branch compared it against a literal outside that union, the compiler would already
have done your proof — TypeScript refuses to compile a comparison with no overlap. That
shortcut isn't available here: `Order["promoCode"]` is typed as `string | undefined`, not a
union of known codes, because marketing creates and retires these outside this repository —
nobody owns a closed list to type it against. This check comes back with nothing, which is
itself information: the proof has to be earned entirely from questions 1, 3, and 4.

**3. Check the tests.** Not "is there a test for this" — a branch can be untested and still
live. Do the inverse: temporarily make it return something absurd and run the suite. Green
means no *test* reaches it. Combined with (1) coming up empty, that's real evidence; alone,
it only rules out the callers this test file happens to exercise.

**4. Check whether the data can take that shape at all.** Forget call sites and ask: does
anything in this codebase *construct* a value equal to the one the branch wants? Not "could
you construct one" — `string | undefined` will happily let you type
`promoCode: "WELCOME-CAFE"` into an object literal by hand. The question is whether any
function that runs for real reasons ever does.

Three of the four branches fail question 1 outright — nothing in this module, tests
included, ever produces their strings. The fourth fails question 1 too, if you only search
for its string as an *argument*. It passes question 4, and that's the whole exercise.

## Why this order

Delete in order of how many independent things you have to check. `HARVEST-FAIR-2019` is one
`if`, one constant, one string, checked once. `WELCOME-CAFE` is the same shape.
`SAMPLE-CRATE-FREE` is two things — a branch and the helper it alone calls — so proving it
dead means proving both uncalled, and deleting it means taking the helper along. Doing the
simple ones first means you've rehearsed the method twice before meeting the branch with
more moving parts.

`FOUNDER-RATE` goes last regardless, because it's the one branch the method above does not
clear — and you want to reach it with the method fresh, not stretched thin three branches in.

## Step 1 — `HARVEST-FAIR-2019`

```ts
// before
if (promoCode === "HARVEST-FAIR-2019") {
  return HARVEST_FAIR_2019_DISCOUNT_CENTS;
}
```

Question 1: grep this exercise for `"HARVEST-FAIR-2019"`. It appears twice — the branch and
the constant definition — never as an argument anywhere, including in `tests/`. Question 4:
nothing in `pricing.ts` or `order.ts` computes a promo code from a date, a fair, or anything
resembling this string. Two independent checks, both empty. Delete the branch and the
constant it used.

**On the name.** `HARVEST_FAIR_2019_DISCOUNT_CENTS` is about as specific as a name gets —
question 2 from [`NAMING.md`](../../../../../../docs/NAMING.md) (could this be the name of
something else?) fails on purpose, and here that's a feature. A name this narrow could
never plausibly apply to a second promotion; whoever wrote it wasn't naming a category, they
were naming an event. That specificity is itself weak evidence toward deadness: code
describing one dated occurrence rarely outlives it, and the name told you that before the
call-site search did. Contrast `FOUNDER-RATE` below, whose name describes a *kind* of
account rather than an event — durable by construction.

## Step 2 — `WELCOME-CAFE`

```ts
// before
if (promoCode === "WELCOME-CAFE") {
  return Math.round(subtotal * WELCOME_CAFE_DISCOUNT);
}
```

Same two checks, same result: no caller, nothing that could produce the string. The only
difference from step 1 — a percentage instead of a flat number of cents — changes nothing
about the proof. The method cares only whether anything can reach a branch, never what it
computes.

## Step 3 — `SAMPLE-CRATE-FREE`, and the helper that goes with it

```ts
// before
function sampleCrateWaiver(subtotal: number, promoCode: string | undefined): number {
  return promoCode === "SAMPLE-CRATE-FREE" ? subtotal : 0;
}

function promoDiscountCents(subtotal: number, promoCode: string | undefined): number {
  // ...
  const waiver = sampleCrateWaiver(subtotal, promoCode);
  if (waiver > 0) {
    return waiver;
  }
  // ...
}
```

This one has two layers, and the mistake is proving only the outer one.
`promoDiscountCents` calling `sampleCrateWaiver` looks like a live call site — and it is,
`sampleCrateWaiver` genuinely runs on every order. But running isn't the same as mattering:
it only ever returns non-zero when `promoCode === "SAMPLE-CRATE-FREE"`, and that string
fails questions 1 and 4 exactly like the previous two. Being *called* doesn't make a result
live if the condition inside can never come true. Delete the branch without deleting
`sampleCrateWaiver` and you're left with dead code that merely looks busier than an `if`.

**On the name.** `sampleCrateWaiver` is a good name — question 4 (is it true?) passes
cleanly, it waives the price of a sample crate, no more, no less. Worth flagging: it's
tempting to assume dead code announces itself with a bad name or a stray `TODO`. It doesn't
have to. A name earning full marks on `NAMING.md` is orthogonal to whether the function it
names ever runs — judge reachability from callers and data, never from how well-kept code
looks.

## Step 4 — the branch that stays

```ts
function effectivePromoCode(order: Order): string | undefined {
  if (order.promoCode !== undefined) return order.promoCode;
  return order.customer.yearsActive >= FOUNDING_ACCOUNT_YEARS
    ? "FOUNDER-RATE"
    : undefined;
}
```

Run question 1 on `"FOUNDER-RATE"` the same way as the other three and the first pass looks
identical: nothing passes that literal as an argument to `promoDiscountCents`. Stop there —
the same checking that correctly cleared the first three branches — and you'd delete this
one too, and `tests/pricing.spec.ts`'s **"grants the founder rate automatically once a
customer reaches five years, with no promo code entered"** test would fail.

The difference only shows up on question 1's second half — *what else could produce this
string* — and question 4. `effectivePromoCode` is that something: for any order without an
explicit `promoCode`, it synthesizes `"FOUNDER-RATE"` straight from
`order.customer.yearsActive`, no code ever typed in by anyone. The five founding cafes
haven't had a `promoCode` field to fill in for years — the checkout form dropped it once the
rate became automatic — but the string it used to represent still flows through the same
comparison in `promoDiscountCents`, now arriving from a computed default instead of a
person. Read `promoDiscountCents` alone and `"FOUNDER-RATE"` looks exactly like
`"WELCOME-CAFE"` and `"HARVEST-FAIR-2019"` — the comment that explains the difference lives
forty lines away, on a completely different function.

That's the trap, named plainly: **a branch that arrives through a default rather than an
argument does not look different at its use site from one that arrives through a dead call
site.** The only way to tell them apart is to trace where the compared value actually comes
from, all the way back — not just up to the nearest function boundary.

**On the name.** I considered `promoCodeOrDefault` and rejected it — question 4 again.
"Default" implies an arbitrary fallback, the kind of value you'd feel fine deleting along
with whatever it defaults from — the wrong impression for a function computing something a
customer is genuinely entitled to. `effectivePromoCode`, the code actually in force however
it got there, doesn't invite that misreading.

Worth noting what question 2 would have bought us with a narrower type. Had
`Order["promoCode"]` been a closed union — say `"FOUNDER-RATE" | undefined`, once nothing
else survived — a branch comparing it to `"WELCOME-CAFE"` wouldn't even compile, and three
of this exercise's four branches would have become compile errors the moment the union
narrowed. It stays `string` on purpose, because marketing owns these codes, not this module
— a closed union gets a free proof; an open `string`, like every branch here, is proven by
hand.

## Beyond this file: callers you cannot see from here

This exercise is small enough that "every caller" is a claim you can finish checking — the
entire codebase is `order.ts`, `pricing.ts`, and `tests/`. That completeness does a lot of
quiet work worth naming.

**Dynamic dispatch.** A lookup like `handlers[order.promoType](order)` finds nothing under a
grep for a literal string, because no call site ever writes it — the string lives in a
config file or an assembled constant, the same shape by which `FOUNDER-RATE` reaches this
file's own function.

**Serialized data.** A promo code baked into old order records — on disk, in a database — is
a caller with no source line at all. Deleting the branch it depends on fails silently,
whenever that stored data resurfaces and the code that handled it is gone.

**A public API.** Inside this exercise, "no caller found" and "there is no caller" are the
same claim, because every caller is a file you can open. The moment this module ships as a
library other teams import, that stops being true — "I could not find a caller" quietly
narrows to "I could not find one *in the repositories I looked in*."

What changes: the proof can no longer come from reading alone. It has to come from outside
the repository — a deprecation warning shipped ahead of the deletion, usage telemetry, or
asking the teams you know depend on it. Question 1 stops being "grep the callers" and
becomes "instrument the code and watch."

## The tension worth naming directly

Every other drill in this module trusts a green suite to prove behaviour is unchanged. This
one asks you to delete code with no test covering it and call that behaviour-preserving too
— which sounds like it breaks the module's own rule, until you notice why it doesn't.
Deleting code is behaviour-preserving exactly when the code was unreachable, because
"unreachable" and "cannot affect observable behaviour" are the same fact stated two ways.
The suite staying green isn't what proves that here — it was never able to see this code
either way. The proof has to happen *before* the delete. Everywhere else the tests are the
safety net; here, they're only the safety net for the branch you kept.

## What it cost

I'm not fully at ease with one thing: `effectivePromoCode` and `promoDiscountCents`
communicate through a bare string, `"FOUNDER-RATE"`, typed identically in two functions
with no shared constant between them. A typo in either literal would silently break the
founding discount with no compiler error, since both sides are just `string`. A shared
`FOUNDER_RATE_PROMO_CODE` constant would close that gap for almost nothing. I didn't add
one — doing so isn't Remove Dead Code, it's *Extract Variable* riding along inside a drill
about deletion. I'd raise it in review on a real change.

## If you took a different route

- **Deleting all four branches, including `FOUNDER-RATE`.** The mistake the drill is built
  around, not a defensible alternative — see Step 4. The value, if you did this, is in
  noticing which test told you.
- **Renaming `promoDiscountCents` once one branch remains**, to `founderRateDiscountCents`
  say. Reasonable, and a matter of taste — I kept the general name since promo codes are
  marketing's to reintroduce anytime.
- **Introducing the shared constant from "What it cost" in this same change.** Also
  reasonable — I left it out to keep the diff answerable to one question: was this code
  reachable.

What is *not* a matter of taste: leaving a deleted branch commented out "just in case", and
deleting a branch on question 1's first half alone — no literal call site — without asking
what else could produce the value. Those two are how dead code gets a body double.

## Where TypeScript makes this different from the book

Fowler's *Remove Dead Code* is written for a language where "does anything call this" is a
question you answer entirely by reading — no tool stands behind you. TypeScript helps in two
smaller but real ways. `noUnusedLocals` catches one narrow slice for free: delete
`sampleCrateWaiver`'s only caller and forget the function itself, and `tsc --noEmit` refuses
to compile until you remove it too — it can't tell you a *branch* is unreachable, but it
won't let an orphaned declaration linger the way plain JavaScript would let it.

More important: a language with union types makes "ask what the type system rules out" a
real question, sometimes answered "everything." In JavaScript that question doesn't exist to
ask; questions 1, 3, and 4 carry the entire proof, every time. This exercise is built around
the case where TypeScript deliberately doesn't hand you the shortcut either, so those three
get exercised in earnest.
