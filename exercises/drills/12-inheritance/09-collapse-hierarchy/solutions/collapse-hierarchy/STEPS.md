# Steps — one class, kept under the name callers already use

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and which direction to collapse
in, and why — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a subclass overrides nothing, adds no field, and exists only
as an empty `class X extends Y {}`. `PracticeRoom` passes that test today; it did not
always, back when a second room subclass existed and needed telling apart from this one.

**What it costs:** there is no longer a superclass sitting ready, one level up, for a
second kind of room to specialise from. See [`drill-12-07`](../../../07-remove-subclass/README.en.md),
this module's other Lazy Element drill, for the sibling call made on a class instead of a
whole hierarchy level.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-09     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Copy `Room`'s body into `PracticeRoom`, using `#props` in place of `protected props` | `refactor: fold Room's members into PracticeRoom` |
| 2 | Point `schedule.ts`'s type-only import at `PracticeRoom` instead of `Room` | `refactor: import RoomProps from practice-room.ts` |
| 3 | Remove `extends Room` from `PracticeRoom`'s class declaration | `refactor: stop PracticeRoom extending Room` |
| 4 | Delete `room.ts` | `refactor: delete Room` |

Step 1 is the one to slow down for: it is a straight copy, but `protected` becoming a true
private field (`#props`) is a visibility *tightening*, not a rename, and it is only safe
because step 3 is about to remove the one thing `protected` was for.

---

Where it lands:

```ts
export class PracticeRoom {
  readonly #props: RoomProps;
  // every method Room used to declare, verbatim
}
```

One class, one file, the name every caller already imported. `Room` never had a second
subclass to justify the split once the old rehearsal-hall billing rules were retired — this
just makes that true in the file tree, not only in practice.
