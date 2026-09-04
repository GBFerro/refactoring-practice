# Steps — one class per appointment type, one switch left at the factory

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost accounting
— is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when the *same* type code is switched on in more than one place
and the places drift independently — `scheduling.ts`, `billing.ts`, and `patient-prep.ts`
each have their own `switch (type)` over the same three `AppointmentType` values, so adding
a fourth type means finding and updating all three. One switch on its own is not this
smell; three switches on the same type code, in three different files, is **Repeated
Switches**, and that repetition is what justifies the cost below - not just that a switch
exists.

**What it costs:** three classes and a factory instead of three `case` clauses each. Every
appointment type's full story now lives in one file, which is a genuine improvement for
"what does a checkup do" - but "what does duration mean across every type" now means
opening three files instead of reading one column of a switch top to bottom. And adding a
new *operation* - a fourth thing every appointment type needs to answer - means touching
every class, where it used to mean writing one new function with one new switch.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-10-04     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Introduce the `Appointment` abstract class (three method stubs, no bodies) and three empty subclasses - nothing calls them yet | `refactor: introduce Appointment class hierarchy` |
| 2 | Introduce `createAppointment(type)`, a factory switching on `AppointmentType` - still unused | `refactor: introduce createAppointment factory` |
| 3 | Move the three `case`s of `appointmentDurationMinutes`'s switch into `durationMinutes()` on each subclass; `appointmentDurationMinutes` now calls `createAppointment(type).durationMinutes()` | `refactor: move duration switch onto the appointment classes` |
| 4 | Move `appointmentFeeCents`'s switch the same way, into `feeCents(insured)` | `refactor: move fee switch onto the appointment classes` |
| 5 | Move `appointmentPrepInstructions`'s switch the same way, into `prepInstructions()` | `refactor: move prep switch onto the appointment classes` |

By the end of step 5, `createAppointment`'s switch is the only one left in the module. Steps
3 through 5 are independent of each other and can happen in any order - I did duration
first only because it is the simplest return type to get right.

---

Where it lands:

```ts
export function appointmentDurationMinutes(type: AppointmentType): number {
  return createAppointment(type).durationMinutes();
}
export function appointmentFeeCents(type: AppointmentType, insured: boolean): number {
  return createAppointment(type).feeCents(insured);
}
export function appointmentPrepInstructions(type: AppointmentType): string {
  return createAppointment(type).prepInstructions();
}
```

Three call sites, one shape, one remaining switch - inside `createAppointment`, where an
object gets built instead of a value getting picked. See
[`drill-10-03`](../../../03-replace-nested-conditional-with-guard-clauses/README.en.md)'s
walkthrough for why that particular switch is the one place TypeScript can actually catch a
forgotten appointment type for you.
