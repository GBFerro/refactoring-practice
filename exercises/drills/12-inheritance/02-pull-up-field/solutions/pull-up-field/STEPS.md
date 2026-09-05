# Steps — insuredValueCents lives on Instrument

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the field you should
*not* touch — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when two sibling subclasses each declare a field of the same name,
the same type, and — this is the part worth checking, not assuming — the same meaning, read
and written the same way by code that has no reason to care which subclass it is. Confirm
the third thing before you touch anything: `WindInstrument` and `StringInstrument` also
both declare a field called `gradeLevel`, and it is *not* a candidate. See
[`WALKTHROUGH.md`](./WALKTHROUGH.md#the-field-that-does-not-move) for why.

**What it costs:** `Instrument`'s constructor grows a third parameter every subclass must
thread through, and a future instrument category that genuinely carries no insured value —
a loaner practice kazoo, say — inherits a field it cannot opt out of. See
[`drill-12-05`](../../../05-push-down-field/README.en.md), where a field is moved the
other way for exactly that reason — read both before deciding this is always the right
call.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-02     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `insuredValueCents` to `Instrument`'s constructor and field list; both subclasses start passing their value to `super` in addition to keeping their own declaration — a deliberately redundant step, nothing observable changes | `refactor: add insuredValueCents to Instrument, alongside each subclass's own copy` |
| 2 | Delete `WindInstrument`'s own declaration and initializer; it now reads the field `Instrument` already has, from the value it is already passing to `super` | `refactor: let WindInstrument inherit insuredValueCents` |
| 3 | Delete `StringInstrument`'s own declaration and initializer the same way | `refactor: let StringInstrument inherit insuredValueCents` |

Step 1 changes nothing observable — it only gives the base class a copy to converge on.
Steps 2 and 3 are the ones that actually remove the duplication, split one subclass per
commit so that a broken test after either points at exactly one class, not both at once.

---

Where it lands:

```ts
export abstract class Instrument {
  readonly id: string;
  readonly name: string;
  readonly insuredValueCents: number;

  protected constructor(id: string, name: string, insuredValueCents: number) {
    this.id = id;
    this.name = name;
    this.insuredValueCents = insuredValueCents;
  }
}
```

```ts
// WindInstrument and StringInstrument, identically
constructor(props: WindInstrumentProps) {
  super(props.id, props.name, props.insuredValueCents);
  this.gradeLevel = props.gradeLevel;
}
```

One declaration, one initializer, and `gradeLevel` — same name, different meaning in each
subclass — still declared twice, on purpose.
