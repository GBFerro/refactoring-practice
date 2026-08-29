[🌐 English](./README.en.md)

# Inline Class

`Chapter 7` · `Inline Class` · `●○○` · ~20 min

## Context

Every item on the Marlowe Community Library's shelves has a catalogue key — a short code
like `FIC-2024-0091` that the catalogue index sorts by and the front desk searches on. A
previous pass through this code wrapped that key in its own class. Nothing since then has
found a use for it being one.

## The smell

**Lazy Element.** `CatalogueKey` holds one field and offers two working methods, and both
of them are things the string it wraps could already do: `equals()` is `===` behind an
allocation, and every place that needs to *do* something with the key — split it into a
section prefix, compare it for a search — reaches straight past the class into `.value`
anyway, because the class never grew the behaviour to do that itself.

## The target

**Inline Class**, once: fold `CatalogueKey`'s two working members into `CatalogueItem`
directly, delete its unused third method along the way, and store the key as a plain
`string`. `CatalogueItem`'s own public methods stay exactly as they are from the outside.

## Done when

- `CatalogueKey` no longer exists anywhere in the solution.
- `CatalogueItem`'s key is stored as a `string`, and every method that used to reach for
  `.value` reaches for the field directly instead.
- `CatalogueItem`'s public methods — `catalogueKey()`, `section()`, `label()`,
  `matchesKey()` — are unchanged from the outside.
- No function in the solution is longer than 12 lines, nests deeper than 2, or takes more
  than 3 parameters —
  `npm run lint:strict -- exercises/drills/07-encapsulation/06-inline-class/solutions`
  is the check.
- `npm test` was green after every single step along the way.

## Hints

<details>
<summary>Where do I start?</summary>

Find every caller of every method on the class you're about to delete, including the ones
with zero callers. A class you're inlining should be read in full before you touch it —
some of what falls out is dead code, not behaviour to preserve.
</details>

<details>
<summary>`matchesKey` still constructs a `CatalogueKey` just to compare it. Is that a
problem?</summary>

It is the whole exercise in miniature. Inline the comparison method's body at its one call
site first, before you touch anything else — you'll end up with a visibly silly line
(`this.#key.value === new CatalogueKey(key).value`), and *that* is what tells you the
construction was never buying anything.
</details>

<details>
<summary>How do I know I'm not deleting something that matters?</summary>

Change the field's type from `CatalogueKey` to `string` and let the compiler show you every
place that still expects the old shape. If nothing breaks, the class was not doing
anything the type system was relying on either.
</details>

## Reading

*Refactoring*, 2nd edition — chapter 7, *Inline Class*; chapter 3, *Lazy Element*.
