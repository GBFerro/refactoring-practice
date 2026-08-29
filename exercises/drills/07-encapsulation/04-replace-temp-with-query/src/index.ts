/**
 * The Marlowe Community Library's monthly billing job walks every loan and prints one
 * notice line per item: how late it is, whether the grace period covers it, and what is
 * owed once the item's daily rate and the per-loan cap are applied.
 */
export { overdueNotice } from "./overdue-notice";
export type { Loan } from "./loan";
