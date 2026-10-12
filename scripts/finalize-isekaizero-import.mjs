#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const args = parseArgs(process.argv.slice(2));
const pidFile = args.pidFile ?? "data/isekaizero/full-import.pid";
const delayMs = args.delayMs ?? "650";
const pollMs = positiveInt(args.pollMs, 60_000);

const activePid = readPid(pidFile);
if (activePid) {
  console.log(`Waiting for scraper PID ${activePid} to finish...`);
  while (isRunning(activePid)) {
    await sleep(pollMs);
  }
}

await run("node", ["scripts/import-isekaizero-stories.mjs", "--delay-ms", delayMs]);
await run("node", ["scripts/load-isekaizero-into-sqlite.mjs", "--batch-size", "100"]);

console.log("Final scrape repair and SQLite load complete.");

function run(command, commandArgs) {
  return new Promise((resolveRun, rejectRun) => {
    console.log(`Running: ${command} ${commandArgs.join(" ")}`);
    const child = spawn(command, commandArgs, {
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", rejectRun);
    child.on("exit", (code) => {
      if (code === 0) {
        resolveRun();
      } else {
        rejectRun(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

function readPid(path) {
  if (!existsSync(path)) {
    return null;
  }
  const pid = Number.parseInt(readFileSync(path, "utf8"), 10);
  return Number.isFinite(pid) ? pid : null;
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const [rawKey, rawValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (rawValue !== undefined) {
      parsed[key] = rawValue;
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      parsed[key] = argv[index + 1];
      index += 1;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}
