/**
 * Every item in the Marlowe Community Library has a shelf code — a string such as
 * "NF-770-A" naming its section, its class number, and the shelf letter within that
 * class. These three functions each need a different piece of that code, for a different
 * part of the system: the reshelving cart, the spine label, and the monthly report.
 */
export { cartSection } from "./cart-section";
export { spineLabelSection } from "./spine-label";
export { sectionTally } from "./section-tally";
