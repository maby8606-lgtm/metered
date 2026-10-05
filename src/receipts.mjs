// Signed usage receipts: every paid call returns a receipt the agent (or a
// third party) can verify offline. HMAC-SHA256 over the canonical payload.
// Keep RECEIPT_SECRET server-side and rotate it; old receipts stay verifiable
// only if you keep old secrets around (key-id field reserved for that).

import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.RECEIPT_SECRET || "change-me";

function canonical({ wallet, service, priceUsdc, txHash, mock, timestamp }) {
  return [wallet.toLowerCase(), service, String(priceUsdc), txHash, mock ? "mock" : "live", String(timestamp)].join("|");
}

export function signReceipt({ wallet, service, priceUsdc, txHash, mock = false }) {
  const timestamp = Date.now();
  const payload = { wallet: wallet.toLowerCase(), service, priceUsdc, txHash, mock: Boolean(mock), timestamp };
  const sig = createHmac("sha256", SECRET).update(canonical(payload)).digest("hex");
  return { ...payload, sig, kid: "v1" };
}

export function verifyReceipt(receipt) {
  const { sig, kid, ...payload } = receipt;
  if (!sig || typeof sig !== "string") return false;
  const expected = createHmac("sha256", SECRET).update(canonical(payload)).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
