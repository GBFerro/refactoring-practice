# Steps — named functions, not a shared object

The route, in the order that keeps every step small and the suite green throughout. Terse
on purpose: keep this open in a split pane while you work. The reasoning behind each move —
and the getter-shape decision that is the actual point of the drill — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a piece of state is reachable — by import, not by
convention — from more than one file. A shared mutable object with no gatekeeper has one
correct first move, which is why this is a drill and not a kata.

**What it costs:** eight small functions where there were five raw fields, and a fifth
caller could no longer add itself without writing one. Every future setting needs its own
accessor written by hand — a general `get`/`set` pair would have been cheaper to extend and
is exactly what this solution gives up. See `WALKTHROUGH.md` for why that trade was made on
purpose.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-06-06     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add read accessors (`currentDuesCents`, `currentLateFeeRatePercent`, `remainingCapacity`, `registrationIsOpen`) beside `settings`; leave `settings` exported | `refactor: add read accessors alongside settings` |
| 2 | Add write functions (`admitOneMember`, `configureSeason`, `closeSeasonRegistration`, `raiseDuesBy`) beside `settings`, each named for the domain action, not the assignment | `refactor: add write functions alongside settings` |
| 3 | Redirect `roster.ts` (read-only) to `remainingCapacity` / `registrationIsOpen` | `refactor: route roster through accessors` |
| 4 | Redirect `treasury.ts` to `currentDuesCents`, `currentLateFeeRatePercent`, `raiseDuesBy` | `refactor: route treasury through accessors` |
| 5 | Redirect `season.ts` to `configureSeason` / `closeSeasonRegistration` | `refactor: route season through accessors` |
| 6 | Redirect `registration.ts` (reads then writes) to `registrationIsOpen`, `remainingCapacity`, `admitOneMember` | `refactor: route registration through accessors` |
| 7 | Stop exporting `settings`; change the declaration to a module-private `let` and drop the exported `ClubSettings` interface | `refactor: make settings module-private` |
| 8 | Confirm no accessor returns the live record — reject a generic `getClubSettings()` in favour of the five scalar getters already written | `refactor: keep accessors scalar, not record-shaped` |

Step 6 is last on purpose: it is the one caller that both reads and mutates in the same
function, so it is the one place a mis-ordered redirect could actually change behaviour.

---

Where it lands — `club-settings.ts` keeps everything private except the eight functions:

```ts
let settings: ClubSettings = { /* ... */ };

export function remainingCapacity(): number {
  return settings.capacity - settings.memberCount;
}

export function admitOneMember(): void {
  settings.memberCount = settings.memberCount + 1;
}
```

No caller ever sees `settings`. Every question about what can change `memberCount` has
exactly one answer: read `admitOneMember` and `configureSeason`, the only two functions
that touch it.
