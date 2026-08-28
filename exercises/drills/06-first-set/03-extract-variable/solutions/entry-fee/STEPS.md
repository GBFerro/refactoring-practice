# Steps — five named factors, one function

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the naming trade-offs — is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a single expression that combines several independent
calculations, where nothing has a name and the reader has to reconstruct intent from
operator precedence. If the calculations were spread across several functions instead,
you would be looking at Extract Function, not this.

**What it costs:** five extra lines the function did not have before, and five names that
have to be right, for a function whose behaviour has not changed at all. Extract Variable
makes the *reading* cheaper by making the *writing* very slightly more expensive.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-03     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract `memberFactor` | `refactor: extract memberFactor` |
| 2 | Extract `earlyBirdFactor` | `refactor: extract earlyBirdFactor` |
| 3 | Extract `nonHostSurcharge` | `refactor: extract nonHostSurcharge` |
| 4 | Extract `discountedBase`, combining the base fee with the three factors above | `refactor: extract discountedBase` |
| 5 | Extract `ageAdjustment` from the `ageAdjustmentCents` call | `refactor: extract ageAdjustment` |

Each step touches one `const` declaration and one use inside the `return`. None of them
depend on each other — you can do them in any order and land in the same place, which is
the sign this is genuinely Extract Variable and not a disguised Extract Function.

---

Where it lands:

```ts
export function calculateEntryFee(entry: EntryRequest, race: Race): number {
  const memberFactor = entry.isMember ? MEMBER_DISCOUNT : 1;
  const earlyBirdFactor = isEarlyBird(entry, race) ? EARLY_BIRD_DISCOUNT : 1;
  const nonHostSurcharge = entry.club === race.hostClub ? 1 : NON_HOST_SURCHARGE;
  const discountedBase =
    race.baseFeeCents * memberFactor * earlyBirdFactor * nonHostSurcharge;
  const ageAdjustment = ageAdjustmentCents(entry.ageCategory);
  return Math.round(discountedBase + ageAdjustment + AFFILIATION_FEE_CENTS);
}
```

Six lines instead of one, and the last line now reads as a sentence: round off the
discounted base, plus the age adjustment, plus the flat affiliation fee.
