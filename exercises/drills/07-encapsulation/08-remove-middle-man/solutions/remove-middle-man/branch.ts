import { Manager } from "./manager";
import type { ManagerProps } from "./manager";

/** What the branch directory records for one Marlowe Community Library branch. */
export interface BranchProps {
  readonly id: string;
  readonly location: string;
  readonly manager: ManagerProps;
}

/** One library branch: where it is, and who runs it. */
export class Branch {
  readonly id: string;
  readonly location: string;
  readonly manager: Manager;

  constructor(props: BranchProps) {
    this.id = props.id;
    this.location = props.location;
    this.manager = new Manager(props.manager);
  }
}
