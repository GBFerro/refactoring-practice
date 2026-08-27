/**
 * Scaffolds an exercise so the six required files always exist and the metadata is
 * valid from the first commit.
 *
 *   npm run new -- --type drill --chapter 10 --title "Decompose Conditional" \
 *                  --refactoring "Decompose Conditional" --smell "Long Function"
 *
 * Write order matters, and the template nudges you towards it (see CONTRIBUTING.md):
 * domain -> clean code -> tests -> un-refactor into the challenge -> STEPS.md.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  EXERCISES_DIR,
  catalogNames,
  discoverExercises,
  smellNames,
} from "../lib/exercises.ts";
import { MODULES } from "../lib/render.ts";
export function newExercise(args: string[]): number {
  function flag(name: string): string | undefined {
    const index = args.indexOf(`--${name}`);
    return index === -1 ? undefined : args[index + 1];
  }

  function slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-|-$/gu, "");
  }

  const type = flag("type") ?? "drill";
  const chapter = Number(flag("chapter"));
  const title = flag("title");
  const refactoring = flag("refactoring") ?? title;
  const smell = flag("smell") ?? "Long Function";

  if (
    title === undefined ||
    Number.isNaN(chapter) ||
    (type !== "drill" && type !== "kata")
  ) {
    console.error(
      'usage: npm run new -- --type drill|kata --chapter <n> --title "..." [--refactoring "..."] [--smell "..."]',
    );
    return 2;
  }
  if (refactoring !== undefined && !catalogNames().includes(refactoring)) {
    console.error(`✗ "${refactoring}" is not a second-edition catalog name`);
    return 2;
  }
  if (!smellNames().includes(smell)) {
    console.error(`✗ "${smell}" is not a chapter 3 smell`);
    return 2;
  }

  const module = MODULES.find((candidate) => candidate.chapter === chapter);
  const moduleDir =
    type === "drill"
      ? path.join(
          EXERCISES_DIR,
          "drills",
          `${String(chapter).padStart(2, "0")}-${slugify(module?.title ?? "module")}`,
        )
      : path.join(EXERCISES_DIR, "katas");

  const siblings = discoverExercises().filter(
    (one) => one.meta.chapter === chapter && one.meta.type === type,
  );
  const number = String(siblings.length + 1).padStart(2, "0");
  const dir = path.join(moduleDir, `${number}-${slugify(title)}`);
  const id = `${type}-${String(chapter).padStart(2, "0")}-${number}`;
  const solutionSlug = slugify(refactoring ?? title);

  if (existsSync(dir)) {
    console.error(`✗ ${dir} already exists`);
    return 2;
  }

  for (const sub of ["src", "tests", `solutions/${solutionSlug}`]) {
    mkdirSync(path.join(dir, sub), { recursive: true });
  }

  const meta = {
    id,
    title,
    type,
    chapter,
    refactorings: [refactoring],
    smells: [smell],
    difficulty: 1,
    estimatedMinutes: 20,
    prerequisites: [],
    apiFrozen: true,
    providesTests: true,
    translations: ["en"],
    solutions: [
      { slug: solutionSlug, title: "TODO", tradeoff: "TODO - what does this one cost?" },
    ],
    reviewFocus: ["TODO - what should a reviewer weigh hardest here? (docs/REVIEW.md)"],
  };

  const brief = [
    "[🌐 English](./README.en.md)",
    "",
    `# ${title}`,
    "",
    `\`Chapter ${String(chapter)}\` · \`${refactoring ?? ""}\` · \`●○○\` · ~20 min`,
    "",
    "## Context",
    "",
    "TODO - two to four sentences of domain. Why does this code exist?",
    "",
    "## The smell",
    "",
    `**${smell}** - TODO: and *why* it hurts here.`,
    "",
    "## The target",
    "",
    `**${refactoring ?? ""}**. TODO.`,
    "",
    "## Done when",
    "",
    "- TODO - objective and checkable, not a matter of taste.",
    "- `npm test` was green after every step along the way.",
    "",
    "## Hints",
    "",
    "<details>",
    "<summary>TODO</summary>",
    "",
    "TODO",
    "</details>",
    "",
    "## Reading",
    "",
    `*Refactoring*, 2nd edition - chapter ${String(chapter)}, *${refactoring ?? ""}*.`,
    "",
  ].join("\n");

  const walkthrough = [
    `# Walkthrough — ${solutionSlug}`,
    "",
    "STEPS.md is the route; this is the commentary. Why each move, why in that order,",
    "what each name had to earn, and where you went wrong first.",
    "",
    "## Before anything: read the shape",
    "",
    "TODO - what are the blocks? What appears twice?",
    "",
    "## Step 1 — TODO",
    "",
    "```ts",
    "// before",
    "// after",
    "```",
    "",
    "TODO - why this move, why now.",
    "",
    "**On the name.** TODO - which of the four questions in docs/NAMING.md decided it,",
    "and which candidate you rejected.",
    "",
    "## What it cost",
    "",
    "TODO - be honest. A walkthrough that presents every decision as obvious is lying.",
    "",
    "## If you took a different route",
    "",
    "TODO - list the defensible alternatives, and the one or two things that are not",
    "a matter of taste.",
    "",
  ].join("\n");

  const steps = [
    `# Solution — ${solutionSlug}`,
    "",
    "## When to choose this",
    "",
    "TODO",
    "",
    "## What it costs",
    "",
    "TODO - a variant that cannot name its own cost is not ready (§4.3).",
    "",
    "---",
    "",
    "## The route",
    "",
    `Run \`npx vitest run --project ${id}\` after every step, and commit after every step.`,
    "",
    "### Step 1 — TODO",
    "",
    "```",
    "Before:  ",
    "After:   ",
    "```",
    "",
    "TODO - why this step, and why now.",
    "",
    "→ n passed · `refactor: TODO`",
    "",
  ].join("\n");

  writeFileSync(path.join(dir, "meta.json"), `${JSON.stringify(meta, null, 2)}\n`);
  writeFileSync(path.join(dir, "README.en.md"), brief);
  writeFileSync(path.join(dir, "src", "index.ts"), "export {};\n");
  writeFileSync(
    path.join(dir, "tests", `${slugify(title)}.spec.ts`),
    'import { describe, it } from "vitest";\n\ndescribe("TODO", () => {\n  it.todo("characterises the behaviour before anything moves");\n});\n',
  );
  writeFileSync(path.join(dir, "solutions", solutionSlug, "index.ts"), "export {};\n");
  writeFileSync(path.join(dir, "solutions", solutionSlug, "STEPS.md"), steps);
  writeFileSync(path.join(dir, "solutions", solutionSlug, "WALKTHROUGH.md"), walkthrough);

  console.log(`✓ ${path.relative(process.cwd(), dir)}  (${id})`);
  console.log(
    "  next: write the CLEAN version in solutions/, then the tests, then un-refactor into src/",
  );
  console.log("  then: npm run index");

  return 0;
}
