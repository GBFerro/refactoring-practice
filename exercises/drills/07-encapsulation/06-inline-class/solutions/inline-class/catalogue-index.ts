import type { CatalogueItem } from "./catalogue-item";

/** The shelf index: every item, grouped by section, sorted by key within it. */
export function renderCatalogueIndex(items: readonly CatalogueItem[]): string {
  if (items.length === 0) return "No items catalogued.";
  const sections = groupBySection(items);
  const lines: string[] = [];
  for (const section of [...sections.keys()].sort()) {
    lines.push(section, ...renderSection(sections.get(section) ?? []));
  }
  return lines.join("\n");
}

export function findByKey(
  items: readonly CatalogueItem[],
  key: string,
): CatalogueItem | undefined {
  return items.find((item) => item.matchesKey(key));
}

function groupBySection(items: readonly CatalogueItem[]): Map<string, CatalogueItem[]> {
  const sections = new Map<string, CatalogueItem[]>();
  for (const item of items) {
    const bucket = sections.get(item.section()) ?? [];
    bucket.push(item);
    sections.set(item.section(), bucket);
  }
  return sections;
}

function renderSection(items: readonly CatalogueItem[]): string[] {
  return [...items]
    .sort((a, b) => a.catalogueKey().localeCompare(b.catalogueKey()))
    .map((item) => `  ${item.catalogueKey()}  ${item.label()}`);
}
