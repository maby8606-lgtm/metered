#!/usr/bin/env node
// scripts/verify-receipt.mjs — verify a Metered signed usage receipt offline.
// No server, no trust needed: recomputes the HMAC-SHA256 and compares it to
// the receipt's signature. Every field (including the mock flag) is
// signature-bound, so tampering invalidates the receipt.
//
// Usage:
//   curl -s -X POST localhost:4021/v1/extract-fields -H 'x-wallet: 0x...' \
//     | jq '.receipt' | node scripts/verify-receipt.mjs
//   node scripts/verify-receipt.mjs call.json        # whole response or receipt
//
// Exit 0 = VALID, 1 = INVALID. Needs the same RECEIPT_SECRET the server used
// (or a .env in the repo root).

import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyReceipt } from "../src/receipts.mjs";

// Load the repo-root .env by file location, not by the caller's working
// directory. dotenv's default path is process.cwd()/.env — the demo runs
// this from a second terminal whose cwd is not the repo, which silently
// loaded nothing and fell back to the default secret. (config() never
// overrides a RECEIPT_SECRET already set in the environment, so explicit
// shell exports and demo.sh keep working exactly as before.)
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

function readInput() {
  const raw = process.argv[2] ? readFileSync(process.argv[2], "utf8") : readFileSync(0, "utf8");
  const parsed = JSON.parse(raw);
  // Accept either the bare receipt or the full paid-call response envelope.
  return parsed && typeof parsed === "object" && parsed.receipt && !parsed.sig ? parsed.receipt : parsed;
}

let receipt;
try {
  receipt = readInput();
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) throw new Error("not a receipt object");
} catch (err) {
  console.error(`INVALID: ${err.message}`);
  process.exit(1);
}

let ok = false;
try {
  ok = verifyReceipt(receipt);
} catch {
  ok = false; // malformed receipt — signature can't be checked
}

const mode = receipt.mock === true ? "mock" : receipt.mock === false ? "live" : "?";
console.log(
  `${ok ? "VALID" : "INVALID"}  service=${receipt.service ?? "?"}  wallet=${receipt.wallet ?? "?"}  ` +
    `price=${receipt.priceUsdc ?? "?"}  mode=${mode}  tx=${receipt.txHash ?? "?"}`
);
process.exit(ok ? 0 : 1);
