# Steps — one Bookable superclass, one method left alone

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and why one method never moves —
is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when two classes with no common ancestor have grown the same shape
by accident — the same fields under different names, the same formula written twice — and at
least one caller already wants to treat them the same way. `InstrumentRental` and
`RoomBooking` both charge a rate for a period, and nothing distinguishes them at the point
where a receipt gets printed.

**What it costs:** both classes now answer to a shared idea of what a "bookable thing" is. A
third kind of bookable item either fits `Bookable`'s assumptions (a name, a unit, a rate) or
forces a rethink of the base. See [`drill-07-05`](../../../../07-encapsulation/05-extract-class/README.en.md),
Extract Class, for the sibling call made when two things share a *part* rather than a *kind*.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-12-08     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract an empty `Bookable` class; `InstrumentRental` and `RoomBooking` both extend it | `refactor: extract empty Bookable superclass` |
| 2 | Pull Up Field: `itemName`, `units`, `rateCentsPerUnit` onto `Bookable`, via a shared `BookableProps` passed through `super()` — see [`drill-12-01`](../../../01-pull-up-method/README.en.md) for the field-then-method mechanics, not re-taught here | `refactor: pull up itemName, units, rateCentsPerUnit to Bookable` |
| 3 | Pull Up Method: `costCents()` — identical once both read the same field names — onto `Bookable`; delete both subclass copies | `refactor: pull up costCents to Bookable` |
| 4 | Declare `bookingDescription()` abstract on `Bookable`; add `override` on both subclasses | `refactor: formalize bookingDescription as an abstract contract` |
| 5 | Checkpoint — no diff. `lateFeeCents(unitsOver)` matches in name and signature on both classes. Compare the two bodies anyway before moving on | *(no code change)* |
| 6 | Simplify `receipt.ts`'s `Booking` union type to `Bookable` | `refactor: receipt functions take a Bookable, not a booking union` |

Step 5 is the one that is easy to skip and expensive to skip wrong. Read
[`WALKTHROUGH.md`](./WALKTHROUGH.md) before you decide it's a duplicate.

---

Where it lands:

```ts
export abstract class Bookable {
  protected readonly itemName: string;
  protected readonly units: number;
  protected readonly rateCentsPerUnit: number;

  costCents(): number { /* rate * units, rounded */ }
  abstract bookingDescription(): string;
}

// InstrumentRental and RoomBooking: each keeps its own lateFeeCents(), untouched.
```

One shared base for identity and cost math. Two late fees that were never the same thing,
still two.
