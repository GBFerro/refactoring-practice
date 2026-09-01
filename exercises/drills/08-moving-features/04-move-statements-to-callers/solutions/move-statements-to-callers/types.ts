/** One line item on a dispatch note: a tray or case of a single baked good. */
export interface DispatchItem {
  readonly name: string;
  readonly quantity: number;
  readonly unitWeightGrams: number;
}

/** One stop a dispatch note describes: what to hand over, and to whom. */
export interface DispatchStop {
  readonly id: string;
  readonly customerName: string;
  readonly destination: string;
  readonly items: readonly DispatchItem[];
}
