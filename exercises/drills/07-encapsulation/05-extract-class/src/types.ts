export type MembershipTier = "standard" | "family" | "senior";
export type ContactMethod = "email" | "phone" | "post";

/** What the front desk collects when someone joins the Marlowe Community Library. */
export interface MemberProps {
  readonly id: string;
  readonly name: string;
  readonly membershipTier: MembershipTier;
  readonly joinedOn: string;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly postalCode: string;
  readonly phone: string;
  readonly email: string;
  readonly preferredContactMethod: ContactMethod;
}
