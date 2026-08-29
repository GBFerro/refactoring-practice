# Steps — one `loanLimit()` query, not a chain

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a client repeatedly walks through an object it does not care
about (`Membership`) to reach one it does not care about either (`Tier`) for a value it
could have asked the object it started with for directly. Six call sites here all want one
number; none of them has any other use for a `Membership` or a `Tier`.

**What it costs:** two one-line forwarding methods, and `Membership.tier()` loses its only
public caller. A future feature that needs the tier for something other than its loan limit
has to add an accessor back, not find one waiting. See
[`drill-07-08`](../../../08-remove-middle-man/README.en.md), where the same shape of
forwarding method is *removed* rather than added — read both before deciding this is always
the right call.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-07     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Add `Membership.loanLimit()`, forwarding to `#tier.loanLimit()` | `refactor: hide Tier behind Membership.loanLimit` |
| 2 | Add `Member.loanLimit()`, forwarding to `#membership.loanLimit()` | `refactor: hide Membership behind Member.loanLimit` |
| 3 | Replace all six `member.membership().tier().loanLimit()` chains in `loan-desk.ts` with `member.loanLimit()` | `refactor: collapse the loan-limit chain at every call site` |
| 4 | Confirm nothing still calls `Membership.tier()` or `Member.membership()`; delete both | `refactor: remove the now-unused delegate accessors` |

Steps 1 and 2 are separate because each hides one hop, and step 3 only becomes a
single-method call once both hops are hidden — trying to collapse the chain before step 2
would still leave `member.membership().loanLimit()` at every call site, a shorter chain but
still a chain.

---

Where it lands:

```ts
export class Member {
  readonly #membership: Membership;

  loanLimit(): number {
    return this.#membership.loanLimit();
  }
}

export class Membership {
  readonly #tier: Tier;

  loanLimit(): number {
    return this.#tier.loanLimit();
  }
}

// loan-desk.ts, all six functions
member.loanLimit();
```

One call, one dot, and neither `Membership` nor `Tier` needs to be named at any of the six
call sites that only ever wanted a number.
