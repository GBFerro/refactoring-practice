import type { LendingStatus } from "./types";

/**
 * One physical instrument in Beckworth's lending library. What family it belongs to is
 * decided once, by which concrete subclass gets constructed; what it costs a borrower
 * and what upkeep it needs both follow from that. Its lending status is a different
 * kind of fact entirely - it changes every time the instrument is checked out, returned,
 * or sent for repair - so it stays a plain field here on the shared base, not a fourth
 * subclass axis.
 */
export abstract class Instrument {
  private readonly instrumentName: string;
  private status: LendingStatus;

  constructor(name: string) {
    this.instrumentName = name;
    this.status = "available";
  }

  name(): string {
    return this.instrumentName;
  }

  isAvailableToLend(): boolean {
    return this.status === "available";
  }

  isInRepair(): boolean {
    return this.status === "inRepair";
  }

  checkOut(): void {
    this.status = "onLoan";
  }

  returnFromLoan(damaged: boolean): void {
    this.status = damaged ? "inRepair" : "available";
  }

  clearFromRepair(): void {
    this.status = "available";
  }

  abstract rentalDepositCents(): number;
  abstract maintenanceIntervalWeeks(): number;
  abstract requiredAccessory(): string;
}
