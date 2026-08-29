const SHELF_CODE = /^([A-Z]{2,3})-([0-9]+(?:\.[0-9]+)?)(?:-([A-Z]))?$/u;

/**
 * A validated shelf code: SECTION-CLASS[-LETTER], e.g. "NF-770-A", or "FIC-813" for an
 * item that has been catalogued but has not reached its shelf yet.
 */
export class ShelfCode {
  readonly raw: string;
  readonly section: string;
  readonly classNumber: string;
  readonly shelfLetter: string | null;

  private constructor(raw: string, match: RegExpExecArray) {
    this.raw = raw;
    this.section = match[1] ?? "";
    this.classNumber = match[2] ?? "";
    this.shelfLetter = match[3] ?? null;
  }

  static parse(raw: string): ShelfCode {
    const match = SHELF_CODE.exec(raw);
    if (match === null) {
      throw new Error(`not a shelf code: "${raw}"`);
    }
    return new ShelfCode(raw, match);
  }
}
