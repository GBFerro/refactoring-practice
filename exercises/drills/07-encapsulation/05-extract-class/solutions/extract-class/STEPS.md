# Steps — contact details as their own class

The route, in the order that keeps every step small. Terse on purpose: keep this open in a
split pane while you work. The reasoning behind each move — and the doubts — is in
[`WALKTHROUGH.md`](./WALKTHROUGH.md).

**When to choose this:** when a subset of a class's fields and a subset of its methods only
ever refer to each other — never to the rest of the class — and that subset would still
make sense if you deleted everything around it. `Member`'s contact fields pass that test;
they never touch `membershipTier` or `joinedOn`, and nothing in `membershipSummary()`
touches them back.

**What it costs:** one more class, one more file to open, and four one-line forwarding
methods on `Member` that exist only to keep its public shape the same. See
[`drill-07-06`](../../../06-inline-class/README.en.md) for what happens when this
reasoning is applied somewhere it does not hold.

---

Run after **every** step, and commit after every step:

```bash
npx vitest run --project drill-07-05     # 8 passed
```

| # | Move | Commit |
| --- | --- | --- |
| 1 | Create empty `ContactDetails`, constructed from an explicit subset of `Member`'s props | `refactor: introduce ContactDetails` |
| 2 | Move `formattedPhone()`'s body into `ContactDetails`; `Member.formattedPhone()` delegates | `refactor: move formattedPhone to ContactDetails` |
| 3 | Move the private `addressLines()` helper into `ContactDetails` | `refactor: move addressLines to ContactDetails` |
| 4 | Move `mailingAddress()`'s body into `ContactDetails`; `Member.mailingAddress()` delegates | `refactor: move mailingAddress to ContactDetails` |
| 5 | Move `contactLine()`'s body into `ContactDetails.preferredLine()`; `Member.contactLine()` delegates | `refactor: move contactLine to ContactDetails.preferredLine` |
| 6 | Delete the address/phone/contact-method fields from `Member`'s own storage — read only through `#contact` | `refactor: remove now-unused contact fields from Member` |

Steps 2 through 5 are one field or method at a time on purpose: each is a single `git diff`
you could hand to a reviewer with no explanation needed.

---

Where it lands:

```ts
export class Member {
  readonly #props: MemberProps;
  readonly #contact: ContactDetails;

  mailingAddress(): string {
    return this.#contact.mailingAddress();
  }
  formattedPhone(): string {
    return this.#contact.formattedPhone();
  }
  contactLine(): string {
    return this.#contact.preferredLine();
  }
  // ...membership-only methods, unchanged
}
```

Four forwarding methods, and a `ContactDetails` that could be tested, read, and changed
without anyone touching `Member` at all.
