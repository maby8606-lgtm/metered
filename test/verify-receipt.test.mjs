// verify-receipt.mjs CLI tests: valid receipt -> exit 0/VALID,
// tampered receipt -> exit 1/INVALID, malformed input -> exit 1.
//
// Hermetic: the suite forces a fixed RECEIPT_SECRET for both the in-process
// signer and the CLI child, so it passes regardless of the developer's .env.
// (dotenv never overrides an already-set process.env var, so the child can't
// pick up a different secret behind our back.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const TEST_SECRET = "metered-test-secret";
process.env.RECEIPT_SECRET = TEST_SECRET; // must precede receipts.mjs evaluation
const { signReceipt } = await import("../src/receipts.mjs");

const CLI = new URL("../scripts/verify-receipt.mjs", import.meta.url).pathname;

function run(input) {
  // Explicit env: the child verifier must sign-check with the same secret,
  // even when the developer's .env holds a different (real) one.
  const env = { ...process.env, RECEIPT_SECRET: TEST_SECRET };
  try {
    const out = execFileSync("node", [CLI], { input, encoding: "utf8", env });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status, out: (err.stdout || "") + (err.stderr || "") };
  }
}

test("valid receipt from stdin exits 0 with VALID", () => {
  const receipt = signReceipt({
    wallet: "0xabc",
    service: "extract-fields",
    priceUsdc: 0.025,
    txHash: "0xMOCK",
    mock: true,
  });
  const r = run(JSON.stringify(receipt));
  assert.equal(r.code, 0);
  assert.match(r.out, /^VALID/);
});

test("tampered receipt (mock flipped) exits 1 with INVALID", () => {
  const receipt = signReceipt({
    wallet: "0xabc",
    service: "extract-fields",
    priceUsdc: 0.025,
    txHash: "0xMOCK",
    mock: true,
  });
  const r = run(JSON.stringify({ ...receipt, mock: false }));
  assert.equal(r.code, 1);
  assert.match(r.out, /INVALID/);
});

test("malformed JSON input exits 1", () => {
  const r = run("this is not json{");
  assert.equal(r.code, 1);
  assert.match(r.out, /INVALID/);
});
