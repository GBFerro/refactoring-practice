/**
 * Compares your work against the published solutions - but only once your suite is
 * green. Comparing broken code with a solution teaches copying; comparing working code
 * with a solution teaches trade-offs.
 *
 *   npm run diff -- drill-06-01
 *   npm run diff -- kata-02 polymorphism
 *   npm run diff -- kata-02 --all
 *   npm run diff -- kata-02 --steps
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { discoverExercises, findExercise, ROOT, type Exercise } from "./lib/exercises.ts";
import { runBin } from "./lib/run.ts";

const args = process.argv.slice(2);
const flags = new Set(args.filter((arg) => arg.startsWith("--")));
const positional = args.filter((arg) => !arg.startsWith("--"));
const [query, requestedSlug] = positional;

if (query === undefined) {
  console.error("usage: npm run diff -- <exercise> [solution] [--all] [--steps]");
  process.exit(2);
}

const exercise = findExercise(discoverExercises(), query);
if (exercise === undefined) {
  console.error(`✗ no exercise matches "${query}"`);
  process.exit(2);
}

// --- the gate -------------------------------------------------------------------
const suite = runBin("vitest", ["run", "--project", exercise.meta.id], { quiet: true });
if (suite.status !== 0) {
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
  process.exit(1);
}
console.log("✓ suite green - comparing\n");

// --- pick the variants ----------------------------------------------------------
function listVariants(target: Exercise): void {
  console.log("This exercise has more than one published solution:\n");
  for (const solution of target.meta.solutions) {
    console.log(`  ${solution.slug}`);
    console.log(`    ${solution.title} - ${solution.tradeoff}\n`);
  }
  console.log(`Pick one: npm run diff -- ${target.meta.id} <solution>`);
  console.log(`Or see them all: npm run diff -- ${target.meta.id} --all`);
}

let slugs: string[];
if (requestedSlug !== undefined) {
  slugs = [requestedSlug];
} else if (flags.has("--all") || exercise.solutionDirs.length === 1) {
  slugs = exercise.solutionDirs;
} else {
  listVariants(exercise);
  process.exit(0);
}

for (const slug of slugs) {
  if (!exercise.solutionDirs.includes(slug)) {
    console.error(`✗ no solution "${slug}" (have: ${exercise.solutionDirs.join(", ")})`);
    process.exit(2);
  }
  const solutionDir = path.join(exercise.dir, "solutions", slug);
  console.log(`\n${"=".repeat(72)}\n${slug}\n${"=".repeat(72)}\n`);

  if (flags.has("--steps")) {
    // The steps are the lesson; the final file is the by-product.
    process.stdout.write(readFileSync(path.join(solutionDir, "STEPS.md"), "utf8"));
    continue;
  }

  // Only the code: STEPS.md is the lesson and has its own flag.
  const sources = readdirSync(path.join(exercise.dir, "src"))
    .filter((file) => file.endsWith(".ts"))
    .sort();
  const extra = readdirSync(solutionDir)
    .filter((file) => file.endsWith(".ts") && !sources.includes(file))
    .sort();

  for (const file of [...sources, ...extra]) {
    const mine = path.join(exercise.dir, "src", file);
    const theirs = path.join(solutionDir, file);
    spawnSync(
      "git",
      [
        "diff",
        "--no-index",
        "--color",
        "--",
        existsSync(mine) ? path.relative(ROOT, mine) : "/dev/null",
        existsSync(theirs) ? path.relative(ROOT, theirs) : "/dev/null",
      ],
      { cwd: ROOT, stdio: "inherit" },
    );
  }
}

if (!flags.has("--steps")) {
  console.log(
    [
      "",
      "Expect noise: your names are not mine and neither is the order of the",
      "extractions. The comparison that teaches is the steps, not the destination -",
      `try \`npm run diff -- ${exercise.meta.id} --steps\` against your own \`git log --oneline\`.`,
      "",
    ].join("\n"),
  );
}
