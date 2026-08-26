/**
 * Prints an exercise brief and drops you into the watcher for just that exercise.
 *
 *   npm start -- drill-06-01
 *   npm start -- drill-06-01 --pt
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { discoverExercises, findExercise } from "./lib/exercises.ts";
import { runBin } from "./lib/run.ts";

const args = process.argv.slice(2);
const wantsPt = args.includes("--pt");
const query = args.find((arg) => !arg.startsWith("--"));

const exercises = discoverExercises();

if (query === undefined) {
  console.log("Pick an exercise:\n");
  for (const exercise of exercises) {
    console.log(`  ${exercise.meta.id.padEnd(14)} ${exercise.meta.title}`);
  }
  process.exit(0);
}

const exercise = findExercise(exercises, query);
if (exercise === undefined) {
  console.error(`✗ no exercise matches "${query}"`);
  process.exit(2);
}

const lang = wantsPt && exercise.meta.translations.includes("pt") ? "pt" : "en";
console.log(readFileSync(path.join(exercise.dir, `README.${lang}.md`), "utf8"));
console.log(
  `${"-".repeat(72)}\nWatching ${exercise.meta.id}. Edit ${exercise.relDir}/src.\n`,
);

const result = runBin("vitest", ["--project", exercise.meta.id]);
process.exit(result.status ?? 0);
