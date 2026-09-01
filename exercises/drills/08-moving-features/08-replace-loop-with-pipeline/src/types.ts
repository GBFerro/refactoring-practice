/** One delivery arriving on the weekly supplier truck. */
export interface Delivery {
  readonly supplierName: string;
  readonly itemName: string;
  readonly weightKg: number;
  readonly costCents: number;
  readonly qualityPassed: boolean;
  /** Set only when qualityPassed is false. */
  readonly rejectionReason: string | null;
}

/** A week's worth of incoming deliveries, and the one truck they all arrived on. */
export interface SupplierReport {
  readonly weekOf: string;
  readonly truckCapacityKg: number;
  readonly deliveries: readonly Delivery[];
}
