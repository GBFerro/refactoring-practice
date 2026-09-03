import path from "node:path";
import { existsSync } from "node:fs";
import { defineConfig, type ViteUserConfig } from "vitest/config";
import { discoverExercises, ROOT } from "./scripts/lib/exercises.ts";

/**
 * One Vitest project per exercise, each with its own `@exercise` alias.
 *
 * Default run  -> tests execute against the exercise's `src/` (the challenge).
 * SOLUTIONS=1  -> one project per (exercise x solution variant), so the very same
 *                 test files also prove every published solution.
 */
const solutionsMode = process.env["SOLUTIONS"] === "1";
const exercises = discoverExercises().filter((exercise) =>
  existsSync(path.join(exercise.dir, "tests")),
);

const projects: ViteUserConfig[] = solutionsMode
  ? exercises.flatMap((exercise) =>
      exercise.solutionDirs.map((slug) => ({
        test: {
          name: `${exercise.meta.id}:${slug}`,
          root: exercise.dir,
          // `tests-fixed/` runs against solutions only. Some refactorings correct a real
          // bug, and the shared suite cannot pin the corrected behaviour: the same file
          // has to stay green against the buggy challenge too. This is where the proof
          // that the bug is gone lives.
          include: ["tests/**/*.spec.ts", "tests-fixed/**/*.spec.ts"],
        },
        resolve: {
          alias: { "@exercise": path.join(exercise.dir, "solutions", slug, "index.ts") },
        },
      })),
    )
  : exercises.map((exercise) => ({
      test: {
        name: exercise.meta.id,
        root: exercise.dir,
        include: ["tests/**/*.spec.ts"],
      },
      resolve: {
        alias: { "@exercise": path.join(exercise.dir, "src", "index.ts") },
      },
    }));

/** Katas that ship without tests declare the files their safety net must pin. */
const coverageThresholds = Object.fromEntries(
  discoverExercises()
    .filter((exercise) => exercise.meta.providesTests === false)
    .flatMap((exercise) =>
      (exercise.meta.coverageTargets ?? []).map((target) => [
        `${exercise.relDir}/${target}`,
        { branches: 100 },
      ]),
    ),
);

export default defineConfig({
  test: {
    projects,
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reportsDirectory: path.join(ROOT, "coverage"),
      include: ["exercises/**/src/**/*.ts"],
      thresholds: coverageThresholds,
    },
  },
});
