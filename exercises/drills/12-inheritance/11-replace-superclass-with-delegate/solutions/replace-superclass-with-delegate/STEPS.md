# Steps — `LessonArchive` holds a `LessonRoster`, and is not one

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a subclass inherits a superclass's interface but overrides a
meaningful share of it to throw, or worse, silently leaves some of it un-blocked because
nobody remembered to. `LessonArchive` overrides two of `LessonRoster`'s four mutators to
refuse them outright — and never got around to the third. See
[`drill-12-10`](../../../10-replace-subclass-with-delegate/README.en.md) for the sibling move —
a delegate replacing a subclass instead of a superclass, for an unrelated reason. Read both
before deciding either is the default answer.

**What it costs:** `add`, `entries`, and `count` are now hand-written one-line forwards on
`LessonArchive` instead of free from `extends`. Any future `LessonRoster` method that an
archive *would* legitimately want has to be added to `LessonArchive` by hand before an
archive can use it, where inheritance would have handed it over automatically.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-11     # 6 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Give `LessonArchive` a private `#roster: LessonRoster` field, still `extends LessonRoster` for now | `refactor: give LessonArchive its own delegate field` |
| 2 | Add `add`, `entries`, `count` on `LessonArchive`, each forwarding to `#roster`; nothing calls them yet | `refactor: forward the wanted methods to the delegate` |
| 3 | Confirm every external caller uses `add` / `entries` / `count` — none reach past them to an inherited method | `refactor: confirm no caller depends on the inherited surface` |
| 4 | Drop `extends LessonRoster`; delete the two throwing overrides (`insertAt`, `removeAt`) | `refactor: stop inheriting from LessonRoster` |

Steps 1 and 2 are pure addition — nothing observable changes, because `LessonArchive` is
still a `LessonRoster` and every existing caller still works exactly as before. Step 4 is
the only step that can break something, which is why it comes last, after step 3 has
actually looked for a caller that would notice.

---

Where it lands:

```ts
export class LessonArchive {
  readonly #roster = new LessonRoster();

  add(lesson: Lesson): void {
    this.#roster.add(lesson);
  }

  entries(): readonly Lesson[] {
    return this.#roster.entries();
  }

  count(): number {
    return this.#roster.count();
  }
}
```

Three forwards, and nothing left on `LessonArchive` that was ever inherited from
`LessonRoster` — including the two methods that used to throw. There is nothing left to
refuse, because there is nothing left to inherit.
