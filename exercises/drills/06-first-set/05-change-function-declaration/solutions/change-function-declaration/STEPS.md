# Steps — rename to say what it does, then drop the parameter the catalogue already carries

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost of taking
it — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** the migration mechanic below is worth it whenever you cannot
sweep every caller in one sitting with confidence — a published function, callers spread
across files or packages, or (as here) a change you want to *practice* moving one caller at
a time before you need to do it for real. For three callers in one file you already own, the
book's simple mechanic — change the declaration, fix every caller, one commit — is equally
correct and faster. Both routes are shown; this file walks the migration one.

**What it costs:** two working lookups for three commits in the middle of the route, one of
them a thin wrapper that exists only to be deleted, and five commits instead of one for a
change the compiler could have forced through in a single edit.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-05     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `requireCourse(catalogue, code)`, reading `catalogue.season`; have `checkCourse` delegate to it instead of using its own `season` parameter | `refactor: introduce requireCourse, delegate checkCourse to it` |
| 2 | Move `describeCourse` onto `requireCourse` | `refactor: move describeCourse onto requireCourse` |
| 3 | Move `seatsRemaining` onto `requireCourse` | `refactor: move seatsRemaining onto requireCourse` |
| 4 | Move both lookups inside `describeWithPrerequisite` onto `requireCourse` | `refactor: move describeWithPrerequisite onto requireCourse` |
| 5 | Delete `checkCourse` — nothing calls it | `refactor: delete checkCourse` |

Step 1 is the one that can silently change behaviour: it is the step where the removed
`season` parameter stops being read at all. It is safe only because every caller already
passed `catalogue.season` for it, and the suite going green here is the proof — not an
inspection of `checkCourse`'s old body, which could not tell you that on its own.

---

Where it lands:

```ts
// course-lookup.ts
export function requireCourse(catalogue: CourseCatalogue, code: string): Course {
  const course = catalogue.courses.find((candidate) => candidate.code === code);
  if (course === undefined) {
    throw new Error(`No course "${code}" in the ${catalogue.season} catalogue.`);
  }
  return course;
}
```

Two parameters, a name a throwing function can keep, and no second copy of the season
anywhere in the call.

**The simple-mechanic alternative**, for comparison — same destination, one commit:

1. Change `checkCourse`'s declaration in place: drop `season`, read `catalogue.season`,
   rename to `requireCourse`.
2. Fix the (now red) three call sites in `callers.ts` in the same commit.
3. Run the suite once, green.

Correct, and arguably more honest about the size of the change than five commits for three
callers. See the walkthrough for when each is the right call.
