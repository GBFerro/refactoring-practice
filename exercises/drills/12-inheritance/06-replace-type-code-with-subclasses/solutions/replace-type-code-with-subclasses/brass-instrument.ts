import { Instrument } from "./instrument";

export class BrassInstrument extends Instrument {
  rentalDepositCents(): number {
    return 12000;
  }

  maintenanceIntervalWeeks(): number {
    return 12;
  }

  requiredAccessory(): string {
    return "valve oil";
  }
}
