/**
 * `rp` - the whole repository in one short command.
 *
 *   ./rp                      list the exercises
 *   ./rp start 06-01          print the brief and watch this exercise
 *   ./rp diff 06-01           compare with the solutions (refuses while red)
 *   ./rp review 06-01         build a review packet for an AI reviewer
 *   ./rp names 06-01          advisory pass over the names you chose
 *   ./rp new --chapter 10 ... scaffold an exercise
 *   ./rp index [--check]      regenerate the READMEs and indexes
 *   ./rp validate             structural checks
 *   ./rp check                everything CI runs
 */
import process from "node:process";
import { discoverExercises } from "./lib/exercises.ts";
import { runBin } from "./lib/run.ts";
import { buildIndex } from "./commands/index-build.ts";
import { checkNames } from "./commands/names.ts";
import { diff } from "./commands/diff.ts";
import { lintSolutions } from "./commands/lint-solutions.ts";
import { newExercise } from "./commands/new.ts";
import { review } from "./commands/review.ts";
import { start } from "./commands/start.ts";
import { typecheck } from "./commands/typecheck.ts";
import { validate } from "./commands/validate.ts";

function list(): number {
  const exercises = discoverExercises();
  if (exercises.length === 0) {
    console.log("No exercises yet. Start one with `./rp new`.");
    return 0;
  }
  console.log("Exercises:\n");
  for (const exercise of exercises) {
    const solutions = exercise.solutionDirs.length;
    console.log(
      `  ${exercise.meta.id.padEnd(14)} ${exercise.meta.title.padEnd(34)} ${exercise.meta.refactorings.join(", ")}` +
        (solutions > 1 ? `  (${String(solutions)} solutions)` : ""),
    );
  }
  console.log("\n  ./rp start <id>   to begin");
  return 0;
}

/** Everything CI runs, in the order that fails fastest. */
function check(): number {
  const steps: Array<[string, () => number]> = [
    ["validate", validate],
    ["index --check", () => buildIndex(["--check"])],
    ["lint", () => runBin("oxlint", []).status ?? 0],
    ["lint:solutions", lintSolutions],
    ["format", () => runBin("oxfmt", ["--check", "."], { quiet: true }).status ?? 0],
    ["typecheck", typecheck],
    ["test", () => runBin("vitest", ["run"], { quiet: true }).status ?? 0],
    [
      "test:solutions",
      () =>
        runBin("vitest", ["run"], { quiet: true, env: { SOLUTIONS: "1" } }).status ?? 0,
    ],
    [
      "coverage",
      () => runBin("vitest", ["run", "--coverage"], { quiet: true }).status ?? 0,
    ],
  ];
  for (const [label, run] of steps) {
    const code = run();
    if (code !== 0) {
      console.error(`\n✗ ${label} failed`);
      return code;
    }
    console.log(`✓ ${label}`);
  }
  console.log("\n✓ all checks pass");
  return 0;
}

const [command = "", ...args] = process.argv.slice(2);

const commands: Record<string, (rest: string[]) => number> = {
  "": list,
  list,
  start,
  diff,
  review,
  names: checkNames,
  new: newExercise,
  index: buildIndex,
  validate,
  typecheck,
  check,
};

const run = commands[command];
if (run === undefined) {
  console.error(`✗ unknown command "${command}"`);
  console.error(`  try: ${Object.keys(commands).filter(Boolean).join(", ")}`);
  process.exit(2);
}
process.exit(run(args));
