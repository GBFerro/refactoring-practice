/** Any instrument Beckworth Music School rents out to a student. */
export abstract class Instrument {
  readonly id: string;
  readonly name: string;

  protected constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
