/**
 * Groups an item onto the correct reshelving cart. Carts are organised one per section,
 * so a wrong answer here means a book waits on the wrong cart until someone notices.
 *
 * Shelf codes look like "NF-770-A" - section, class number, shelf letter - and every
 * section in the catalogue used to be exactly two letters, so slicing the first two
 * characters off the raw code was a one-line way to get it.
 */
export function cartSection(shelfCode: string): string {
  return shelfCode.slice(0, 2);
}
