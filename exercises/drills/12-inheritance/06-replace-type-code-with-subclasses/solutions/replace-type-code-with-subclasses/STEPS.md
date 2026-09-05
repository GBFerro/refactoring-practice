# Steps — one class per instrument family, one switch left in the factory

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and why `LendingStatus` never
gets this treatment — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a type code drives more than one conditional inside the same
object — `Instrument.rentalDepositCents()`, `maintenanceIntervalWeeks()`, and
`requiredAccessory()` each open with their own `switch (this.category)` over the same four
values — **and** the code is fixed once, at construction, for the rest of the object's life.
`InstrumentCategory` passes both tests. `LendingStatus` fails the second one on purpose:
see [`drill-12-07`](../../../07-remove-subclass/README.en.md) and
[`drill-10-04`](../../../../10-conditional-logic/04-replace-conditional-with-polymorphism/README.en.md)
for the two moves this one is not.

**What it costs:** four classes instead of one field and three switches. Every category's
full story now lives in one file — a genuine improvement for "what does a brass instrument
cost" — but adding a fifth family means adding a whole file, where it used to mean adding
one case to each of three switches.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-06     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add four empty subclasses of `Instrument` — `StringInstrument`, `BrassInstrument`, `WoodwindInstrument`, `PercussionInstrument` — nothing constructs them yet | `refactor: add empty instrument subclasses` |
| 2 | Override `StringInstrument`'s three methods, copied from `Instrument`'s `"string"` cases — still unreachable | `refactor: give StringInstrument its own numbers` |
| 3 | Give `addInstrument` a `case "string"`, falling back to plain `Instrument` for everything else — the first branch goes live | `refactor: route string instruments through StringInstrument` |
| 4 | Override `BrassInstrument` and add its `case "brass"` in the same step | `refactor: route brass instruments through BrassInstrument` |
| 5 | Same for `WoodwindInstrument` / `case "woodwind"` | `refactor: route woodwind instruments through WoodwindInstrument` |
| 6 | Same for `PercussionInstrument` / `case "percussion"` — every category is explicit now, so delete the `default` fallback; it is unreachable | `refactor: route percussion instruments through PercussionInstrument` |
| 7 | Delete the three switch bodies and the `category` field from `Instrument`; mark the three methods and the class `abstract` | `refactor: make Instrument abstract, delete the dead switches` |
| 8 | Narrow `Instrument`'s constructor — and each `new XInstrument(...)` call in `addInstrument` — from the whole `InstrumentInput` to the `name` it still uses | `refactor: pass instrument constructors just the name` |

Steps 2 and 3 are separate on purpose, for the same reason 4–6 are not: step 2 cannot
change behaviour, because nothing calls `StringInstrument` yet, so it is safe to write and
re-read at leisure. Once that safety net has done its job once, steps 4 through 6 fold the
override and the routing into one commit per remaining category — three switches' worth of
proof that the pattern holds, not three repeats of learning it.

---

Where it lands:

```ts
export function addInstrument(input: InstrumentInput): Instrument {
  switch (input.category) {
    case "string":
      return new StringInstrument(input.name);
    case "brass":
      return new BrassInstrument(input.name);
    case "woodwind":
      return new WoodwindInstrument(input.name);
    case "percussion":
      return new PercussionInstrument(input.name);
  }
}
```

One switch, in the one place an instrument's family actually gets decided. Every other
call in the module asks an `Instrument` what it costs; nothing outside `addInstrument` asks
what category it is. `LendingStatus` is not in this picture at all — it stays a private,
mutable field on the shared base, exactly as it was before this drill touched anything.
