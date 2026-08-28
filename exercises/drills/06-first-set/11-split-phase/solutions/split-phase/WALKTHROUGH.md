# Walkthrough — parse the line, then price the entry

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the intermediate type had to earn, and
where I was not sure I had it right. Read it after you have your own version, not before.

---

## Before anything: find the seam by its variables, not by a comment

`priceRegistrationLine` in `src/` is twenty-six lines and does not announce itself the way
the *Comments* smell does elsewhere in this module. There is no `// now price it` marker.
What there is, if you read the local variables in the order they are declared, is this:

```
name, distance, membership, promo             — text off the wire
runnerName, distanceCode, isMember,
  hasEarlyBirdPromo                            — still text, now trimmed and typed
baseFeeCents, memberDiscountCents,
  subtotalCents, promoDiscountCents            — money
```

Eight variables that are about *characters* — what the desk volunteer typed, and what it
means once you've trimmed and cased it — and four that are about *money*, and none of the
money variables appear until every character variable already has its final value. That
gap is the seam. Nothing after `hasEarlyBirdPromo` is computed reads a raw field again, and
nothing before it needs to know a price.

This is the portable version of the lesson, and it generalises past this file: **a phase
boundary in a long function shows up as two disjoint sets of local variables, one of which
goes quiet exactly when the other starts.** You do not need a comment to find it. You need
to list the locals and ask which ones any given line could still touch. `Long Function` is
the smell; this reading is how you locate the cut before you've decided what to call
anything.

## Why this order: phase 2 before phase 1

The obvious-looking plan is to extract `parseRegistrationLine` first, because it is the
first thing that happens. I did the opposite, and it is not a style preference.

If you extract the parser first, you have to decide what it returns *before* you have seen
what pricing actually consumes. You will almost certainly build a structure that mirrors
the four raw fields — because that is all you have to go on — and one of those fields will
be `membership: string`, because that is the shape the text arrived in. That is **the
wrong intermediate**, and you will not find out until you write the pricing phase against
it and discover it is reaching back into `"MEMBER"` string comparisons that were supposed
to live only in the parser.

Extracting `priceRegistration` first — even sloppily, with four raw parameters — forces you
to write the pricing logic against *facts*: a boolean, a boolean, and a code to look up.
Only once that shape exists do you design `ParsedRegistration` to match it. The struct is
not a guess about what parsing produces; it is a precise list of what pricing needs. This
is the book's order for a reason: the second phase is the customer, and you let the
customer specify the contract.

## Step 1 — extract `priceRegistration`, four raw parameters and all

```ts
// after
function priceRegistration(
  runnerName: string,
  distanceCode: string,
  isMember: boolean,
  hasEarlyBirdPromo: boolean,
): RegistrationCharge {
  const baseFeeCents = BASE_FEE_CENTS[distanceCode];
  // ...
}
```

Four parameters is already over the strict profile's limit of three, and that is fine —
this is a mid-route state, not a commit that has to pass `lint:strict`. Only
`solutions/split-phase/` is held to that bar. Treat the four-parameter shape as a scratch
pad for step 2, not as something to be proud of.

## Steps 2 and 3 — the intermediate structure, one field at a time

This is the step worth slowing down for, and the reason it is split in two.

`ParsedRegistration` is not "whatever the parser happens to produce." It is a design
decision: which facts does the *second* phase need in order to never ask a question about
text again? Look at what `priceRegistration` actually reads: `distanceCode` (a key into a
price table), `isMember` (a yes/no), `hasEarlyBirdPromo` (a yes/no). All three cross into
`ParsedRegistration` together in step 2, because they are used for the same kind of thing —
a pricing *decision*.

`runnerName` is different, and that is why it gets its own step. Pricing never branches on
it; it only carries it through to the receipt. It would be easy to leave it as a fourth
parameter next to `entry: ParsedRegistration` and call the split done — two parameters
instead of four still looks like progress. But `priceRegistration(runnerName, entry)` means
the seam is not actually one value wide; it's a struct plus a straggler, and the straggler
is exactly the kind of thing that grows: the next field someone adds "just for the
receipt" will default to being a parameter too, and the struct will slowly stop being the
single source of truth for what crossed the seam. Step 3 folds it in, and
`priceRegistration(entry: ParsedRegistration)` becomes the whole signature.

**On the name — `distanceCode`, not `membership: string`.** This is the one to get right,
and the review checklist for this drill leads with it: *does the intermediate structure
carry text or facts?* I considered keeping `membership: string` (the trimmed, upper-cased
token) in `ParsedRegistration` and letting `priceRegistration` compare it to `"MEMBER"`
itself. Rejected — question 4 from [`NAMING.md`](../../../../../../docs/NAMING.md): is it
true? A field named `membership` that is actually still a piece of text to be interpreted
is a lie by omission; it invites the pricing phase to grow its own copy of the parsing
rules. `isMember: boolean` is the fact the text was standing in for. `distanceCode` stays a
string on purpose, because unlike membership it isn't collapsed to yes/no here — it's
looked up, not interpreted — so the pricing phase treats it as an opaque key and never
calls `.trim()` or `.toUpperCase()` on it. If pricing ever needs to inspect the code's
shape rather than just index with it, that is a sign the parser under-cooked it, not a
reason to weaken the type back to a raw string everywhere.

## Step 4 — extract `parseRegistrationLine`

```ts
export function parseRegistrationLine(raw: string): ParsedRegistration {
  const [name = "", distance = "", membership = "", promo = ""] = raw.split("|");
  return {
    runnerName: name.trim(),
    distanceCode: distance.trim().toUpperCase(),
    isMember: membership.trim().toUpperCase() === MEMBER_TOKEN,
    hasEarlyBirdPromo: promo.trim().toUpperCase() === EARLY_BIRD_TOKEN,
  };
}
```

By this point the extraction is almost mechanical — the hard design work happened in steps
2 and 3. The top-level function is now:

```ts
export function priceRegistrationLine(raw: string): RegistrationCharge {
  return priceRegistration(parseRegistrationLine(raw));
}
```

**On the name — `priceRegistrationLine` composes, it doesn't hide.** Question 3: does it
read at the call site? `priceRegistration(parseRegistrationLine(raw))` reads left to right
as a sentence — parse, then price — which is exactly why I did not collapse it further or
rename it to something like `processRegistration`. `process` is a category, not a name; it
would pass question 2's test for vagueness and fail it anyway, because "process" is true of
almost every function in the file.

## Step 5 — one file per phase

`parseRegistrationLine` moves to `parse-registration.ts`, `priceRegistration` to
`price-registration.ts`, both interfaces to `registration.ts`. This step is not required by
the refactoring — Split Phase is done once the two functions and the intermediate type
exist, whatever file they live in. I did it anyway because the file boundary is a second,
stronger fence around the same seam: TypeScript will not let `price-registration.ts` call
`.split("|")` on anything without first importing `String.prototype`'s own methods against
a value that was never in scope, and it will not let `parse-registration.ts` reference
`BASE_FEE_CENTS` at all, because that constant is not exported. In JavaScript this same
split is only as strong as the discipline of whoever edits the file next; a reviewer has to
notice a stray `.toUpperCase()` in the pricing module by reading it. In TypeScript, the
module boundary plus the absence of an export makes half of those mistakes a compile
error instead of a code-review comment. That is the one place this exercise is genuinely
different from doing it in the book's JavaScript.

## Step 6 — the helpers, and the decision I'm least sure about

`priceRegistration` after step 5 is thirteen lines, one over the strict profile's limit.
The obvious fix — pull the base-fee lookup into `baseFeeFor` — accounts for three of those
lines. The remaining one is `subtotalCents`, which exists only to be passed to the
early-bird calculation and then reused in the total. It's a single value, used twice, and
there's no way to shrink its declaration without either duplicating the subtraction or
finding somewhere else to compute it.

I moved it into the same extraction as the member discount:

```ts
function memberDiscount(
  baseFeeCents: number,
  entry: ParsedRegistration,
): { memberDiscountCents: number; subtotalCents: number } {
  const memberDiscountCents = entry.isMember
    ? Math.round(baseFeeCents * MEMBER_DISCOUNT_RATE)
    : 0;
  return { memberDiscountCents, subtotalCents: baseFeeCents - memberDiscountCents };
}
```

**I am not fully sold on this.** `memberDiscount` now promises one thing in its name and
delivers two — the discount, plus what's left of the base fee once it's been taken off.
Question 4 again: is the name true? Arguably not quite; `subtotalAfterMemberDiscount` would
be honest about the second value but makes the call site,
`const { memberDiscountCents, subtotalCents } = memberDiscount(baseFeeCents, entry)`,
harder to read for a value that's genuinely a minor, coupled detail. I kept the shorter
name because the two numbers are inseparable in practice — you cannot have "the member
discount" without also fixing what remains — and because splitting them into two
functions would mean computing `baseFeeCents * MEMBER_DISCOUNT_RATE` (or an equivalent
call) twice. But I would not be surprised if a reviewer pushed back on this one, and I
would not have a knock-down argument ready.

This step is also the reason steps 1–5 had to come first: this exact bundling decision is
only visible once `distanceCode`, `isMember`, and `hasEarlyBirdPromo` have already left
`priceRegistration`'s parameter list and arrived as a single `entry`. Attempted earlier,
against four loose parameters, it would have been one more thing to shuffle rather than a
choice about two values that are already travelling together.

## What a too-rich intermediate would have looked like

The reviewer checklist for this drill asks whether `ParsedRegistration` carries text or
facts, and it's worth being concrete about the failure in the other direction too. A
too-rich `ParsedRegistration` — the mirror-image mistake — would be one where the parser
starts making pricing decisions on the intermediate structure's behalf: precomputing
`baseFeeCents` itself (which means it now needs its own copy of the price list), or adding
a `qualifiesForDiscount: boolean` that bakes in a business rule the pricing phase should
own. The test is symmetric: `parseRegistrationLine` may not import anything about money,
and `priceRegistration` may not import anything about `|` or string splitting. Either
import is the split failing, in either direction. `ParsedRegistration` sits exactly on
that line — facts derived from text, nothing derived from a price list.

## If you took a different route

- **Extracting `parseRegistrationLine` before `priceRegistration`.** The likely outcome —
  see "why this order" above — is a `membership: string` field you then have to go back
  and fix. If you did it this way and it worked out cleanly on the first try, you were
  either careful or lucky; either is fine, but check that `priceRegistration` genuinely
  never compares a string to `"MEMBER"`.
- **Keeping the two phases in one file.** Defensible for a file this small — step 5 is the
  one step that isn't strictly required by the catalog entry. A larger registration system
  with more distance tiers and promo rules would earn the separate files faster than this
  one does.
- **Not bundling `memberDiscountCents` and `subtotalCents`.** Also defensible — see step 6.
  Duplicating the subtraction, or accepting a fourteen-line function and arguing the strict
  profile is being pedantic here, are both positions I'd listen to.

What is *not* a matter of taste: a `ParsedRegistration` field that is still text waiting to
be interpreted (`membership: string`, a raw `raw: string` passed through), and a
`priceRegistration` that reaches for the price list from anywhere but `distanceCode`. Those
two are the errors this exercise exists to catch, and no amount of "different style"
excuses either one.
