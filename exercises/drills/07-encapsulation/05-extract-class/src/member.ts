import type { MemberProps } from "./types";

/** A library member: who they are, and how to reach them about their loans. */
export class Member {
  readonly #props: MemberProps;

  constructor(props: MemberProps) {
    this.#props = props;
  }

  get id(): string {
    return this.#props.id;
  }

  get name(): string {
    return this.#props.name;
  }

  membershipSummary(): string {
    const tier = this.#props.membershipTier;
    const label = tier.charAt(0).toUpperCase() + tier.slice(1);
    const year = this.#props.joinedOn.slice(0, 4);
    return `${label} member since ${year}`;
  }

  mailingAddress(): string {
    return this.#addressLines().join("\n");
  }

  formattedPhone(): string {
    const area = this.#props.phone.slice(0, 3);
    const exchange = this.#props.phone.slice(3, 6);
    const line = this.#props.phone.slice(6);
    return `(${area}) ${exchange}-${line}`;
  }

  contactLine(): string {
    switch (this.#props.preferredContactMethod) {
      case "email":
        return `Email: ${this.#props.email}`;
      case "phone":
        return `Phone: ${this.formattedPhone()}`;
      case "post":
        return `Post: ${this.#addressLines().join(", ")}`;
    }
  }

  summaryCard(): string {
    return [this.name, this.membershipSummary(), this.contactLine()].join("\n");
  }

  #addressLines(): string[] {
    const lines = [this.#props.addressLine1];
    if (this.#props.addressLine2 !== null) {
      lines.push(this.#props.addressLine2);
    }
    lines.push(`${this.#props.city} ${this.#props.postalCode}`);
    return lines;
  }
}
