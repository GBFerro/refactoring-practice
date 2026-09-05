/** Any instrument Beckworth Music School rents out to a student. */
export abstract class Instrument {
  readonly id: string;
  readonly name: string;
  readonly insuredValueCents: number;

  protected constructor(id: string, name: string, insuredValueCents: number) {
    this.id = id;
    this.name = name;
    this.insuredValueCents = insuredValueCents;
  }
}
