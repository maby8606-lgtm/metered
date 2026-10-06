// Per-wallet spend tracking + daily caps.
// In-memory store for the scaffold. Swap for Redis/DB before production:
// the interface (record/check/reset) stays the same.

const windows = new Map(); // wallet -> { day, spentUsdc }

function todayKey() {
  return new Date().toISOString().slice(0, 10); // UTC day window
}

export function checkCap(wallet, priceUsdc, capUsdc) {
  const w = wallet.toLowerCase();
  const rec = windows.get(w);
  const spent = rec && rec.day === todayKey() ? rec.spent : 0;
  return {
    allowed: spent + priceUsdc <= capUsdc,
    spent,
    cap: capUsdc,
    remaining: Number(Math.max(0, capUsdc - spent).toFixed(6)), // no float dust
  };
}

export function recordSpend(wallet, priceUsdc) {
  const w = wallet.toLowerCase();
  const day = todayKey();
  const rec = windows.get(w);
  if (rec && rec.day === day) {
    rec.spent += priceUsdc;
  } else {
    windows.set(w, { day, spent: priceUsdc });
  }
  return windows.get(w).spent;
}

// Test hook: clear all windows.
export function _reset() {
  windows.clear();
}

// --- economics ledger: Metered's own revenue vs upstream cost, per service ---
// In-memory per UTC day, like the spend windows. Same swap-for-Redis note applies.
const econ = new Map(); // serviceId -> { day, revenue, cost, calls }

function econRec(serviceId) {
  const day = todayKey();
  let rec = econ.get(serviceId);
  if (!rec || rec.day !== day) {
    rec = { day, revenue: 0, cost: 0, calls: 0 };
    econ.set(serviceId, rec);
  }
  return rec;
}

export function recordServiceRevenue(serviceId, priceUsdc) {
  const rec = econRec(serviceId);
  rec.revenue += priceUsdc;
  rec.calls += 1;
}

export function recordUpstreamSpend(serviceId, costUsdc) {
  econRec(serviceId).cost += costUsdc;
}

const r6 = (n) => Number(n.toFixed(6)); // kill float dust: 0.009999999999999998 -> 0.01

export function getEconomics(servicePrices, upstreamPrices) {
  const day = todayKey();
  const services = Object.keys(servicePrices).map((id) => {
    const rec = econ.get(id);
    const onDay = rec && rec.day === day;
    const revenue = onDay ? rec.revenue : 0;
    const cost = onDay ? rec.cost : 0;
    const calls = onDay ? rec.calls : 0;
    return {
      id,
      priceUsdc: servicePrices[id],
      upstreamPriceUsdc: upstreamPrices[id] ?? 0,
      revenue: r6(revenue),
      cost: r6(cost),
      margin: r6(revenue - cost),
      calls,
    };
  });
  return { day, services };
}

// Test hook: clear economics.
export function _resetEcon() {
  econ.clear();
}
