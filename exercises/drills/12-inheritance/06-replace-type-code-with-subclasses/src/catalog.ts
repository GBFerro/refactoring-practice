import { Instrument } from "./instrument";
import type { InstrumentInput } from "./types";

export function addInstrument(input: InstrumentInput): Instrument {
  return new Instrument(input);
}
