import type { CatalogueEntry } from "./catalogue";

interface RankedEntry {
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
  const ranked: RankedEntry[] = [];

  for (const entry of catalogue) {
    const rank = firstMatchingWord(entry.title, query);
    if (rank !== -1) {
      insertByRank(ranked, { entry, rank });
    }
  }

  return ranked.map((match) => match.entry);
}

/**
 * Inserts `candidate` after every already-ranked entry whose rank is no worse than its own,
 * so two entries tied on rank keep the order the catalogue gave them.
 */
function insertByRank(ranked: RankedEntry[], candidate: RankedEntry): void {
  let position = 0;
  while (position < ranked.length) {
    const current = ranked[position];
    if (current === undefined || current.rank > candidate.rank) break;
    position++;
  }
  ranked.splice(position, 0, candidate);
}

/**
 * Index of the first word in `title` that starts with `query`, or -1 when none does. Splits
 * on spaces by hand, one character at a time, so a run of several spaces never produces an
 * empty "word".
 */
function firstMatchingWord(title: string, query: string): number {
  const lowerQuery = query.toLowerCase();
  let wordIndex = 0;
  let wordStart = 0;

  for (let position = 0; position <= title.length; position++) {
    if (position !== title.length && title[position] !== " ") continue;

    if (position > wordStart) {
      const word = title.slice(wordStart, position);
      if (matchesPrefix(word, lowerQuery)) return wordIndex;
      wordIndex++;
    }
    wordStart = position + 1;
  }

  return -1;
}

/** True when every character of `lowerQuery` matches the same position in `word`. */
function matchesPrefix(word: string, lowerQuery: string): boolean {
  if (lowerQuery.length > word.length) return false;
  for (let i = 0; i < lowerQuery.length; i++) {
    const wordChar = word[i];
    if (wordChar === undefined || wordChar.toLowerCase() !== lowerQuery[i]) return false;
  }
  return true;
}
