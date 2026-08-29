import { ShelfCode } from "./shelf-code";

/** The section name printed on the spine label sticker. */
export function spineLabelSection(shelfCode: string): string {
  return ShelfCode.parse(shelfCode).section;
}
