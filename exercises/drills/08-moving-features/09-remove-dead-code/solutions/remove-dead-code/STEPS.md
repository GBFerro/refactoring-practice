# Steps — three branches deleted, one left alone

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The proof behind each deletion — and the one branch that looks
exactly like its dead neighbours and isn't — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** once you have actually proven a branch dead, always. The delete
itself is not a judgement call — Remove Dead Code has exactly one right move once you know
which lines qualify. Every bit of judgement in this drill sits upstream of the diff, in
deciding which lines do.

**What it costs:** the paper trail. Each deleted branch's comment was the only place left
recording why a promo code existed and when it stopped mattering. Once it's gone, the next
person who wants to run a one-weekend fair discount starts from a blank function instead of
a shape that already worked.

---

Before touching a single line, for **every** branch in `promoDiscountCents`:

1. List every place in this exercise that could hand that exact string to `promoDiscountCents`
   — literal call sites, but also anything that could *compute* it.
2. Ask what `Order["promoCode"]`'s type already rules out. (Here: nothing — it's
   `string | undefined`, wide open on purpose. See `WALKTHROUGH.md` for why that matters.)
3. Temporarily make the branch return something obviously wrong and run the suite. Green
   means no *test* reaches it — not proof of (1), just one more input to it.

Run after **every** deletion, and commit after every deletion:

```bash
npx vitest run --project drill-08-09     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Delete the `HARVEST-FAIR-2019` branch and `HARVEST_FAIR_2019_DISCOUNT_CENTS` | `refactor: remove dead HARVEST-FAIR-2019 branch` |
| 2 | Delete the `WELCOME-CAFE` branch and `WELCOME_CAFE_DISCOUNT` | `refactor: remove dead WELCOME-CAFE branch` |
| 3 | Delete the `SAMPLE-CRATE-FREE` branch **and** `sampleCrateWaiver`, the helper it alone called | `refactor: remove dead SAMPLE-CRATE-FREE branch and its helper` |
| 4 | Confirm `FOUNDER-RATE` is reached through `effectivePromoCode`'s tenure fallback, not any literal call site. Leave `promoDiscountCents`'s last `if` and `effectivePromoCode` untouched. | *(no commit — nothing to change)* |

Steps 1–3 don't depend on each other and could land in one commit once you trust the proof
behind each; they're listed separately so a test failure after any single one of them
points at exactly that deletion, not at "somewhere in three branches."

---

Where it lands:

```ts
function promoDiscountCents(subtotal: number, promoCode: string | undefined): number {
  if (promoCode === "FOUNDER-RATE") {
    return Math.round(subtotal * FOUNDING_ACCOUNT_DISCOUNT);
  }
  return 0;
}
```

One `if`, not a chain — and nobody wrote it that way on purpose. It's what a chain looks
like once you've deleted every branch that couldn't survive step 1 through 3.
