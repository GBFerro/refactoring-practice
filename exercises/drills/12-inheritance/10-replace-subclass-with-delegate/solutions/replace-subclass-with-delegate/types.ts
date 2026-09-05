/** How long the term runs. The one axis a class hierarchy used to model here. */
export type TermLength = "standard" | "intensive";

/** The other axis: what rate card the enrolled student is billed under. */
export type StudentCategory = "adult" | "child" | "concession";

/** What the front desk fills in when it prices a term for a student. */
export interface TermPricingRequest {
  readonly length: TermLength;
  readonly category: StudentCategory;
}
