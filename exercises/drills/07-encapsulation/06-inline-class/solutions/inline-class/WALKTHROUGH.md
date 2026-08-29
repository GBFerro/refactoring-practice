# Walkthrough — a plain string where the wrapper used to be

[`STEPS.md`](./STEPS.md) is the route: terse, for working alongside. This is the
commentary: why each move, why in that order, and what I am still not fully sure about.
Read it after you have your own version, not before.

---

## Before anything: read what the class actually earns

`CatalogueKey` in `src/` has one field and three methods:

```ts
export class CatalogueKey {
  readonly value: string;
  constructor(value: string) { this.value = value; }
  toString(): string { return this.value; }
  equals(other: CatalogueKey): boolean { return this.value === other.value; }
}
```

Grep the exercise for its methods before touching anything. `toString()` has zero callers.
`equals()` has exactly one, inside `CatalogueItem.matchesKey`:

```ts
matchesKey(key: string): boolean {
  return this.#key.equals(new CatalogueKey(key));
}
```

And every other place `CatalogueItem` reads the key — `catalogueKey()`, `section()` —
reaches straight past the class into `.value` and does its work on the raw string, because
`CatalogueKey` never grew a method to do that work itself. Nothing about section-parsing or
key-formatting lives inside `CatalogueKey`. It exists, and the class it wraps a field for is
the only reason any code ever writes `.value` at all.

That is **Lazy Element**: a piece of structure — here, a class — that is not pulling its
weight. Not "badly named," not "in the wrong file." It costs a hop (`this.#key.value`
instead of `this.#key`) and an allocation (`new CatalogueKey(key)` just to call `.equals`
on it) and returns nothing for either.

## Why this order: features before storage

The book's Inline Class walks through moving each feature of the source class into the
target, one at a time, before deleting the source. I followed that here rather than jumping
straight to "change the field type," even though the field-type change is the one line that
matters most, because inlining `equals()` first is what let me *see* that step 2 — dropping
the redundant `new CatalogueKey(key)` — was even available. If I had gone straight to
changing `#key`'s type, I would have had to make both decisions (drop the class, simplify
the comparison) in one diff, and a reviewer could not tell which part was mechanical and
which part required judgement.

## Steps 1–2 — inlining `equals`, then simplifying

Step 1, mechanical: replace the call with the method body.

```ts
// before
this.#key.equals(new CatalogueKey(key))
// after
this.#key.value === new CatalogueKey(key).value
```

Tests green, and the line is worse to read than before. That is expected — Inline Function
(which this one call site is, in miniature) sometimes makes a single line uglier on the way
to making the whole class disappear. Do not stop here.

Step 2 is the simplification `new CatalogueKey(key).value` is just `key` — constructing an
object for the sole purpose of reading back the argument you built it from. Collapsing it
gives `this.#key.value === key`, which is the first line in this file that tells the truth:
this was always a string comparison.

## Step 3 — deleting `toString()`

This is not Inline Class. It is Remove Dead Code, and it is in this drill because you
cannot responsibly delete a class without reading everything on it first, and reading
`toString()` is what tells you it has no callers. I considered leaving it for a separate
pass, and decided against it: shipping a drill that inlines two of a class's three members
and calls the job finished would be teaching the wrong lesson — "inline the parts that are
obviously in the way" instead of "inline the whole class because none of it is earning its
place." A stricter reviewer could reasonably push back and ask for this as its own commit
in its own drill. I kept it here, as its own commit, so it is at least easy to revert
independently — see "What I'm not sure about" below.

## Steps 4–5 — changing what `#key` actually is

```ts
// CatalogueItem, before
readonly #key: CatalogueKey;
constructor(props) { this.#key = new CatalogueKey(props.key); }
catalogueKey(): string { return this.#key.value; }
section(): string { return this.#key.value.split("-")[0] ?? ""; }
matchesKey(key: string): boolean { return this.#key.value === key; }

// CatalogueItem, after
readonly #key: string;
constructor(props) { this.#key = props.key; }
catalogueKey(): string { return this.#key; }
section(): string { return this.#key.split("-")[0] ?? ""; }
matchesKey(key: string): boolean { return this.#key === key; }
```

**On the name.** `catalogueKey()` did not need to change, and that is worth noticing on
purpose. Question 1 from [`NAMING.md`](../../../../../../docs/NAMING.md) — does the name
say *what*, or *how* — is exactly why: `catalogueKey()` always said what it returns, never
how it was stored. If the method had been called something like `catalogueKeyValue()`,
copying the `.value` accessor into the name, this step would have forced a rename, because
the name would have gone from true to false the moment the storage stopped being an object
with a `.value` field. A name that survives a change to the implementation underneath it
was named correctly the first time.

**On the name, again.** Inside the class, the field is `#key`, both before and after —
question 2, could it be the name of something else in this file, is trivially "no" either
way, since `CatalogueItem` only ever has one thing worth calling a key. I did consider
`#catalogueKey` for symmetry with the public method name, and rejected it: a private field
is only ever read next to `#title` and `#author` inside this one small class, where `#key`
is already unambiguous, and the longer name would just be echoing information the reader
already has from the file they are looking at.

**On the name, a third time.** `CatalogueItemProps.key` also stayed `key`, not
`catalogueKey`, for the same reason in a different spot: the constructor's props object is
always read as a literal, `{ key: "...", title: "...", author: "..." }`, with `title` and
`author` sitting right there for context. Question 3 — does it read at the call site — says
the short name is fine exactly where it is used, even though the *method* reading the same
underlying idea needs the fuller name, because the method is called from places that do not
have `title` and `author` in view to disambiguate it. Same concept, two names, because two
different neighbourhoods.

## Step 6 — deleting the file

Once `CatalogueItem` no longer imports `CatalogueKey`, nothing in `src/` (soon to be the
solution) references it. Delete `catalogue-key.ts`. This is the step that makes the whole
drill real: everything before it was preparation, and this is the one line of the diff that
actually removes something.

## What I'm not sure about

Bundling the `toString()` deletion into an Inline Class drill, as covered above — I stand by
it, but I would not be surprised to be overruled.

The other thing: `matchesKey(key: string): boolean` now takes a bare `string`, exactly as
it did before (the parameter was always a raw key, never a `CatalogueKey`) — so nothing
about *this* drill changes what a caller can pass in. But it means the type system's one
real contribution from having `CatalogueKey` around — preventing someone from passing, say,
a title where a key was expected, if any call site had been typed to take a `CatalogueKey`
instead of a `string` — was already not being used anywhere in this codebase before I
started. That is worth flagging rather than glossing over: this inline costs real type
safety in the abstract, and zero in this specific exercise, because the abstract benefit was
never claimed here in the first place. A codebase where `matchesKey` took a `CatalogueKey`
parameter, and other code often had bare strings lying around that could be confused for
each other, would be a genuinely different, harder call.

## Where TypeScript changes this from the book

Fowler's version of Inline Class does not have to reconcile two declared shapes; JavaScript
does not distinguish "an object with a `.value` field" from "a string" at the type level.
Here, changing `#key`'s declared type from `CatalogueKey` to `string` is what makes the
compiler check every remaining use for you — `this.#key.value` on a `string` is a compile
error, not a runtime surprise, so step 5 cannot silently miss a call site. That is a real
advantage TypeScript gives this refactoring over the book's version: the type change *is*
the checklist.

## If you took a different route

- **Deleting `catalogue-key.ts` before updating `CatalogueItem`.** Would not compile in
  between — a bigger single step, same destination. If it felt like one large, nervous edit
  instead of several small confident ones, that feeling was the point of doing it the other
  way.
- **Leaving `toString()` for a separate commit outside this drill.** Defensible, discussed
  above.
- **Keeping `CatalogueKey` but stripping it to just `{ value: string }` with no methods at
  all**, i.e., a type alias instead of full removal. Worth considering if some future caller
  seemed likely to need a real key type soon; not worth it here, since nothing in this
  exercise or its neighbours suggests that is coming.

What is *not* a matter of taste: `matchesKey` staying a direct `===` and not a
`.localeCompare(...) === 0` or similar — catalogue keys are exact identifiers, not
sortable-with-locale-rules text (that comparison already exists, correctly, in
`renderCatalogueIndex`'s sort), and blurring the two would be a behaviour change dressed as
a style choice.

## The question this drill and its inverse both have to answer

[`drill-07-05`](../../../05-extract-class/README.en.md) pulls a cluster of fields *out* of
`Member` because leaving them there made one class responsible for two unrelated stories,
and four methods that only cared about the contact fields were stuck reading them off a
class that also held membership data. `CatalogueKey` fails the test `ContactDetails`
passes: it never grew a second field to travel with `value`, and everything that touched
the key either bypassed the class entirely (`section()`, always did) or paid for an
allocation to do what `===` already does (`matchesKey()`, until this drill). The question
worth asking about any class before you extract one or inline one is the same question
either way: **if I delete this class and paste its behaviour back onto its one caller, does
anything duplicate, or does anything become ambiguous?** Delete `ContactDetails` and paste
its four methods back onto `Member`, and you have recreated the large class this module's
other drill starts from — real, non-duplicated behaviour, now crowded back into one place.
Delete `CatalogueKey` and paste its two working methods back onto `CatalogueItem`, and
nothing duplicates, because `CatalogueItem` was always going to need exactly one
`string`-shaped field called a key, and everything else the wrapper offered was ceremony
around that fact.
