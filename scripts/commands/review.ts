import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ROOT, requireExercise, type Exercise } from "../lib/exercises.ts";
import { suiteIsGreen } from "./diff.ts";

/**
 * Assembles everything a reviewer - human or AI - needs to judge an attempt, and nothing
 * that would let them judge it against the wrong thing. The published solutions are
 * deliberately NOT part of the packet: more than one decomposition is correct, and a
 * reviewer holding an answer key will grade similarity instead of quality.
 */
function sourceOf(exercise: Exercise, folder: string): string {
  const dir = path.join(exercise.dir, folder);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".ts"))
    .sort()
    .map((file) => {
      const body = readFileSync(path.join(dir, file), "utf8").trimEnd();
      return `#### \`${folder}/${file}\`\n\n\`\`\`ts\n${body}\n\`\`\``;
    })
    .join("\n\n");
}

function historyOf(exercise: Exercise): string {
  const log = spawnSync("git", ["log", "--oneline", "--", `${exercise.relDir}/src`], {
    cwd: ROOT,
    encoding: "utf8",
  });
  const text = (log.stdout ?? "").trim();
  return text.length > 0 ? text : "(no commits touching this exercise yet)";
}

export function review(args: string[]): number {
  const exercise = requireExercise(args.find((arg) => !arg.startsWith("--")));

  if (!suiteIsGreen(exercise)) {
    console.error(
      [
        "  A review of a red suite has only one finding, and you already have it:",
        "  the behaviour changed. Nothing else is worth an opinion yet.",
        "",
      ].join("\n"),
    );
    return 1;
  }

  const focus = exercise.meta.reviewFocus ?? [];
  const packet = [
    readFileSync(path.join(ROOT, "docs", "REVIEW.md"), "utf8").trimEnd(),
    "",
    "---",
    "",
    `# The attempt: ${exercise.meta.title} (${exercise.meta.id})`,
    "",
    `**Target refactoring(s):** ${exercise.meta.refactorings.join(", ")}`,
    `**Declared smells:** ${exercise.meta.smells.join(", ")}`,
    "",
    ...(focus.length > 0
      ? [
          "## What to look at hardest in this exercise",
          "",
          ...focus.map((line) => `- ${line}`),
          "",
        ]
      : []),
    "## The brief the practitioner was given",
    "",
    readFileSync(path.join(exercise.dir, "README.en.md"), "utf8").trimEnd(),
    "",
    "## The safety net (not written by the practitioner, and unchanged)",
    "",
    sourceOf(exercise, "tests"),
    "",
    "## The code as it stands now",
    "",
    sourceOf(exercise, "src"),
    "",
    "## The route they took",
    "",
    "```",
    historyOf(exercise),
    "```",
    "",
  ].join("\n");

  if (args.includes("--out")) {
    const file = path.join(process.cwd(), `review-${exercise.meta.id}.md`);
    writeFileSync(file, packet);
    console.log(
      `✓ wrote ${path.relative(process.cwd(), file)} - paste it to your reviewer`,
    );
    return 0;
  }
  process.stdout.write(packet);
  return 0;
}
