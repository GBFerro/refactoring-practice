import { Instrument } from "./instrument";

export class StringInstrument extends Instrument {
  rentalDepositCents(): number {
    return 5000;
  }

  maintenanceIntervalWeeks(): number {
    return 26;
  }

  requiredAccessory(): string {
    return "rosin";
  }
}
