import { Instrument } from "./instrument";

export interface WindInstrumentProps {
  readonly id: string;
  readonly name: string;
  readonly insuredValueCents: number;
  /** 1 (student) to 5 (advanced): the playing grade a student needs before this suits them. */
  readonly gradeLevel: number;
}

/** A wind or brass instrument: clarinets, flutes, trumpets. */
export class WindInstrument extends Instrument {
  readonly gradeLevel: number;

  constructor(props: WindInstrumentProps) {
    super(props.id, props.name, props.insuredValueCents);
    this.gradeLevel = props.gradeLevel;
  }

  isSuitableFor(studentGrade: number): boolean {
    return studentGrade >= this.gradeLevel;
  }
}
