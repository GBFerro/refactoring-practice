import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { requireExercise } from "../lib/exercises.ts";

/**
 * An advisory pass over the names you chose. It is deliberately NOT a lint rule and it
 * never fails a build: naming is judgement, and a checker that pretends otherwise would
 * be worse than none. What it can do honestly is point at words that are almost never
 * the answer, and let you defend them.
 */
const VAGUE = new Set([
  "data",
  "info",
  "item",
  "items",
  "value",
  "values",
  "obj",
  "object",
  "temp",
  "tmp",
  "result",
  "results",
  "res",
  "ret",
  "output",
  "input",
  "list",
  "arr",
  "array",
  "thing",
  "stuff",
  "content",
  "element",
  "el",
  "x",
  "y",
  "z",
  "a",
  "b",
  "c",
  "n",
  "s",
  "t",
  "v",
]);

const WEAK_PREFIX = ["handle", "process", "do", "perform", "manage", "check", "make"];
const WEAK_SUFFIX = [
  "Data",
  "Info",
  "Manager",
  "Helper",
  "Util",
  "Utils",
  "Handler",
  "Stuff",
];

interface Finding {
  file: string;
  line: number;
  name: string;
  why: string;
}

const DECLARATION =
  /(?:function\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=)/gu;

function inspect(name: string): string | undefined {
  if (VAGUE.has(name.toLowerCase())) {
    return "says nothing about the domain - what IS it?";
  }
  const prefix = WEAK_PREFIX.find((word) => name.toLowerCase().startsWith(word));
  if (prefix !== undefined) {
    return `"${prefix}" names the fact that something happens, not what happens`;
  }
  const suffix = WEAK_SUFFIX.find((word) => name.endsWith(word));
  if (suffix !== undefined) {
    return `"${suffix}" is a category, not a name - it would fit almost anything`;
  }
  return undefined;
}

export function checkNames(args: string[]): number {
  const exercise = requireExercise(args.find((arg) => !arg.startsWith("--")));
  const dir = path.join(exercise.dir, "src");
  const findings: Finding[] = [];

  for (const file of readdirSync(dir).filter((name) => name.endsWith(".ts"))) {
    const lines = readFileSync(path.join(dir, file), "utf8").split("\n");
    lines.forEach((text, index) => {
      for (const match of text.matchAll(DECLARATION)) {
        const name = match[1] ?? match[2];
        const why = name === undefined ? undefined : inspect(name);
        if (name !== undefined && why !== undefined) {
          findings.push({ file, line: index + 1, name, why });
        }
      }
    });
  }

  console.log(`Names in ${exercise.relDir}/src\n`);
  if (findings.length === 0) {
    console.log("  Nothing to flag. That is not the same as good - see docs/NAMING.md.");
  } else {
    for (const finding of findings) {
      console.log(`  ${finding.file}:${String(finding.line)}  ${finding.name}`);
      console.log(`    ${finding.why}\n`);
    }
  }
  console.log(
    [
      "",
      "This check is advisory and always exits 0. It cannot see whether a name is",
      "true, only whether it is vague. The questions it cannot ask are in",
      "docs/NAMING.md - read those before you decide it is finished.",
    ].join("\n"),
  );
  return 0;
}
