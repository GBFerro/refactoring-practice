import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

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

export function findExercise(exercises: Exercise[], query: string): Exercise | undefined {
  return (
    exercises.find((e) => e.meta.id === query) ??
    exercises.find((e) => e.relDir.endsWith(`/${query}`)) ??
    exercises.find((e) => e.relDir.includes(query))
  );
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
