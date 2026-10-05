// src/upstream.mjs — the upstream payment leg.
//
// Metered's own spender wallet pays each wrapped service's x402 challenge,
// so the end caller only ever settles with Metered. The rest of the flow —
// cap check, spend recording, receipt signing, response envelope — is
// identical in both modes. The only thing that changes is how payUpstream
// pays.
//
// MOCK_UPSTREAM=true: skip the real x402 flow and return canned data with
// txHash "0xMOCK". The mock flag is disclosed in the response envelope AND
// baked into the signed receipt, so a demo is never mistaken for a real
// payment. Real is the default and fail-closed: mock runs only when the env
// var is exactly "true".

export function isMock() {
  return process.env.MOCK_UPSTREAM === "true";
}

export function announceMode() {
  if (isMock()) {
    console.log("MOCK_UPSTREAM=true — upstream payments are simulated. Production path is real.");
  } else if (!process.env.UPSTREAM_SPENDER_KEY) {
    console.warn(
      "WARNING: MOCK_UPSTREAM is off and UPSTREAM_SPENDER_KEY is unset — real upstream payments will fail closed."
    );
  }
}

const CANNED = {
  extract: {
    markdown:
      "# Sample extraction\n\nCanned demo data. The upstream payment leg was simulated " +
      "(MOCK_UPSTREAM=true): no on-chain payment was made. Gateway, spend caps, " +
      "and signed receipts on this call are live.",
  },
  "extract-fields": {
    found: { title: "Sample Product", price: "$9.99" },
    confidence: { title: 1.0, price: 1.0 },
    missing: [],
  },
};

function mockPayUpstream(service) {
  return {
    data: {
      sample: true,
      note: "Simulated upstream response (MOCK_UPSTREAM=true). No on-chain payment was made.",
      ...(CANNED[service.id] ?? {}),
    },
    paid: { id: service.id, priceUsdc: service.priceUsdc, txHash: "0xMOCK" },
  };
}

async function realPayUpstream(service, payload) {
  if (!service.upstream) {
    throw new Error(`service ${service.id} has no upstream URL configured`);
  }
  const key = process.env.UPSTREAM_SPENDER_KEY;
  if (!key) {
    throw new Error(
      "MOCK_UPSTREAM is off and UPSTREAM_SPENDER_KEY is unset — refusing to call upstream unpaid"
    );
  }
  // Lazy imports: mock-mode installs never need the x402 client deps.
  const { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } = await import("@x402/fetch");
  const { ExactEvmScheme } = await import("@x402/evm");
  const { privateKeyToAccount } = await import("viem/accounts");

  const account = privateKeyToAccount(key.startsWith("0x") ? key : `0x${key}`);
  const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(account) }],
  });
  const res = await fetchWithPayment(service.upstream, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`upstream ${service.id} -> ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => null);
  let txHash = "0x";
  try {
    const pr = res.headers.get("payment-response");
    if (pr) txHash = decodePaymentResponseHeader(pr)?.transaction || "0x";
  } catch {
    // non-fatal: the call was paid, the hash just isn't recoverable
  }
  return { data, paid: { id: service.id, priceUsdc: service.priceUsdc, txHash } };
}

export async function payUpstream(service, payload) {
  if (isMock()) return mockPayUpstream(service);
  return realPayUpstream(service, payload);
}
