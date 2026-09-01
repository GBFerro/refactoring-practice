/** One baked good the co-op sells, wholesale or over the counter. */
export interface Product {
  readonly id: string;
  readonly name: string;
  /** Ingredient-derived allergens, e.g. "gluten", "tree nuts", "dairy". */
  readonly allergens: readonly string[];
}

/** One line item on a wholesale order. */
export interface OrderItem {
  readonly product: Product;
  readonly quantity: number;
}

/** A wholesale order, placed by a cafe or grocer, waiting to go to production. */
export interface Order {
  readonly id: string;
  readonly customerName: string;
  readonly items: readonly OrderItem[];
  /** Allergens this particular order must avoid, per the customer's standing request. */
  readonly mustAvoidAllergens: readonly string[];
}
