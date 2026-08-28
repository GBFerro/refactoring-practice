/**
 * Structural validation of every exercise. This is the check that keeps the repository
 * honest as it grows past the point where anyone reviews it by eye.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  ROOT,
  catalogNames,
  discoverExercises,
  smellNames,
  type Exercise,
} from "../lib/exercises.ts";
export function validate(): number {
  function markdownFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.name === "node_modules" || entry.name === ".git") return [];
      if (entry.isDirectory()) return markdownFiles(full);
      return entry.name.endsWith(".md") ? [full] : [];
    });
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  const exercises = discoverExercises();
  const catalog = new Set(catalogNames());
  const smells = new Set(smellNames());
  const ids = new Set(exercises.map((exercise) => exercise.meta.id));

  function fail(exercise: Exercise, message: string): void {
    errors.push(`${exercise.relDir}: ${message}`);
  }

  function warn(exercise: Exercise, message: string): void {
    warnings.push(`${exercise.relDir}: ${message}`);
  }

  /** True when two folders hold exactly the same .ts files with the same bytes. */
  function identicalTrees(a: string, b: string): boolean {
    const listing = (dir: string): string[] =>
      existsSync(dir)
        ? readdirSync(dir)
            .filter((file) => file.endsWith(".ts"))
            .sort()
        : [];
    const [left, right] = [listing(a), listing(b)];
    if (left.length === 0 || left.join() !== right.join()) return false;
    return left.every(
      (file) =>
        readFileSync(path.join(a, file), "utf8") ===
        readFileSync(path.join(b, file), "utf8"),
    );
  }

  function requireFile(exercise: Exercise, relative: string): void {
    if (!existsSync(path.join(exercise.dir, relative))) {
      fail(exercise, `missing ${relative}`);
    }
  }

  const seen = new Set<string>();

  for (const exercise of exercises) {
    const { meta } = exercise;

    if (seen.has(meta.id)) fail(exercise, `duplicate id "${meta.id}"`);
    seen.add(meta.id);

    // --- required files -----------------------------------------------------------
    // English is mandatory, pt-BR is optional (see docs/DESIGN.md §3.1)
    requireFile(exercise, "README.en.md");
    requireFile(exercise, "src/index.ts");
    if (meta.providesTests) requireFile(exercise, "tests");

    if (!meta.translations.includes("en")) {
      fail(exercise, 'meta.translations must include "en"');
    }
    for (const lang of meta.translations) {
      requireFile(exercise, `README.${lang}.md`);
    }
    if (!meta.translations.includes("pt")) {
      warn(exercise, "no pt-BR translation yet");
    }

    // --- vocabulary ---------------------------------------------------------------
    for (const name of meta.refactorings) {
      if (!catalog.has(name)) {
        fail(exercise, `"${name}" is not a second-edition catalog name`);
      }
    }
    for (const smell of meta.smells) {
      if (!smells.has(smell)) fail(exercise, `"${smell}" is not a chapter 3 smell`);
    }
    for (const prerequisite of meta.prerequisites) {
      if (!ids.has(prerequisite))
        fail(exercise, `unknown prerequisite "${prerequisite}"`);
    }

    // --- solutions ----------------------------------------------------------------
    const declared = meta.solutions.map((solution) => solution.slug).sort();
    const onDisk = exercise.solutionDirs;
    if (declared.join() !== onDisk.join()) {
      fail(
        exercise,
        `meta.solutions [${declared.join(", ")}] does not match solutions/ on disk [${onDisk.join(", ")}]`,
      );
    }
    for (const slug of onDisk) {
      // An exercise whose challenge already IS the solution passes every other check in
      // this repository and teaches nothing. It is the failure mode of writing the clean
      // version first and being interrupted before un-refactoring it.
      if (
        identicalTrees(
          path.join(exercise.dir, "src"),
          path.join(exercise.dir, "solutions", slug),
        )
      ) {
        fail(
          exercise,
          `src/ is identical to solutions/${slug}/ - there is nothing to refactor`,
        );
      }
      requireFile(exercise, `solutions/${slug}/index.ts`);
      requireFile(exercise, `solutions/${slug}/STEPS.md`);
      requireFile(exercise, `solutions/${slug}/WALKTHROUGH.md`);
    }
    if (onDisk.length === 0) fail(exercise, "no solutions/");

    // The §4.3 invariant: mechanics has one right move; diagnosis has trade-offs.
    if (
      meta.type === "drill" &&
      onDisk.length > 1 &&
      meta.allowMultipleSolutions !== true
    ) {
      fail(
        exercise,
        `a drill has ${String(onDisk.length)} solutions - it is a kata in disguise, or set allowMultipleSolutions with a reason`,
      );
    }
    if (meta.allowMultipleSolutions === true && !meta.allowMultipleSolutionsReason) {
      fail(exercise, "allowMultipleSolutions requires allowMultipleSolutionsReason");
    }
    if (meta.type === "kata" && onDisk.length < 2) {
      warn(exercise, "a kata with a single solution is a large drill (§4.3)");
    }
    for (const solution of meta.solutions) {
      if (!solution.tradeoff)
        fail(exercise, `solution "${solution.slug}" has no tradeoff`);
    }

    // --- coverage targets ---------------------------------------------------------
    if (meta.providesTests && meta.coverageTargets) {
      fail(exercise, "coverageTargets only applies when providesTests is false");
    }
    if (!meta.providesTests && (meta.coverageTargets ?? []).length === 0) {
      fail(exercise, "an exercise without tests must declare coverageTargets");
    }
    for (const target of meta.coverageTargets ?? []) {
      requireFile(exercise, target);
    }
  }

  // Cross-links are most of what holds this repository together, and a broken one is
  // invisible until a reader clicks it. Checking them is nearly free.
  const linkPattern = /\]\((\.[^)#\s]+\.md)\)/gu;
  for (const file of markdownFiles(ROOT)) {
    const body = readFileSync(file, "utf8");
    const fenced = body.replace(/```[\s\S]*?```/gu, "");
    for (const match of fenced.matchAll(linkPattern)) {
      const target = path.resolve(path.dirname(file), match[1] ?? "");
      if (!existsSync(target)) {
        errors.push(`${path.relative(ROOT, file)}: broken link to ${match[1] ?? ""}`);
      }
    }
  }

  for (const warning of warnings) console.warn(`! ${warning}`);
  if (errors.length > 0) {
    for (const error of errors) console.error(`✗ ${error}`);
    console.error(
      `\n✗ ${String(errors.length)} problem(s) in ${String(exercises.length)} exercise(s)`,
    );
    return 1;
  }
  console.log(
    `✓ ${String(exercises.length)} exercise(s) valid${warnings.length > 0 ? `, ${String(warnings.length)} warning(s)` : ""}`,
  );

  return 0;
}
