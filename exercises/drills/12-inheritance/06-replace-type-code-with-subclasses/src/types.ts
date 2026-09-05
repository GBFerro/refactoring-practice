/** The four families Beckworth's lending desk stocks. Fixed the day an instrument
 * arrives - a cello does not become a trumpet later. */
export type InstrumentCategory = "string" | "brass" | "woodwind" | "percussion";

/** Where one physical instrument sits right now. This changes constantly as
 * instruments circulate through the desk - it is not a fact about the family. */
export type LendingStatus = "available" | "onLoan" | "inRepair";

/** What the front desk enters when a new instrument joins the library. */
export interface InstrumentInput {
  readonly name: string;
  readonly category: InstrumentCategory;
}
