import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { ROOT } from "./exercises.ts";

/** Runs a binary from node_modules/.bin without going through a shell. */
export function runBin(
  bin: string,
  args: string[],
  options: { quiet?: boolean; env?: NodeJS.ProcessEnv } = {},
): SpawnSyncReturns<string> {
  return spawnSync(path.join(ROOT, "node_modules", ".bin", bin), args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.quiet === true ? "pipe" : "inherit",
    env: { ...process.env, ...options.env },
  });
}
