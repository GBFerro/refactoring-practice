import { Instrument } from "./instrument";

export class WoodwindInstrument extends Instrument {
  rentalDepositCents(): number {
    return 9000;
  }

  maintenanceIntervalWeeks(): number {
    return 16;
  }

  requiredAccessory(): string {
    return "reeds";
  }
}
