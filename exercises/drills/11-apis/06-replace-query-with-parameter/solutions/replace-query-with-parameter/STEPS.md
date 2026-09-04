# Steps — a reserve count every caller states, not sets

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the honest cost of it — is
in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** a function reads module-level state that more than one caller
needs to control independently, and setting that state before every call is the only way
callers currently get different answers out of it. Not when every caller in the system
genuinely agrees on the value and passing it everywhere would just be noise — see
[drill-11-05](../../../05-replace-parameter-with-query/README.en.md) for the case that cuts
the other way.

**What it costs:** every caller now has to know its own reserve count and say so. A future
caller with no opinion on the reserve — code that just wants "is anything left at all" —
has to invent a number (probably `0`) where before it could call the function and get
today's box-office policy for free.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-11-06     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add a `reservedSeatCount` parameter to `sectionHasAvailability`, defaulting to a new `getReservedSeatCount()` accessor that reads the module variable, so every existing call site still compiles unchanged | `refactor: give sectionHasAvailability a reservedSeatCount parameter, module variable as fallback` |
| 2 | Move `publicSectionHasAvailability` onto the explicit parameter; stop calling `setReservedSeatCount` first | `refactor: pass the public hold explicitly, drop the setter call` |
| 3 | Move `staffSectionHasAvailability` onto the explicit parameter the same way | `refactor: pass the staff hold explicitly, drop the setter call` |
| 4 | Move `sectionAvailabilitySummary` onto two direct calls, one per reserve count, with no `setReservedSeatCount` between them | `refactor: compute both halves of the summary without touching module state` |
| 5 | Delete the module-level `reservedSeatCount` variable, `setReservedSeatCount`, `getReservedSeatCount`, and the parameter's fallback default — the parameter is required now | `refactor: remove the module-level reserve, require the parameter` |

Steps 2–4 are one caller each on purpose: each one only changes what that caller passes,
never what `sectionHasAvailability` does with it, so a red suite after any of them points
at exactly one caller. Step 5 is the one place the module's shape actually changes — from
"a query with a settable default" to "a pure function" — and it's safe only because nothing
still depends on the fallback.

---

Where it lands:

```ts
// availability.ts
export function sectionHasAvailability(
  show: Show,
  section: string,
  reservedSeatCount: number,
): boolean {
  return openSeatCount(show, section) > reservedSeatCount;
}
```

```ts
// callers.ts
export function sectionAvailabilitySummary(show: Show, section: string): AvailabilitySummary {
  return {
    publicAvailability: sectionHasAvailability(show, section, PUBLIC_STAFF_HOLD),
    staffAvailability: sectionHasAvailability(show, section, NO_STAFF_HOLD),
  };
}
```

Both halves of the summary are computed with no shared state between them — order no
longer matters, and there's no window where one caller's reserve count leaks into another
caller's check.
