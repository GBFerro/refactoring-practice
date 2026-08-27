/**
 * Runs the strict profile over every published solution.
 *
 * oxlint does not expand `**` itself, so the list of solution directories is built from
 * the exercises rather than from a shell glob.
 */
import path from "node:path";
import { ROOT, discoverExercises } from "../lib/exercises.ts";
import { runBin } from "../lib/run.ts";
export function lintSolutions(): number {
  const targets = discoverExercises().flatMap((exercise) =>
    exercise.solutionDirs.map((slug) =>
      path.relative(ROOT, path.join(exercise.dir, "solutions", slug)),
    ),
  );

  if (targets.length === 0) {
    console.log("no solutions to lint");
    return 0;
  }

  const result = runBin("oxlint", ["-c", ".oxlintrc.strict.json", ...targets]);
  if (result.status !== 0) {
    console.error(
      `\n✗ ${String(targets.length)} solution folder(s) checked - the strict profile is the published "done when" bar (docs/DESIGN.md §6.1)`,
    );
    return result.status ?? 1;
  }
  console.log(`✓ ${String(targets.length)} solution folder(s) meet the strict bar`);

  return 0;
}
