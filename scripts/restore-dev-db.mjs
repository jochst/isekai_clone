#!/usr/bin/env node

import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";

const source = process.argv[2] ?? "dev.db.gz";
const target = process.argv[3] ?? "dev.db";

if (!existsSync(source)) {
  throw new Error(`Missing ${source}`);
}

await pipeline(createReadStream(source), createGunzip(), createWriteStream(target));
console.log(`Restored ${target} from ${source}`);
