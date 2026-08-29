import type { ContactMethod } from "./types";

/** The slice of a member's record that exists only to reach them. */
export interface ContactDetailsProps {
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly postalCode: string;
  readonly phone: string;
  readonly email: string;
  readonly preferredContactMethod: ContactMethod;
}

export class ContactDetails {
  readonly #addressLine1: string;
  readonly #addressLine2: string | null;
  readonly #city: string;
  readonly #postalCode: string;
  readonly #phone: string;
  readonly #email: string;
  readonly #preferredContactMethod: ContactMethod;

  constructor(props: ContactDetailsProps) {
    this.#addressLine1 = props.addressLine1;
    this.#addressLine2 = props.addressLine2;
    this.#city = props.city;
    this.#postalCode = props.postalCode;
    this.#phone = props.phone;
    this.#email = props.email;
    this.#preferredContactMethod = props.preferredContactMethod;
  }

  mailingAddress(): string {
    return this.#addressLines().join("\n");
  }

  formattedPhone(): string {
    const area = this.#phone.slice(0, 3);
    const exchange = this.#phone.slice(3, 6);
    const line = this.#phone.slice(6);
    return `(${area}) ${exchange}-${line}`;
  }

  preferredLine(): string {
    switch (this.#preferredContactMethod) {
      case "email":
        return `Email: ${this.#email}`;
      case "phone":
        return `Phone: ${this.formattedPhone()}`;
      case "post":
        return `Post: ${this.#addressLines().join(", ")}`;
    }
  }

  #addressLines(): string[] {
    const lines = [this.#addressLine1];
    if (this.#addressLine2 !== null) {
      lines.push(this.#addressLine2);
    }
    lines.push(`${this.#city} ${this.#postalCode}`);
    return lines;
  }
}
