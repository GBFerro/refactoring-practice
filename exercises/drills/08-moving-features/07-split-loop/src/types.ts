/** One customer order taken during the day. */
export interface Order {
  readonly customerName: string;
  /** What the till collects for this order, in cents. Zero for a comped or donated order. */
  readonly totalCents: number;
  /** Flour drawn from the day's stock to fill this order, in grams. Zero for orders with no baked items. */
  readonly flourGrams: number;
}

/** The day's orders, ready to be tallied at closing. */
export interface ProductionDay {
  readonly dateLabel: string;
  readonly orders: readonly Order[];
}

/** The two numbers closing time hands off: one to the till, one to the mixer. */
export interface DayTotals {
  readonly revenueCents: number;
  readonly flourGramsUsed: number;
}
