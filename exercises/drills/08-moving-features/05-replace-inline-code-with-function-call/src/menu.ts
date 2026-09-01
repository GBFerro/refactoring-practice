import type { Product } from "./order";

/**
 * True when none of the product's allergens are on a shopper's avoid-list. Backs the
 * "hide anything with my allergens" filter on the online ordering menu.
 */
export function productIsSafeFor(
  product: Product,
  avoidAllergens: readonly string[],
): boolean {
  return !product.allergens.some((allergen) => avoidAllergens.includes(allergen));
}

/** The products a shopper filtering the online menu by allergy can actually order. */
export function menuFor(
  products: readonly Product[],
  avoidAllergens: readonly string[],
): readonly Product[] {
  return products.filter((product) => productIsSafeFor(product, avoidAllergens));
}
