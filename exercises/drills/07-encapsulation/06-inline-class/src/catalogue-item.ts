import { CatalogueKey } from "./catalogue-key";

/** One title on the shelf: its catalogue key, and enough to print a line about it. */
export interface CatalogueItemProps {
  readonly key: string;
  readonly title: string;
  readonly author: string;
}

export class CatalogueItem {
  readonly #key: CatalogueKey;
  readonly #title: string;
  readonly #author: string;

  constructor(props: CatalogueItemProps) {
    this.#key = new CatalogueKey(props.key);
    this.#title = props.title;
    this.#author = props.author;
  }

  catalogueKey(): string {
    return this.#key.value;
  }

  section(): string {
    return this.#key.value.split("-")[0] ?? "";
  }

  label(): string {
    return `${this.#title} — ${this.#author}`;
  }

  matchesKey(key: string): boolean {
    return this.#key.equals(new CatalogueKey(key));
  }
}
