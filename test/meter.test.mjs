import test from "node:test";
import assert from "node:assert/strict";
import { checkCap, recordSpend, _reset } from "../src/meter.mjs";
import { signReceipt, verifyReceipt } from "../src/receipts.mjs";

test("cap blocks spend over the daily limit", () => {
  _reset();
  const w = "0xabc";
  assert.equal(checkCap(w, 0.01, 5).allowed, true);
  recordSpend(w, 5);
  assert.equal(checkCap(w, 0.01, 5).allowed, false);
});

test("receipt signs and verifies", () => {
  const r = signReceipt({ wallet: "0xABC", service: "extract", priceUsdc: 0.01, txHash: "0x123" });
  assert.equal(r.wallet, "0xabc");
  assert.equal(verifyReceipt(r), true);
  assert.equal(verifyReceipt({ ...r, priceUsdc: 999 }), false);
});
