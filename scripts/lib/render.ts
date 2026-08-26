import type { Exercise } from "./exercises.ts";

export const MODULES: ReadonlyArray<{ chapter: number; title: string }> = [
  { chapter: 6, title: "A First Set of Refactorings" },
  { chapter: 7, title: "Encapsulation" },
  { chapter: 8, title: "Moving Features" },
  { chapter: 9, title: "Organizing Data" },
  { chapter: 10, title: "Simplifying Conditional Logic" },
  { chapter: 11, title: "Refactoring APIs" },
  { chapter: 12, title: "Dealing with Inheritance" },
];

export function difficultyDots(level: number): string {
  return "●".repeat(level) + "○".repeat(Math.max(0, 3 - level));
}

export function translationFlags(exercise: Exercise): string {
  const has = new Set(exercise.meta.translations);
  return [has.has("en") ? "🌐" : "", has.has("pt") ? "🇧🇷" : ""].join("").trim() || "—";
}

export function exerciseLink(
  exercise: Exercise,
  lang: "en" | "pt",
  prefix = "./",
): string {
  return `[${exercise.meta.title}](${prefix}${exercise.relDir}/README.${lang}.md)`;
}

/** A markdown table, padded so the raw file is readable too. */
export function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => (row[column] ?? "").length)),
  );
  const line = (cells: string[]): string =>
    `| ${cells.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join(" | ")} |`;
  return [
    line(headers),
    `| ${widths.map((width) => "-".repeat(width)).join(" | ")} |`,
    ...rows.map(line),
  ].join("\n");
}
