/**
 * Type-checks the repository: the root project (scripts + vitest config) plus one
 * project per exercise, because each exercise resolves `@exercise` to its own `src/`.
 *
 * One `tsc` per exercise is the honest way to check an alias that differs per folder.
 * It is linear in the number of exercises; if that ever hurts, the fix is project
 * references and `tsc -b`, not fewer checks.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { ROOT, discoverExercises } from "../lib/exercises.ts";
export function typecheck(): number {
  const projects = [ROOT, ...discoverExercises().map((exercise) => exercise.dir)];
  const failed: string[] = [];

  for (const project of projects) {
    const label = path.relative(ROOT, project) || ".";
    const result = spawnSync(
      process.execPath,
      [
        path.join(ROOT, "node_modules", "typescript", "lib", "tsc.js"),
        "--noEmit",
        "-p",
        project,
      ],
      { cwd: ROOT, encoding: "utf8" },
    );
    if (result.status !== 0) {
      failed.push(label);
      console.error(`✗ ${label}`);
      process.stderr.write(result.stdout + result.stderr);
    }
  }

  if (failed.length > 0) {
    console.error(
      `\n✗ ${String(failed.length)} of ${String(projects.length)} projects failed`,
    );
    return 1;
  }
  console.log(`✓ ${String(projects.length)} projects type-check`);

  return 0;
}
