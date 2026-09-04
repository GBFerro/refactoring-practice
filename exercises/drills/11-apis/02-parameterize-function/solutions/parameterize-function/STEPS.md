# Steps — one rise, a lookup table for the tier

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the two decisions that took
the longest — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when several functions differ only in a literal that plugs into
an otherwise identical body, *and* every caller can be migrated to the general form one at
a time without a window where two versions of the truth exist. If a "near-identical"
function actually differs in what it means, not just in what number it uses — see step 0 —
Parameterize Function is the wrong move for it specifically, whatever you do with the rest.

**What it costs:** the three tier amounts move from three names TypeScript could check a
caller against to one number a caller can get wrong at runtime. `raiseByTwenty(band)` fails
to compile if you typo the name; `raisePrice(band, 20)` compiles fine if you meant `2`.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-02     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 0 | Read `raiseRestrictedViewBand` before touching anything. Its tier amounts match the other three exactly — the only thing that does not match is the ceiling clamp. That clamp is the reason it stays out of every step below. | *(no commit — reading)* |
| 1 | Add `raisePrice(band, risePounds)` beside `raiseByFive`/`Ten`/`Twenty`. Nothing calls it yet. | `refactor: introduce raisePrice(band, risePounds)` |
| 2 | In `raiseByTier`, change the `"low"` branch to `raisePrice(band, 5)` | `refactor: migrate the low tier to raisePrice` |
| 3 | Change the `"medium"` branch to `raisePrice(band, 10)` | `refactor: migrate the medium tier to raisePrice` |
| 4 | Change the `"high"` branch (the `else`) to `raisePrice(band, 20)` | `refactor: migrate the high tier to raisePrice` |
| 5 | Delete `raiseByFive`, `raiseByTen`, `raiseByTwenty` — nothing calls them | `refactor: delete the three raiseByX functions` |
| 6 | Replace `raiseByTier`'s `if`/`else` with a `TIER_RISE_POUNDS` lookup table; inline the one-line call directly into `raiseStandardBand` and `raiseRestrictedViewBand`; delete `raiseByTier` | `refactor: replace raiseByTier with a tier lookup table` |

Steps 2 through 4 are separate on purpose, same reason the reference drill splits its
duplicate-removal step in two: each migrates one caller of the old world to the new one,
and if a tier's amount had drifted from what its name promised, the one commit that changed
would tell you which.

---

Where it lands:

```ts
const TIER_RISE_POUNDS: Record<DemandTier, number> = { low: 5, medium: 10, high: 20 };

export function raiseStandardBand(band: PriceBand, tier: DemandTier): PriceBand {
  return raisePrice(band, TIER_RISE_POUNDS[tier]);
}
```

One function, one table. `raiseRestrictedViewBand` moves onto the same table in step 6,
still calling `raisePrice` on its own — never folded *into* `raiseStandardBand` — with its
clamp untouched start to finish. That is not an oversight; it is the answer to step 0.
