import { readFileSync } from "node:fs";
import path from "node:path";
import { requireExercise } from "../lib/exercises.ts";
import { runBin } from "../lib/run.ts";

/** Prints the brief and watches just this exercise. */
export function start(args: string[]): number {
  const exercise = requireExercise(args.find((arg) => !arg.startsWith("--")));
  const lang =
    args.includes("--pt") && exercise.meta.translations.includes("pt") ? "pt" : "en";

  console.log(readFileSync(path.join(exercise.dir, `README.${lang}.md`), "utf8"));
  console.log(
    `${"-".repeat(72)}\nWatching ${exercise.meta.id}. Edit ${exercise.relDir}/src\n`,
  );

  return runBin("vitest", ["--project", exercise.meta.id]).status ?? 0;
}
