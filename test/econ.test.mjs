// Economics ledger tests: revenue/cost/margin per service, daily.
// Uses the real day-3 prices: extract 0.015/0.01, extract-fields 0.025/0.02.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkCap,
  recordSpend,
  recordServiceRevenue,
  recordUpstreamSpend,
  getEconomics,
  _reset,
  _resetEcon,
} from "../src/meter.mjs";

const CALLER = { extract: 0.015, "extract-fields": 0.025 };
const UPSTREAM = { extract: 0.01, "extract-fields": 0.02 };

function reset() {
  _reset();
  _resetEcon();
}

test("revenue and cost accumulate per service; getEconomics reports margin and calls", () => {
  reset();
  recordServiceRevenue("extract-fields", 0.025);
  recordUpstreamSpend("extract-fields", 0.02);
  recordServiceRevenue("extract-fields", 0.025);
  recordUpstreamSpend("extract-fields", 0.02);

  const econ = getEconomics(CALLER, UPSTREAM);
  const svc = econ.services.find((s) => s.id === "extract-fields");
  assert.equal(svc.priceUsdc, 0.025);
  assert.equal(svc.upstreamPriceUsdc, 0.02);
  assert.equal(svc.revenue, 0.05);
  assert.equal(svc.cost, 0.04);
  assert.equal(svc.margin, 0.01);
  assert.equal(svc.calls, 2);

  const other = econ.services.find((s) => s.id === "extract");
  assert.equal(other.calls, 0);
  assert.equal(other.margin, 0);
});

test("margin math has no float dust: 0.025 - 0.02 = 0.005 exactly", () => {
  reset();
  recordServiceRevenue("extract-fields", 0.025);
  recordUpstreamSpend("extract-fields", 0.02);
  const svc = getEconomics(CALLER, UPSTREAM).services.find((s) => s.id === "extract-fields");
  assert.equal(svc.margin, 0.005);
});

test("unknown service id returns zeros, not a throw", () => {
  reset();
  const econ = getEconomics({ nope: 0.1 }, { nope: 0.05 });
  assert.equal(econ.services.length, 1);
  assert.deepEqual(econ.services[0], {
    id: "nope",
    priceUsdc: 0.1,
    upstreamPriceUsdc: 0.05,
    revenue: 0,
    cost: 0,
    margin: 0,
    calls: 0,
  });
});

test("checkCap remaining has no float dust", () => {
  reset();
  recordSpend("0xabc", 0.04); // 0.05 - 0.04 = 0.009999999999999998 without the fix
  const cap = checkCap("0xabc", 0.01, 0.05);
  assert.equal(cap.remaining, 0.01);
});
