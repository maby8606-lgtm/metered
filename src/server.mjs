// Metered gateway: wraps upstream x402 services with per-wallet spend caps
// and signed usage receipts. Payments settle via the x402 facilitator straight
// to PAY_TO — Metered never custodies user funds (see docs/DESIGN.md).
//
// NOTE: x402 payment verification on Metered's own inbound leg
// (@x402/express) is the remaining build item. The upstream payment leg
// (src/upstream.mjs) handles paying the wrapped services.

import "dotenv/config";
import express from "express";
import { checkCap, recordSpend } from "./meter.mjs";
import { signReceipt } from "./receipts.mjs";
import { manifest, llmsTxt } from "./registry.mjs";
import { payUpstream, isMock, announceMode } from "./upstream.mjs";

const app = express();
app.use(express.json());

const DEFAULT_CAP = Number(process.env.DEFAULT_DAILY_CAP_USDC || 5);
const SERVICES = Object.fromEntries(manifest().services.map((s) => [s.path, s]));

// --- discovery (free) -------------------------------------------------------
app.get("/.well-known/metered.json", (_req, res) => res.json(manifest()));
app.get("/llms.txt", (_req, res) => res.type("text/plain").send(llmsTxt()));
app.get("/health", (_req, res) => res.json({ ok: true, billing: "x402", chain: "eip155:8453" }));

// --- metered proxy ----------------------------------------------------------
// TODO(build): verify the x402 payment (402 -> settle -> txHash) before proxying.
// After settlement, plug in the real caller wallet + tx hash here.
// Express 5 (path-to-regexp v8) needs a named wildcard; req.path still gives
// the full request path for the service lookup below.
app.post("/v1/*splat", async (req, res) => {
  const service = SERVICES[req.path];
  if (!service) return res.status(404).json({ error: "unknown service" });

  // Placeholder identity until x402 verification lands: X-Wallet header.
  // TODO(build): replace with the verified payer address from the x402 receipt.
  const wallet = (req.header("x-wallet") || "0x0000000000000000000000000000000000000000").toLowerCase();
  const txHash = req.header("x-tx") || "0x";

  const cap = checkCap(wallet, service.priceUsdc, DEFAULT_CAP);
  if (!cap.allowed) {
    return res.status(402).json({
      error: "daily spend cap reached",
      spent: cap.spent,
      cap: cap.cap,
      remaining: cap.remaining,
    });
  }

  try {
    // Upstream payment leg (mock or real x402, per MOCK_UPSTREAM).
    // The cap check, spend recording, receipt signing and envelope below
    // are identical in both modes — only the upstream leg changes.
    const { data, paid } = await payUpstream(service, req.body ?? {});
    const spent = recordSpend(wallet, service.priceUsdc);
    const receipt = signReceipt({
      wallet,
      service: service.id,
      priceUsdc: service.priceUsdc,
      txHash: paid.txHash,
      mock: isMock(),
    });

    res.json({
      data,
      receipt,
      spend: { spentToday: spent, cap: cap.cap },
      upstream: { mock: isMock(), id: paid.id, priceUsdc: paid.priceUsdc, txHash: paid.txHash },
    });
  } catch (err) {
    res.status(502).json({ error: "upstream failed", detail: String(err?.message || err) });
  }
});

const PORT = Number(process.env.PORT || 4021);
app.listen(PORT, () => {
  announceMode();
  console.log(`metered listening on :${PORT}`);
});
