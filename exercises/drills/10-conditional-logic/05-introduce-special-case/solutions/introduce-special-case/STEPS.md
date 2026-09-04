# Steps — one patient record that already knows how to answer

The route, in the order that keeps every step small and the suite green throughout. Terse
on purpose: keep this open in a split pane while you work. The reasoning behind each move —
and why step 3 is the one that matters most — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** the same identity check (`patient.id === "unknown"`) is repeated
at every call site that needs to treat one particular case specially, and each site writes
its own version of "and if it's that case, do this instead." Nine call sites means nine
chances to get the check right, and nine places a tenth caller has to remember to copy it
into.

**What it costs:** `registeredPatient` stops being a free identity function — it now has to
resolve nine fields instead of returning its input unchanged, and every future board field
has to be taught to *both* factories instead of appended to a list of checks in one file.
See `WALKTHROUGH.md` for when that trade stops being worth it.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-10-05     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Give both factories in `patient.ts` the nine resolved fields (plus `isUnknown`), alongside the raw data each already carried. No board function changes yet. | `refactor: resolve every board field on Patient at construction` |
| 2 | Point the five text-returning board functions at the new fields, deleting their `id === "unknown"` checks | `refactor: read displayName, contact, insurance, DOB and next-of-kin off Patient` |
| 3 | Point the four remaining board functions at the new fields the same way | `refactor: read armband, sort key, billable and follow-up off Patient` |
| 4 | Drop the raw fields from `Patient` now that nothing reads them: `registeredPatient` resolves instead of passing through, and the unknown sentinel becomes one shared constant | `refactor: stop carrying raw patient data past the factories` |

Step 3 is the one to read `WALKTHROUGH.md` for before you write it: it is the only step in
this route where a caller's observed behaviour actually changes.

---

Where it lands:

```ts
// patient-board.ts
export function isBillable(patient: Patient): boolean {
  return patient.isBillable;
}
```

Every board function is a one-line field read. There is no comparison left anywhere in this
file for a tenth caller, or a typo, to get wrong.
