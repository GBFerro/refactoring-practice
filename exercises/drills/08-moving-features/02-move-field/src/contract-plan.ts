/** A standing wholesale agreement. Every customer buys under exactly one of these. */
export class ContractPlan {
  readonly id: string;
  readonly name: string;
  #discountRate: number;

  constructor(id: string, name: string, discountRate: number) {
    this.id = id;
    this.name = name;
    this.#discountRate = discountRate;
  }

  get discountRate(): number {
    return this.#discountRate;
  }

  renegotiate(rate: number): void {
    this.#discountRate = rate;
  }
}

export function openContractPlan(
  id: string,
  name: string,
  discountRate: number,
): ContractPlan {
  return new ContractPlan(id, name, discountRate);
}
