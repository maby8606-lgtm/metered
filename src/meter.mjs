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
    remaining: Math.max(0, capUsdc - spent),
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
