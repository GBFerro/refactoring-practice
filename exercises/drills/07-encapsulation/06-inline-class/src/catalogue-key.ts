/** Wraps a catalogue key. Nothing here a plain string could not already do. */
export class CatalogueKey {
  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: CatalogueKey): boolean {
    return this.value === other.value;
  }
}
