import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const EXERCISES_DIR = path.join(ROOT, "exercises");

export type ExerciseType = "drill" | "kata";

export interface SolutionMeta {
  slug: string;
  title: string;
  tradeoff: string;
}

export interface Meta {
  id: string;
  title: string;
  type: ExerciseType;
  chapter: number;
  refactorings: string[];
  smells: string[];
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  prerequisites: string[];
  apiFrozen: boolean;
  providesTests: boolean;
  translations: string[];
  solutions: SolutionMeta[];
  coverageTargets?: string[];
  /** Exercise-specific things a reviewer should weigh hardest (docs/REVIEW.md). */
  reviewFocus?: string[];
  allowMultipleSolutions?: boolean;
  allowMultipleSolutionsReason?: string;
}

export interface Exercise {
  meta: Meta;
  /** Absolute path to the exercise directory. */
  dir: string;
  /** Path relative to the repository root, POSIX separators. */
  relDir: string;
  /** Solution slugs actually present on disk. */
  solutionDirs: string[];
}

function isExerciseDir(dir: string): boolean {
  return existsSync(path.join(dir, "meta.json"));
}

/** Walks exercises/ and returns every exercise, sorted by id. */
export function discoverExercises(): Exercise[] {
  if (!existsSync(EXERCISES_DIR)) return [];
  const found: Exercise[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const child = path.join(dir, entry.name);
      if (isExerciseDir(child)) {
        found.push(loadExercise(child));
      } else {
        walk(child);
      }
    }
  };

  walk(EXERCISES_DIR);
  return found.sort((a, b) => a.meta.id.localeCompare(b.meta.id));
}

export function loadExercise(dir: string): Exercise {
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8")) as Meta;
  const solutionsDir = path.join(dir, "solutions");
  const solutionDirs = existsSync(solutionsDir)
    ? readdirSync(solutionsDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : [];
  return {
    meta,
    dir,
    relDir: path.relative(ROOT, dir).split(path.sep).join("/"),
    solutionDirs,
  };
}

/**
 * Resolves whatever the user typed. `06-01`, `drill-06-01`, `extract-function` and
 * `Extract Function` all find the same exercise, so nobody has to memorise the id scheme.
 */
export function findExercise(exercises: Exercise[], query: string): Exercise | undefined {
  const needle = query.toLowerCase();
  const rules = [
    (exercise: Exercise) => exercise.meta.id === needle,
    (exercise: Exercise) => exercise.meta.id.endsWith(needle),
    (exercise: Exercise) => exercise.meta.id.includes(needle),
    (exercise: Exercise) => exercise.relDir.toLowerCase().includes(needle),
    (exercise: Exercise) => exercise.meta.title.toLowerCase().includes(needle),
  ];
  for (const rule of rules) {
    const hit = exercises.find(rule);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/** Looks an exercise up, or exits with the list - every command needs this. */
export function requireExercise(query: string | undefined): Exercise {
  const exercises = discoverExercises();
  const found = query === undefined ? undefined : findExercise(exercises, query);
  if (found !== undefined) return found;
  console.error(
    query === undefined ? "✗ which exercise?" : `✗ no exercise matches "${query}"`,
  );
  console.error("\nAvailable:");
  for (const exercise of exercises) {
    console.error(`  ${exercise.meta.id.padEnd(14)} ${exercise.meta.title}`);
  }
  process.exit(2);
}

function names(file: string): string[] {
  return JSON.parse(readFileSync(path.join(ROOT, "docs", file), "utf8")) as string[];
}

/** The 61 canonical refactoring names of the second edition. */
export function catalogNames(): string[] {
  return names("catalog-names.json");
}

/** The 24 smells of chapter 3. */
export function smellNames(): string[] {
  return names("smell-names.json");
}
