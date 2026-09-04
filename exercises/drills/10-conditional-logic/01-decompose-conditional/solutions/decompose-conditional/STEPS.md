# Steps — one name each for the question and the two answers

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a condition and its branches need more than a glance to
answer "what is this doing and why." A tangled `if` with two unreadable branches has one
good answer, which is why this is a drill. Compare
[`drill-10-02`](../../../02-consolidate-conditional-expression/), the mirror-image problem:
several conditions that turn out to already be one idea.

**What it costs:** one compact `if`/`else` becomes three named functions, so a reader who
wants the whole rule now reads three names and trusts them, or opens all three, instead of
scanning six lines end to end. Worth it here because the six lines were never actually
readable — see `WALKTHROUGH.md` for why that is the actual bar, not just "more lines."

This drill assumes you have done `drill-06-01` — extraction mechanics are not re-taught
here. What's new is recognising that a *condition* is worth a name just as much as a block
of statements is.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-10-01     # 9 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract `CLINIC_OPENS_MINUTE` and `CLINIC_CLOSES_MINUTE`, replacing the `480` / `1080` literals | `refactor: name the opening-hours constants` |
| 2 | Extract the whole condition into `isOutOfHours(appt)` | `refactor: extract isOutOfHours` |
| 3 | Extract the out-of-hours branch into `outOfHoursChargeCents(tariff)` | `refactor: extract outOfHoursChargeCents` |
| 4 | Extract the standard-hours branch into `standardChargeCents(tariff)` | `refactor: extract standardChargeCents` |

Steps 1 and 2 are separate on purpose: naming the two literals first means step 2 extracts
a condition that already reads in English, instead of extracting first and discovering the
magic numbers are still sitting inside the new function.

---

Where it lands:

```ts
export function appointmentChargeCents(appt: Appointment, tariff: Tariff): number {
  let rawCents: number;
  if (isOutOfHours(appt)) {
    rawCents = outOfHoursChargeCents(tariff);
  } else {
    rawCents = standardChargeCents(tariff);
  }
  return Math.round(rawCents);
}
```

Same shape as before — a condition, two branches, one `let` — but every part of it now has
a name a reader can trust without opening the function. Nothing about the *mechanics* of
extraction is different from `drill-06-01`; what's different is that the thing being named
is a question and two answers, not a paragraph.
