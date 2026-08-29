/**
 * The section name printed on the spine label sticker. A shelf code's section is always
 * the text before the first hyphen, however long it runs, so splitting on "-" and taking
 * the first piece works regardless of the section's length.
 */
export function spineLabelSection(shelfCode: string): string {
  const [section] = shelfCode.split("-");
  return section ?? shelfCode;
}
