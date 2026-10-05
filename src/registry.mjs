// Agent-readable service registry: one manifest + one plain-text file so an
// AI agent can discover priced services without reading docs.
// Served at /.well-known/metered.json and /llms.txt by the server.

const SERVICES = [
  {
    id: "extract",
    path: "/v1/extract",
    description: "URL in, markdown out. Pay-per-call web extraction for agents.",
    priceUsdc: 0.01,
    upstream: process.env.UPSTREAM_EXTRACT || "",
    preExisting: true, // live since 2026-09-28 — disclosed, see README
  },
  {
    id: "extract-fields",
    path: "/v1/extract-fields",
    description: "Text in, JSON out. Deterministic regex field extraction; returns null instead of hallucinating.",
    priceUsdc: 0.02,
    upstream: process.env.UPSTREAM_EXTRACT_FIELDS || "",
    preExisting: true, // live since 2026-09-28 — disclosed, see README
  },
];

export function manifest() {
  return {
    name: "metered",
    version: "0.1.0",
    chain: "eip155:8453", // Base mainnet
    billing: "x402",
    payTo: process.env.PAY_TO || "",
    services: SERVICES,
  };
}

export function llmsTxt() {
  const lines = ["# metered — pay-per-call API layer for AI agents (Base, x402)", ""];
  for (const s of SERVICES) {
    lines.push(`- ${s.id}: POST ${s.path} — $${s.priceUsdc} USDC/call. ${s.description}`);
  }
  lines.push("", "Discovery: /.well-known/metered.json", "Receipts: every paid call returns a signed usage receipt (see docs/DESIGN.md).");
  return lines.join("\n");
}
