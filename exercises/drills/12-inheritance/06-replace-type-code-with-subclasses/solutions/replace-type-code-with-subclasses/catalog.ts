import { BrassInstrument } from "./brass-instrument";
import { Instrument } from "./instrument";
import { PercussionInstrument } from "./percussion-instrument";
import { StringInstrument } from "./string-instrument";
import type { InstrumentInput } from "./types";
import { WoodwindInstrument } from "./woodwind-instrument";

/** The one place left in this module that switches on InstrumentCategory. */
export function addInstrument(input: InstrumentInput): Instrument {
  switch (input.category) {
    case "string":
      return new StringInstrument(input.name);
    case "brass":
      return new BrassInstrument(input.name);
    case "woodwind":
      return new WoodwindInstrument(input.name);
    case "percussion":
      return new PercussionInstrument(input.name);
  }
}
