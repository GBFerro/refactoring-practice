/** One line item on a wholesale order: bread, pastries, or the like, by the case or dozen. */
export interface OrderItem {
  readonly name: string;
  readonly quantity: number;
  readonly unitPriceCents: number;
}

/** A wholesale order placed by a café or shop the co-op delivers to on a route. */
export interface WholesaleOrder {
  readonly id: string;
  readonly customerName: string;
  readonly routeName: string;
  readonly items: readonly OrderItem[];
  /** Credit owed from a previous short delivery, applied against this order's total. */
  readonly creditCents: number;
}
