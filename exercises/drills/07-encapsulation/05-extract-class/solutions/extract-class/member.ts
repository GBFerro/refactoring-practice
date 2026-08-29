import { ContactDetails } from "./contact-details";
import type { MemberProps } from "./types";

/** A library member: who they are, and how to reach them about their loans. */
export class Member {
  readonly #props: MemberProps;
  readonly #contact: ContactDetails;

  constructor(props: MemberProps) {
    this.#props = props;
    this.#contact = new ContactDetails({
      addressLine1: props.addressLine1,
      addressLine2: props.addressLine2,
      city: props.city,
      postalCode: props.postalCode,
      phone: props.phone,
      email: props.email,
      preferredContactMethod: props.preferredContactMethod,
    });
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
    return this.#contact.mailingAddress();
  }

  formattedPhone(): string {
    return this.#contact.formattedPhone();
  }

  contactLine(): string {
    return this.#contact.preferredLine();
  }

  summaryCard(): string {
    return [this.name, this.membershipSummary(), this.contactLine()].join("\n");
  }
}
