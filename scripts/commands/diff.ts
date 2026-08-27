import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { ROOT, requireExercise, type Exercise } from "../lib/exercises.ts";
import { runBin } from "../lib/run.ts";

/**
 * The gate. Comparing broken code with a solution teaches copying; comparing working
 * code with a solution teaches trade-offs.
 */
export function suiteIsGreen(exercise: Exercise): boolean {
  const suite = runBin("vitest", ["run", "--project", exercise.meta.id], { quiet: true });
  if (suite.status === 0) return true;
  process.stdout.write(suite.stdout);
  console.error(
    [
      "",
      "✗ Your suite is red.",
      "",
      "  The comparison only means something once the behaviour is preserved - that is",
      "  what refactoring is. Run `npm test` and come back.",
      "",
      "  (Nothing stops you reading solutions/ directly. This is a nudge, not a lock.)",
      "",
    ].join("\n"),
  );
  return false;
}

function listVariants(exercise: Exercise): void {
  console.log("More than one published solution:\n");
  for (const solution of exercise.meta.solutions) {
    console.log(`  ${solution.slug}\n    ${solution.title} - ${solution.tradeoff}\n`);
  }
  console.log(`Pick one:  ./rp diff ${exercise.meta.id} <solution>`);
  console.log(`Or all:    ./rp diff ${exercise.meta.id} --all`);
}

function diffCode(exercise: Exercise, solutionDir: string): void {
  // Code only - STEPS.md and WALKTHROUGH.md are the lesson and have their own flags.
  const mine = readdirSync(path.join(exercise.dir, "src")).filter((f) =>
    f.endsWith(".ts"),
  );
  const theirs = readdirSync(solutionDir).filter(
    (f) => f.endsWith(".ts") && !mine.includes(f),
  );
  for (const file of [...mine.sort(), ...theirs.sort()]) {
    const a = path.join(exercise.dir, "src", file);
    const b = path.join(solutionDir, file);
    spawnSync(
      "git",
      [
        "diff",
        "--no-index",
        "--color",
        "--",
        existsSync(a) ? path.relative(ROOT, a) : "/dev/null",
        existsSync(b) ? path.relative(ROOT, b) : "/dev/null",
      ],
      { cwd: ROOT, stdio: "inherit" },
    );
  }
}

export function diff(args: string[]): number {
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const [query, requested] = args.filter((arg) => !arg.startsWith("--"));
  const exercise = requireExercise(query);

  if (!suiteIsGreen(exercise)) return 1;
  console.log("✓ suite green - comparing\n");

  let slugs: string[];
  if (requested !== undefined) {
    slugs = [requested];
  } else if (flags.has("--all") || exercise.solutionDirs.length === 1) {
    slugs = exercise.solutionDirs;
  } else {
    listVariants(exercise);
    return 0;
  }

  for (const slug of slugs) {
    if (!exercise.solutionDirs.includes(slug)) {
      console.error(
        `✗ no solution "${slug}" (have: ${exercise.solutionDirs.join(", ")})`,
      );
      return 2;
    }
    const dir = path.join(exercise.dir, "solutions", slug);
    console.log(`\n${"=".repeat(72)}\n${slug}\n${"=".repeat(72)}\n`);

    if (flags.has("--walkthrough")) {
      process.stdout.write(readFileSync(path.join(dir, "WALKTHROUGH.md"), "utf8"));
    } else if (flags.has("--steps")) {
      process.stdout.write(readFileSync(path.join(dir, "STEPS.md"), "utf8"));
    } else {
      diffCode(exercise, dir);
    }
  }

  if (!flags.has("--steps") && !flags.has("--walkthrough")) {
    console.log(
      [
        "",
        "Expect noise: your names are not mine and neither is the order of the",
        "extractions. The comparison that teaches is the route, not the destination -",
        `try \`./rp diff ${exercise.meta.id} --steps\`, then \`--walkthrough\` for the why.`,
        "",
      ].join("\n"),
    );
  }
  return 0;
}
