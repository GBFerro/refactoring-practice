/** One title on the shelf: its catalogue key, and enough to print a line about it. */
export interface CatalogueItemProps {
  readonly key: string;
  readonly title: string;
  readonly author: string;
}

export class CatalogueItem {
  readonly #key: string;
  readonly #title: string;
  readonly #author: string;

  constructor(props: CatalogueItemProps) {
    this.#key = props.key;
    this.#title = props.title;
    this.#author = props.author;
  }

  catalogueKey(): string {
    return this.#key;
  }

  section(): string {
    return this.#key.split("-")[0] ?? "";
  }

  label(): string {
    return `${this.#title} — ${this.#author}`;
  }

  matchesKey(key: string): boolean {
    return this.#key === key;
  }
}
