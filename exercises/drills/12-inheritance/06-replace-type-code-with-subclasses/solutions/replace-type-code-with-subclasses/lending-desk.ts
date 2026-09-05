import type { Instrument } from "./instrument";

const NAME_WIDTH = 24;
const STATUS_WIDTH = 10;

/** The lending desk's sign-in sheet: one line per instrument, then how many are free. */
export function renderLendingBoard(instruments: readonly Instrument[]): string[] {
  if (instruments.length === 0) return ["No instruments in the library."];
  return [
    ...instruments.map(renderInstrumentLine),
    `Available: ${String(availableCount(instruments))} of ${String(instruments.length)}`,
  ];
}

function renderInstrumentLine(instrument: Instrument): string {
  const columns = [
    instrument.name().padEnd(NAME_WIDTH),
    statusLabel(instrument).padEnd(STATUS_WIDTH),
    formatCents(instrument.rentalDepositCents()),
    instrument.requiredAccessory(),
  ];
  return columns.join(" ").trimEnd();
}

function statusLabel(instrument: Instrument): string {
  if (instrument.isAvailableToLend()) return "Available";
  return instrument.isInRepair() ? "In repair" : "On loan";
}

function availableCount(instruments: readonly Instrument[]): number {
  return instruments.filter((instrument) => instrument.isAvailableToLend()).length;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
