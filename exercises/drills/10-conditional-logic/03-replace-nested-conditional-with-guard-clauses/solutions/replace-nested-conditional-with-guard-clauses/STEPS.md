# Steps — three flat exits, one decision left standing

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the test for telling a
guard from a real decision — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a function nests because most of its branches are just
declining to run — checking a precondition, then falling through to the one thing the
function actually does. It is *not* the move for a conditional whose branches are both
equally the point, like the salaried/hourly split still sitting at the bottom of this
function once the guards are gone. That one stays an `if`/`else`.

**What it costs:** three early returns instead of one exit at the bottom, so a reader has
to hold "there are three ways this pays nothing" in mind instead of trusting a single
return statement. Worth it here because three is few enough to scan at a glance; it stops
being worth it well before ten.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-10-03     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Invert `staff.active` into a guard clause (`if (!staff.active) return 0;`); dedent everything below it | `refactor: guard on active staff` |
| 2 | Invert `shift.status === "completed"` into a guard clause; dedent again | `refactor: guard on completed shift` |
| 3 | Invert `!shift.payoutIssued` into `if (shift.payoutIssued) return 0;`; dedent again | `refactor: guard on unpaid shift` |
| 4 | Replace the `payoutCents` accumulator with direct `return`s inside the salaried/hourly branch; delete the trailing `return payoutCents;` | `refactor: return directly from the salaried/hourly branch` |

Each guard removes one level of nesting for everything still below it — that is why this
route goes outside-in, guarding the outermost `if` first, unlike an extraction like
`drill-06-01`'s, which works leaves-first. Reversing the order here just means re-indenting
the same block three times instead of once.

---

Where it lands:

```ts
export function staffPayoutCents(staff: StaffMember, shift: Shift): number {
  if (!staff.active) return 0;
  if (shift.status !== "completed") return 0;
  if (shift.payoutIssued) return 0;

  if (staff.employmentType === "salaried") {
    return staff.dailyRateCents;
  }
  return hourlyPayoutCents(staff.hourlyRateCents, shift.durationMinutes);
}
```

Three exits, then one decision. The `if`/`else` at the bottom is not step 5 — it was never
nested to begin with in spirit, only in the original's indentation, and it is exactly as
much an `if`/`else` after this drill as before it.
