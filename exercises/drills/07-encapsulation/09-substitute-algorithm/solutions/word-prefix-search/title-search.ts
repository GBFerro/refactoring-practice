import type { CatalogueEntry } from "./catalogue";

interface Match {
  readonly entry: CatalogueEntry;
  readonly rank: number;
}

/**
 * Every entry whose title has a word starting with `query` (case-insensitive), ordered by
 * how early that word falls in the title. Entries tied on that rank keep the order they
 * hold in `catalogue`.
 */
export function searchTitles(
  catalogue: readonly CatalogueEntry[],
  query: string,
): CatalogueEntry[] {
  return rankedMatches(catalogue, query)
    .sort((a, b) => a.rank - b.rank)
    .map((match) => match.entry);
}

function rankedMatches(catalogue: readonly CatalogueEntry[], query: string): Match[] {
  return catalogue
    .map((entry) => ({ entry, rank: firstMatchingWord(entry.title, query) }))
    .filter((match) => match.rank !== -1);
}

function firstMatchingWord(title: string, query: string): number {
  const lowerQuery = query.toLowerCase();
  return title
    .split(/\s+/u)
    .findIndex((word) => word.toLowerCase().startsWith(lowerQuery));
}
