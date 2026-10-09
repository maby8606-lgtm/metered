// Signed usage receipts: every paid call returns a receipt the agent (or a
// third party) can verify offline. HMAC-SHA256 over the canonical payload.
// Keep RECEIPT_SECRET server-side and rotate it; old receipts stay verifiable
// only if you keep old secrets around (key-id field reserved for that).

import { createHmac, timingSafeEqual } from "node:crypto";

// Read the secret at call time, never cached at module load. ESM evaluates
// every import in the graph before any top-level statement runs, so a
// module-scope read can freeze whatever process.env held at import time —
// in any process that imports this file before dotenv has loaded (or where
// dotenv found no .env at all). A call-time read always sees the current env.
function secret() {
  return process.env.RECEIPT_SECRET || "change-me";
}

function canonical({ wallet, service, priceUsdc, txHash, mock, timestamp }) {
  return [wallet.toLowerCase(), service, String(priceUsdc), txHash, mock ? "mock" : "live", String(timestamp)].join("|");
}

export function signReceipt({ wallet, service, priceUsdc, txHash, mock = false }) {
  const timestamp = Date.now();
  const payload = { wallet: wallet.toLowerCase(), service, priceUsdc, txHash, mock: Boolean(mock), timestamp };
  const sig = createHmac("sha256", secret()).update(canonical(payload)).digest("hex");
  return { ...payload, sig, kid: "v1" };
}

export function verifyReceipt(receipt) {
  const { sig, kid, ...payload } = receipt;
  if (!sig || typeof sig !== "string") return false;
  const expected = createHmac("sha256", secret()).update(canonical(payload)).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
