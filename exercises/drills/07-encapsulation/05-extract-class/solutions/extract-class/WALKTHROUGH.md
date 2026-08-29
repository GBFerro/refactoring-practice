# Walkthrough — contact details as their own class

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, what the name had to earn, and what I am
still not sure about. Read it after you have your own version, not before.

---

## Before anything: which fields keep company with which methods

`Member` in `src/` has eleven fields and seven methods. Before extracting anything, sort
both lists by who touches whom:

- `membershipSummary()` reads `membershipTier` and `joinedOn`. Nothing else does.
- `mailingAddress()`, `formattedPhone()`, `contactLine()`, and the private `addressLines()`
  read `addressLine1`, `addressLine2`, `city`, `postalCode`, `phone`, `email`, and
  `preferredContactMethod` — seven fields, four methods, and none of the four ever reads
  `membershipTier`, `joinedOn`, `id`, or `name`.
- `id` and `name` are read by everything, including the summary card.

Two clusters, one shared identity. That is **Large Class**: not "too many lines" — this
file was never longer than about sixty — but two unrelated stories being told by one
narrator. The tell is that you can draw a line through the field list and the method list
at the same place and the two halves never call each other.

## Why this order

I moved the leaf method first (`formattedPhone`, which reads one field and calls nothing
else) and the composite method last (`contactLine`, which calls `formattedPhone` and the
address helper). Same reasoning as leaves-first in any extraction: moving a method before
its dependencies exist on the new class means either duplicating logic temporarily or
breaking the build for a step. Moving dependencies first means every subsequent move is
"cut, paste, done."

The field question comes before any of that. Step 1 decides *what `ContactDetails`
constructs from*, and I made a call worth stating up front: `ContactDetails` is built from
an explicit object naming exactly the seven fields it needs —

```ts
this.#contact = new ContactDetails({
  addressLine1: props.addressLine1,
  addressLine2: props.addressLine2,
  city: props.city,
  postalCode: props.postalCode,
  phone: props.phone,
  email: props.email,
  preferredContactMethod: props.preferredContactMethod,
});
```

— rather than the shorter `new ContactDetails(props)`. TypeScript allows the shorter form:
`props` is a variable, not an object literal, so structural typing lets a `MemberProps`
satisfy the narrower `ContactDetailsProps` with no complaint about the four extra fields
riding along. I rejected it anyway. If `ContactDetails` can be constructed from an object
that also happens to carry `id`, `name`, `membershipTier`, and `joinedOn`, then its
*declared* type is not telling the truth about what it needs — question 4 from
[`NAMING.md`](../../../../../../docs/NAMING.md) applies to a type's shape, not only to a
name. The explicit object costs seven lines of repetition. I think that is a fair price for
a type that means what it says, but it is genuinely a judgement call — see "What it cost"
below.

## Steps 2–3 — `formattedPhone`, then `addressLines`

`formattedPhone()` moved first because it depends on nothing but `phone`. Cut, paste,
delegate:

```ts
// Member, after
formattedPhone(): string {
  return this.#contact.formattedPhone();
}
```

`addressLines()` moved next, ahead of the two methods that call it, for the same reason —
by the time `mailingAddress()` and `contactLine()` move, the helper they need is already
sitting on `ContactDetails` waiting for them.

**On the name.** The private helper kept its name, `addressLines()`, across the move.
Question 2 from `NAMING.md` — could it be the name of something else in this file? — is
easy to answer inside `ContactDetails`: there is exactly one thing in this class that could
plausibly be called "the address lines," so the short name stays sharp even after the move.
I did reject `buildAddressLines` while writing the original version — question 1, it names
the mechanism ("build"), not the result — and `getAddressLines`, which fails the
conventions table in `NAMING.md`: something that answers a question gets a noun phrase, not
a `get*` verb.

## Steps 4–5 — `mailingAddress`, then `contactLine` → `preferredLine`

`mailingAddress()` moved the same way as `formattedPhone()`. `contactLine()` is the
interesting one, because its name changed on the way over:

```ts
// Member — public method, name unchanged (the API is frozen for this drill)
contactLine(): string {
  return this.#contact.preferredLine();
}

// ContactDetails — the same logic, new name
preferredLine(): string {
  switch (this.#preferredContactMethod) {
    case "email": return `Email: ${this.#email}`;
    case "phone": return `Phone: ${this.formattedPhone()}`;
    case "post": return `Post: ${this.#addressLines().join(", ")}`;
  }
}
```

**On the name.** Question 3 — does it read at the call site? — is what killed
`ContactDetails.contactLine()` as an option. Read the call site: `this.#contact.contactLine()`
says "contact" twice, once from the receiver's type and once from the method name, and the
receiver already told you this. `preferredLine()` reads cleanly at that same call site and
names the actually distinguishing fact — this is the line matching *whichever* method the
member prefers, not just any contact line. On `Member` itself the outward name stays
`contactLine()` regardless, both because the API is frozen for this drill and because at
*that* call site — a caller who has never heard of `ContactDetails` — "contact" is exactly
the word doing the work. Same idea, two names, because the two call sites see different
context. That is not an inconsistency; it is question 3 answered twice, correctly, in two
different places.

## Step 6 — deleting the fields from `Member`

Once every method that reads the contact fields has moved, `Member` never reads
`addressLine1` through `preferredContactMethod` again — it only holds `#props` (the whole
`MemberProps`, for `id`, `name`, `membershipTier`, and `joinedOn`) and `#contact`. I left
`#props` as the full object rather than narrowing `Member`'s own storage to a four-field
type, because the constructor still accepts the full `MemberProps` — the public API did not
change, only where each field's *behaviour* lives. Narrowing `Member`'s internal field to
match would have meant introducing a second props type for symmetry with
`ContactDetailsProps`, and I did not think the symmetry was worth the extra type. A reviewer
could reasonably disagree.

## What it cost

Four methods on `Member` — `mailingAddress`, `formattedPhone`, `contactLine`, and (in
spirit) `summaryCard` — that do nothing but forward to `#contact`. That is the direct price
of keeping the public API frozen: if `Member` had been free to change its surface, the
cleaner move would expose `member.contact` and delete three of the four forwards, letting
callers write `member.contact.mailingAddress()` directly. I did not do that here, on
purpose — see the note on [`drill-07-06`](../../../06-inline-class/README.en.md) below —
but if this were a real codebase rather than a drill with a frozen API, I would want a
follow-up conversation about whether four forwarding methods is a permanent cost or a
temporary one.

The thing I am genuinely unsure about: passing an explicit seven-field object into
`ContactDetails`'s constructor instead of the whole `props`. It is more honest about what
`ContactDetails` needs, and it is also seven lines that will need updating in two places if
a contact field is ever renamed. I would not be surprised if a second reviewer preferred
`new ContactDetails(props)` and called the explicit version over-engineered for a class this
small. I chose the stricter version because I think a type that can be satisfied by
something it does not actually use is a small trap for the next person — but "small" is
doing real work in that sentence.

## Where TypeScript changes this from the book

Fowler's *Extract Class* walks through JavaScript, where "does this field still belong on
the old class" is a question you answer by reading every use site by hand. Here, once
`Member`'s fields were narrowed away from the contact set (step 6), the compiler would
refuse to build if any method on `Member` still reached for `this.#props.phone` or similar
— `#props` still has the field, but nothing forces you to notice a stray read the way a
missing property would. The safety net TypeScript actually gave me was narrower: it caught
every place a `ContactDetailsProps`-shaped object was expected but something with the wrong
field types was passed. It did not catch "this field is no longer meaningfully used by
`Member`" — that was still a manual read, same as the book.

## If you took a different route

- **Passing `props` wholesale to `ContactDetails`.** Type-checks, is three lines shorter,
  and is a completely defensible choice for a class this size. I rejected it; I would not
  insist you do the same.
- **Exposing `member.contact` publicly and deleting the forwards.** The cleaner shape if
  the API were not frozen. Not available to you in this drill, but worth doing as a personal
  follow-up once you have a green suite — then compare what you'd need to change to make
  [`drill-07-06`](../../../06-inline-class/README.en.md)'s inline safe by the same
  reasoning, in reverse.
- **A second extraction, `Membership`, for `membershipTier` and `joinedOn`.** Legitimate —
  `Member` is arguably still two things after this drill, just a smaller two things. Left
  out because the brief's dominant smell here is the contact cluster specifically, and
  piling a second extraction on top would blur which move the tests are actually guarding.

What is *not* a matter of taste: `ContactDetails` staying out of `index.ts`. It is an
implementation detail of how `Member` is built, not part of what this drill's tests exercise,
and exporting it would invite exactly the "reach through three objects to get a phone
number" shape that this module's Hide Delegate drill (`drill-07-07`) exists to fix. An
extraction that leaks its new class into the public surface on day one has skipped a
decision, not made one.

## The question this drill and its inverse both have to answer

[`drill-07-06`](../../../06-inline-class/README.en.md) deletes a class that wraps one field
and does nothing else. `ContactDetails` is the other case: a class that wraps seven fields
and hosts four methods that read only those seven. The test that actually distinguishes
them is not "how many fields" on its own — it is *what breaks if you delete the class and
paste its methods back onto the caller*. Delete `ContactDetails` and paste its four methods
back onto `Member`, and you are back to the large class this drill started from: real
behaviour, now duplicated in spirit even if not in text, because it was never really about
`Member` in the first place. Do the same thing to the class in `drill-07-06` and nothing
duplicates, because there was only ever one caller and one field, and the class was not
saving that caller from anything.
