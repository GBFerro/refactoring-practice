# Walkthrough — a delegating getter, not a second copy

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the names had to earn, and the one
assumption the whole fix quietly depends on.

---

## Before anything: the field that already exists twice

Ashgrove's board negotiates one wholesale discount per contract plan — Founders Co-op
Rate, Standard Wholesale, Trial — and every customer who signs onto a plan gets that
plan's rate. `ContractPlan` already knows its own `discountRate`; it is the one place a
board decision is actually recorded.

`Customer`, in the challenge code, keeps a *second* copy: `openCustomer` reads
`plan.discountRate` once, at signup, and stores it on the customer as an ordinary mutable
field. Nothing links the two numbers together afterward. If the board renegotiates a
plan, `renegotiatePlanRate` has to know that, and it has to find every current customer on
that plan and write the new number into each one by hand:

```ts
// challenge, plan-terms.ts
const plan = customers.find((customer) => customer.plan.id === planId)?.plan;
plan?.renegotiate(newRate);
for (const customer of customers) {
  if (customer.plan.id === planId) {
    customer.discountRate = newRate;
  }
}
```

Read that first line on its own: `plan?.renegotiate(newRate)` is the *entire* correct
fix, already sitting right there. The loop underneath it exists for exactly one reason —
because `Customer` kept a copy it didn't need to keep — and it is **Shotgun Surgery** in
miniature: one change in the business ("the Founders rate is now 18%") forces an edit
everywhere a customer happens to be sitting, and if the caller ever passes a roster that
is missing one of that plan's customers, that customer's invoices keep charging the old
rate forever, silently, with nothing in the types to say so. Two customers on the same
plan can disagree right now, and the only thing standing between "correct" and "stale" is
whoever remembers to call this function with a complete list.

That is the whole case for **Move Field**: `discountRate` is not a fact about a customer.
It is a fact about a plan, currently being asked to also be a fact about every customer on
it.

## Why this order

The temptation is to delete `Customer.discountRate` and fix whatever stops compiling.
Resist it. **Moving a bare public field in one step is the thing that goes wrong**: while
the field is a plain, writable property, nothing distinguishes "this line reads the
customer's discount" from "this line is the one place that's still allowed to set it" —
both look like `customer.discountRate`. Encapsulate first, and every read and write is
already routed through one name before you touch where the value comes from. Then moving
the value is a one-line change to what that name *does*, not a hunt through the codebase
for every place it was ever assigned.

drill-07-01 walks the mechanics of turning a raw record into a class with private fields
in detail — the two-commit reasoning behind "reshape first, privatize second" applies here
unchanged, just for one field instead of three. See
[`../../../../../../exercises/drills/07-encapsulation/01-encapsulate-record/solutions/encapsulate-record/WALKTHROUGH.md`](../../../../../../exercises/drills/07-encapsulation/01-encapsulate-record/solutions/encapsulate-record/WALKTHROUGH.md)
rather than have that argument twice.

## Step 1 — encapsulate, inertly

```ts
export class Customer {
  readonly plan: ContractPlan;
  #discountRate: number;

  constructor(id: string, name: string, plan: ContractPlan) {
    /* ... */
    this.#discountRate = plan.discountRate;
  }

  get discountRate(): number {
    return this.#discountRate;
  }
  set discountRate(rate: number) {
    this.#discountRate = rate;
  }
}
```

Behaviour is identical to the interface-and-factory version — the field still stores its
own copy, the getter and setter just wrap it. `renegotiatePlanRate`'s loop does not change
at all: `customer.discountRate = newRate` calls the setter transparently, because property
assignment and setter invocation are the same syntax. That is what makes this step free.

**On the name.** The getter and setter keep the field's exact name, `discountRate`, rather
than something like `getRate`/`setRate`. Question 3 from
[`NAMING.md`](../../../../../../docs/NAMING.md): check the call site.
`customer.discountRate` reads as a property whether it is backed by a field or a method,
and that is deliberate — the whole point of this step is that no caller can tell the
difference, so the name at the call site cannot change either.

## Step 2 — the getter moves before the field does

```ts
get discountRate(): number {
  return this.plan.discountRate;   // was: return this.#discountRate;
}
```

One line. The private field and its setter are still declared, still assigned in the
constructor, still written to by `renegotiatePlanRate`'s loop — they are just no longer
*read* by anything. Tests stay green because, at this exact commit, the two numbers have
not been given a chance to disagree yet: the loop still keeps `#discountRate` in lockstep
with `plan.discountRate`, so reading either one gives the same answer.

This is the step I'd flag for a reviewer specifically, because it is the one place this
drill's "byte-identical behaviour" claim is doing real work rather than being trivially
true. It is true for every input the test suite exercises. It would stop being true the
moment a caller renegotiated a plan through some path that updated `plan.discountRate`
without also running the loop — at that instant, this getter and the old one would answer
differently. No such path exists in this exercise. I did not add a test that tries to
construct one, because pinning that gap as "current behaviour" would mean either keeping
the bug on purpose or making step 3 impossible to write. That is the cost of this
refactor, stated as plainly as I can: it is not perfectly behaviour-preserving for inputs
nobody in this domain actually produces, only for the ones that matter.

**On the name.** I did not rename the now-doomed `#discountRate` field to something like
`#staleDiscountRate` to flag that it is dead weight for one commit. Question 4 says a name
should be true, and technically `#staleDiscountRate` would be more honest here — but the
field has one commit left to live, and a name written for a reader who will never see it
again teaches nothing. The rule does not stop applying; it just has nothing to attach to
when the variable's whole lifetime is this short.

## Step 3 — the field disappears, and so does the loop

```ts
export class Customer {
  readonly id: string;
  readonly name: string;
  readonly plan: ContractPlan;

  constructor(id: string, name: string, plan: ContractPlan) {
    this.id = id;
    this.name = name;
    this.plan = plan;
  }

  get discountRate(): number {
    return this.plan.discountRate;
  }
}
```

```ts
export function renegotiatePlanRate(
  customers: readonly Customer[],
  planId: string,
  newRate: number,
): void {
  const plan = customers.find((customer) => customer.plan.id === planId)?.plan;
  plan?.renegotiate(newRate);
}
```

The private field, the setter, and the loop all leave in the same commit, because the
loop was the setter's only caller — deleting one without the other would not compile. This
is the payoff: `renegotiatePlanRate` no longer needs to enumerate every affected customer
at all. It finds the plan through *any one* customer who has it, changes the plan, and
every customer sharing that `ContractPlan` instance — including ones this function never
even looked at — reads the new rate on their very next invoice. The bug this drill opened
with, a customer left off the roster and quietly stuck at the old rate, is not fixed by
remembering better. It is now structurally impossible, because there is exactly one number
to read.

**On the name.** `renegotiatePlanRate` keeps its name across the entire refactor, args and
all. Worth noticing why: question 1 asks whether a name says *what* or *how*. "Renegotiate
a plan's rate for its customers" was always what this function did; looping over customers
was only ever the *how*, and it is precisely the part that changed. A name that survives
its own implementation being rewritten underneath it is a name that was right in the first
place.

**On the name, once more.** `ContractPlan.renegotiate(rate)`, not `setDiscountRate(rate)`.
This is the same call drill-07-01 made for `Loan.renew` over a bare setter: `renegotiate`
is a domain action with its own name, not a generic field mutation wearing a longer one.
`plan.renegotiate(0.18)` reads as a sentence; `plan.setDiscountRate(0.18)` reads as
permission to bypass whatever judgement "renegotiate" might otherwise imply — there is
only one rate on `ContractPlan`, so today the two are equivalent, but a named action can
grow validation or an audit log later without changing its call sites. A setter cannot
grow anything; it can only be replaced.

## If you took a different route

- **Passing a separate `plans: ContractPlan[]` catalogue into every function that needs a
  rate, instead of giving `Customer` a `plan` reference at all.** More "data-oriented," and
  defensible in a codebase where customers and plans are loaded independently. Rejected
  here because it reopens the identical problem for the *next* plan-level fact someone
  adds — minimum order size, delivery day, anything — each one needing its own lookup
  threaded through every caller, rather than one reference a customer already carries.
- **Keeping a public `discountRate` field on `Customer` that is reassigned whenever the
  plan changes, instead of deleting it.** A "cache with an update hook." It still compiles,
  it would still pass this suite if the hook were wired up everywhere — and it still lets
  any file with a `Customer` reference set the field independently of the plan, which is
  the entire failure mode this drill exists to close. Not seriously considered.
- **Skipping the two-getter step and cutting straight from "field on Customer" to "field on
  ContractPlan" in one commit.** Would have worked, on a codebase this small, with a
  careful enough diff. On a larger one, that is the "moving a bare public field in one
  step" trap the whole route above is built to avoid — you cannot tell from the diff which
  changed reads and which changed writes, only that everything did.

What is *not* a matter of taste: leaving `Customer` with any way to set its own
`discountRate` once the move is done. A public setter that happens not to be called by
anything today is not a fixed bug, it is an unfixed one with better test coverage.

## Where TypeScript changes this from the book

Fowler's *Move Field* walks the JavaScript version of this: encapsulate the field, add the
field on the target, redirect the source's accessor, then either delete the source field
and fix every caller, or leave the accessor delegating for compatibility. All of that
holds here. What TypeScript adds is at step 3: deleting `#discountRate` is not a polite
request that callers stop touching it, it is a compile error for any file that still
tries. There were none — this exercise has exactly one file, `invoice.ts`, that reads
`customer.discountRate`, and it did not need to change at all, because `customer.plan` was
already there to read through. In a codebase where some caller *had* still been reaching
for the old field directly, `tsc` would have named it. The book's version of "done" is a
careful `grep`; this repository's version is `tsc --noEmit` refusing to compile the miss.
