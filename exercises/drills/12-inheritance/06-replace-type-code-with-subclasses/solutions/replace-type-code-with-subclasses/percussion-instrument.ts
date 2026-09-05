import { Instrument } from "./instrument";

export class PercussionInstrument extends Instrument {
  rentalDepositCents(): number {
    return 15000;
  }

  maintenanceIntervalWeeks(): number {
    return 8;
  }

  requiredAccessory(): string {
    return "drum key";
  }
}
