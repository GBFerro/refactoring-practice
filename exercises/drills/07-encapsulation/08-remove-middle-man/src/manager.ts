/** What the branch record keeps about whoever runs the branch. */
export interface ManagerProps {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly certifiedForRareBooks: boolean;
  readonly yearsOfService: number;
  readonly onLeave: boolean;
}

/** A branch manager: who they are, and what they're currently authorized to handle. */
export class Manager {
  readonly #name: string;
  readonly #email: string;
  readonly #phone: string;
  readonly #certifiedForRareBooks: boolean;
  readonly #yearsOfService: number;
  readonly #onLeave: boolean;

  constructor(props: ManagerProps) {
    this.#name = props.name;
    this.#email = props.email;
    this.#phone = props.phone;
    this.#certifiedForRareBooks = props.certifiedForRareBooks;
    this.#yearsOfService = props.yearsOfService;
    this.#onLeave = props.onLeave;
  }

  name(): string {
    return this.#name;
  }

  email(): string {
    return this.#email;
  }

  phone(): string {
    return this.#phone;
  }

  isCertifiedForRareBooks(): boolean {
    return this.#certifiedForRareBooks;
  }

  yearsOfService(): number {
    return this.#yearsOfService;
  }

  isOnLeave(): boolean {
    return this.#onLeave;
  }
}
