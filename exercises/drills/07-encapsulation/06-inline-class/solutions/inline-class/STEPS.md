# Steps — a plain string where the wrapper used to be

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubt — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a class's every method is a one-line pass-through to a single
wrapped value, and nothing outside the class has ever needed it to be more than that value.
`CatalogueKey` passes that test: one field, two methods, and both methods could be replaced
at their one call site by an operation the wrapped string already supports.

**What it costs:** the seam disappears. If a real parsing or validation rule for catalogue
keys shows up later, there is no longer a single place already carved out to hold it — see
[`drill-07-05`](../../../05-extract-class/README.en.md), which keeps a class in exactly
that position for a cluster of fields that *did* turn out to need one.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-06     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Inline `CatalogueKey.equals` at its one call site in `matchesKey` | `refactor: inline CatalogueKey.equals` |
| 2 | Simplify the now-redundant `new CatalogueKey(key).value` down to `key` | `refactor: drop the redundant CatalogueKey construction` |
| 3 | Delete `toString()` — nothing in the exercise calls it | `refactor: remove unused CatalogueKey.toString` |
| 4 | Change `CatalogueItem`'s private field from `CatalogueKey` to `string`; store `props.key` directly | `refactor: store the catalogue key as a plain string` |
| 5 | Update `catalogueKey()`, `section()`, and `matchesKey()` to drop the `.value` hop | `refactor: drop the .value hop in CatalogueItem` |
| 6 | Delete `catalogue-key.ts` and its import | `refactor: delete CatalogueKey` |

Steps 1 and 2 are separate because step 1 alone is still correct but silly — it is the step
that proves the class added nothing, before you let yourself delete anything.

---

Where it lands:

```ts
export class CatalogueItem {
  readonly #key: string;
  // ...

  catalogueKey(): string {
    return this.#key;
  }
  matchesKey(key: string): boolean {
    return this.#key === key;
  }
}
```

No `CatalogueKey`, no `.value`, no behaviour anywhere that used to be different.
