import { runImportWorker } from "../src/lib/imports/worker";
import { existsSync } from "node:fs";

// Match the app's local database location when it is configured in dotenv files.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

runImportWorker(process.argv.includes("--once")).catch(error => {
  console.error(error instanceof Error ? error.message : "Worker failed");
  process.exitCode = 1;
});
