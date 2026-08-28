# Steps — parse the line, then price the entry

The route, in the order that lets you design the seam instead of guessing at it. Terse on
purpose: keep this open in a split pane while you work. The reasoning — and the step most
people take in the wrong order — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when one function answers two unrelated questions in sequence —
*what does this text mean* and *what does it cost* — and every future change touches the
same block regardless of which question it belongs to. A new promo code and a new distance
tier are unrelated changes that currently land in the same twenty-six lines.

**What it costs:** an intermediate type (`ParsedRegistration`) that exists for no reason
but to let the two phases meet, a second file to open when you're chasing one value
end-to-end, and a decision every time you add a field about which phase owns it.

---

Run after **every** step:

```bash
npx vitest run --project drill-06-11     # 10 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Extract `priceRegistration`, taking the four already-parsed values as separate parameters | `refactor: extract priceRegistration` |
| 2 | Introduce `ParsedRegistration`; migrate `distanceCode`, `isMember`, `hasEarlyBirdPromo` into it, leaving `runnerName` as its own parameter for now | `refactor: introduce ParsedRegistration for the coded fields` |
| 3 | Migrate `runnerName` into `ParsedRegistration` too | `refactor: fold runnerName into ParsedRegistration` |
| 4 | Extract `parseRegistrationLine`, having it build and return `ParsedRegistration`; the top-level function collapses to two calls | `refactor: extract parseRegistrationLine` |
| 5 | Split into `registration.ts` (types), `parse-registration.ts`, `price-registration.ts`; `index.ts` composes | `refactor: split parsing and pricing into their own modules` |
| 6 | Extract `baseFeeFor` and `memberDiscount` inside `price-registration.ts`, to bring `priceRegistration` under the 12-line limit | `refactor: extract pricing helpers` |

Steps 2 and 3 are separate on purpose: `runnerName` is not used to make any pricing
*decision*, so it is the field you are most likely to leave behind as "just a parameter."
Doing it as its own step is what makes you notice that, and decide anyway.

---

Where it lands:

```ts
// index.ts
export function priceRegistrationLine(raw: string): RegistrationCharge {
  return priceRegistration(parseRegistrationLine(raw));
}
```

One line naming the two phases, in order. `parseRegistrationLine` never imports anything
about money; `priceRegistration` never imports anything about `|`. That is the whole
target — everything else is in service of making this line possible.

See [`WALKTHROUGH.md`](./WALKTHROUGH.md) for why phase 2 is extracted before phase 1, and
for what deciding the shape of `ParsedRegistration` actually costs.
