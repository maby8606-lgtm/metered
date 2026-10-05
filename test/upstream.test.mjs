import test from "node:test";
import assert from "node:assert/strict";
import { isMock, payUpstream } from "../src/upstream.mjs";
import { signReceipt, verifyReceipt } from "../src/receipts.mjs";

const service = { id: "extract", priceUsdc: 0.01, upstream: "https://example.invalid/extract" };

test("mock runs only when MOCK_UPSTREAM is exactly \"true\" (fail-closed)", () => {
  process.env.MOCK_UPSTREAM = "true";
  assert.equal(isMock(), true);
  process.env.MOCK_UPSTREAM = "1";
  assert.equal(isMock(), false);
  process.env.MOCK_UPSTREAM = "TRUE";
  assert.equal(isMock(), false);
  delete process.env.MOCK_UPSTREAM;
  assert.equal(isMock(), false);
});

test("mock payUpstream returns canned sample data with 0xMOCK tx", async () => {
  process.env.MOCK_UPSTREAM = "true";
  const { data, paid } = await payUpstream(service, { url: "https://example.com" });
  assert.equal(data.sample, true);
  assert.match(data.note, /MOCK_UPSTREAM/);
  assert.equal(paid.id, "extract");
  assert.equal(paid.priceUsdc, 0.01);
  assert.equal(paid.txHash, "0xMOCK");
});

test("receipt carries the mock flag and stays verifiable", () => {
  process.env.MOCK_UPSTREAM = "true";
  const r = signReceipt({ wallet: "0xABC", service: "extract", priceUsdc: 0.01, txHash: "0xMOCK", mock: true });
  assert.equal(r.mock, true);
  assert.equal(verifyReceipt(r), true);
  assert.equal(verifyReceipt({ ...r, mock: false }), false); // flag is signature-bound
});

test("real mode fails closed without a spender key", async () => {
  delete process.env.MOCK_UPSTREAM;
  delete process.env.UPSTREAM_SPENDER_KEY;
  await assert.rejects(() => payUpstream(service, {}), /UPSTREAM_SPENDER_KEY/);
});
