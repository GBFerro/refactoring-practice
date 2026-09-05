import type { InstrumentCategory, InstrumentInput, LendingStatus } from "./types";

/**
 * One physical instrument in Beckworth's lending library. Its category and its lending
 * status are both stored on the object, and both get read inside its own methods below.
 */
export class Instrument {
  private readonly instrumentName: string;
  private readonly category: InstrumentCategory;
  private status: LendingStatus;

  constructor(input: InstrumentInput) {
    this.instrumentName = input.name;
    this.category = input.category;
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

  rentalDepositCents(): number {
    switch (this.category) {
      case "string":
        return 5000;
      case "brass":
        return 12000;
      case "woodwind":
        return 9000;
      case "percussion":
        return 15000;
    }
  }

  maintenanceIntervalWeeks(): number {
    switch (this.category) {
      case "string":
        return 26;
      case "brass":
        return 12;
      case "woodwind":
        return 16;
      case "percussion":
        return 8;
    }
  }

  requiredAccessory(): string {
    switch (this.category) {
      case "string":
        return "rosin";
      case "brass":
        return "valve oil";
      case "woodwind":
        return "reeds";
      case "percussion":
        return "drum key";
    }
  }
}
