import { ShelfCode } from "./shelf-code";

/**
 * Groups an item onto the correct reshelving cart. Carts are organised one per section,
 * so a wrong answer here means a book waits on the wrong cart until someone notices.
 */
export function cartSection(shelfCode: string): string {
  return ShelfCode.parse(shelfCode).section;
}
