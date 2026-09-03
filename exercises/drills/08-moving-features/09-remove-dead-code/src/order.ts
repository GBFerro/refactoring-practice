export interface OrderItem {
  readonly productName: string;
  readonly unitPriceCents: number;
  readonly quantity: number;
}

/** A wholesale account Ashgrove Bakery Co-op bills directly, not a one-off retail buyer. */
export interface Customer {
  readonly id: string;
  readonly name: string;
  /** Full years since this customer placed their first wholesale order. */
  readonly yearsActive: number;
}

export interface Order {
  readonly id: string;
  readonly customer: Customer;
  readonly items: readonly OrderItem[];
  /**
   * A code punched in at checkout. Marketing creates and retires these outside this
   * codebase, so it is a free-form string here, never a closed set of literals.
   */
  readonly promoCode?: string;
}
