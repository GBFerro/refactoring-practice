import { Instrument } from "./instrument";

export interface StringInstrumentProps {
  readonly id: string;
  readonly name: string;
  readonly insuredValueCents: number;
  /** 1 (student-grade timber) to 5 (master-grade timber): the workshop's body-wood tier. */
  readonly gradeLevel: number;
}

/** A string instrument: violins, violas, cellos. */
export class StringInstrument extends Instrument {
  readonly gradeLevel: number;

  constructor(props: StringInstrumentProps) {
    super(props.id, props.name, props.insuredValueCents);
    this.gradeLevel = props.gradeLevel;
  }

  restorationCostMultiplier(): number {
    return 1 + this.gradeLevel * 0.1;
  }
}
