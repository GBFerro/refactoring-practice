import { Membership } from "./membership";
import type { TierName } from "./tier";

/** What the front desk records when someone joins the Marlowe Community Library. */
export interface MemberProps {
  readonly id: string;
  readonly name: string;
  readonly tierName: TierName;
  readonly memberSince: string;
}

/** A library member: who they are, and how many items they may hold at once. */
export class Member {
  readonly id: string;
  readonly name: string;
  readonly #membership: Membership;

  constructor(props: MemberProps) {
    this.id = props.id;
    this.name = props.name;
    this.#membership = new Membership(props.tierName, props.memberSince);
  }

  loanLimit(): number {
    return this.#membership.loanLimit();
  }
}
