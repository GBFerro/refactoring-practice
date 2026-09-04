# Steps — the concentration assumption, stated and enforced

The route, terse, for working alongside. The reasoning — and the line between this and the
weight check sitting three lines above it — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a calculation depends on something being true that nothing in the
code checks, states, or could plausibly be caused by the values a caller controls. If that
assumption is ever violated, it can only be because some *other* part of the program - not
this call - is wrong, and the failure should say so immediately, at the point that exposed
it, rather than hand back a silently unusable number.

**What it costs:** one line, in the one function that needed it, that can only ever throw
for input no test in this exercise's own suite constructs on purpose. See
`WALKTHROUGH.md` for why that's a feature of the exercise, not a hole in its coverage - and
for the input this refactoring deliberately leaves alone.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-10-06     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `assert.ts`: a small helper that throws a labelled error when a condition is false, typed with TypeScript's `asserts` predicate | `refactor: add an assert helper` |
| 2 | In `volumeMl`, assert `profile.concentrationMgPerMl > 0` immediately before the division, naming the drug in the message | `refactor: state the concentration assumption in volumeMl` |

Two steps, and the second one does the whole job - this is a small, targeted refactoring,
not a restructuring. `checkedWeightKg` is not touched in either step; it was already correct
before this drill started, and it stays exactly as it was.

---

Where it lands:

```ts
export function volumeMl(weightKg: number, profile: DrugProfile): number {
  const dose = doseMg(weightKg, profile);
  assert(
    profile.concentrationMgPerMl > 0,
    `${profile.name}'s formulary entry has a non-positive concentration (${String(profile.concentrationMgPerMl)} mg/mL)`,
  );
  return dose / profile.concentrationMgPerMl;
}
```

A formulary entry with a bad concentration now fails loudly, by name, at the first call that
tries to use it - instead of quietly handing back `Infinity` or `NaN` for whoever reads
`volumeMl`'s return value next.
