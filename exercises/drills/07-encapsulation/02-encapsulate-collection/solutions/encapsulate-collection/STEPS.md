# Steps — no getter at all, borrow/return/query methods instead

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the three-way decision at
its centre — is in [`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** whenever a class hands its collection field out — as a public
field or as a getter that returns it directly — to more than one caller that can add,
remove, or otherwise mutate it. Prerequisite: [`drill-07-01`](../../../01-encapsulate-record/README.en.md), which does the
same thing for a record's *scalar* fields; this drill is the version of that argument
where the field is an array instead.

**What it costs:** `MemberAccount` has no way to hand back "the loans" in any form. A
caller with a real need for the raw list — a data export, a full-account dump — has
nowhere to go but a new purpose-built method, written by hand, same as every query before
it.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-02     # 7 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Turn `MemberAccount` from an interface plus an object-literal factory into a class with a constructor; `loans` stays a public, mutable field | `refactor: turn the account record into a class` |
| 2 | Add `returnItem(itemId)` to the class; replace the raw `findIndex`/`splice` pair in `returns.ts` with a call | `refactor: extract returnItem onto MemberAccount` |
| 3 | Add `borrow(itemId, dueOn)` to the class, moving `MAX_LOANS_PER_MEMBER` in with it; replace the guard-and-push block in `borrowing.ts` with a call | `refactor: extract borrow onto MemberAccount` |
| 4 | Add a `loanCount` getter; replace `account.loans.length` in `currentLoanCount` with a call | `refactor: extract loanCount onto MemberAccount` |
| 5 | Add `loansDueSoon(today, withinDays)` to the class, moving `toDueSoonEntry` in with it; replace the `map`/`filter`/`sort` pipeline in `due-soon.ts` with a call | `refactor: extract loansDueSoon onto MemberAccount` |
| 6 | Make `loans` a private `#loans` field | `refactor: make loans private` |

Steps 2–5 can happen in any order relative to each other — each one only touches its own
free function. Step 6 has to be last: every external read and write has to already be
routed through a method before the field can disappear.

---

Where it lands:

```ts
export class MemberAccount {
  readonly memberId: string;
  #loans: Loan[];

  get loanCount(): number { /* ... */ }
  borrow(itemId: string, dueOn: string): BorrowOutcome { /* ... */ }
  returnItem(itemId: string): boolean { /* ... */ }
  loansDueSoon(today: string, withinDays: number): DueSoonEntry[] { /* ... */ }
}
```

No method returns `#loans`, a copy of it, or a view of it. Every question this exercise's
callers ask — how many, can I borrow this, give this back, what's due soon — is answered by
a method built for that question, not by handing over the list and trusting the asker.
