/** One line item on a wholesale order: what the customer asked for, and how much. */
export interface OrderItem {
  readonly productName: string;
  readonly quantity: number;
  readonly unitWeightKg: number;
}

/** A wholesale order placed with Ashgrove Bakery Co-op, before it is loaded for delivery. */
export interface Order {
  /** Order id, unique across every customer and every route. */
  readonly id: string;
  /** Matches a `Stop.customerId` on whichever route carries this order. */
  readonly customerId: string;
  /** For the invoice; not necessarily the name printed on the route sheet. */
  readonly customerName: string;
  readonly items: readonly OrderItem[];
  /** ISO date the order was placed, for the daily production sheet. */
  readonly placedOn: string;
  /** Driver instructions for this stop, e.g. "side door, ring twice". */
  readonly deliveryNotes: string | null;
}
