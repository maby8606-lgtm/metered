# Metered

Open-source pay-per-call billing layer for AI agents on Base. One gateway in
front of any priced API: per-wallet spend caps, signed usage receipts, and an
agent-readable service registry — settled in USDC via x402, non-custodial by
design (funds never touch our contracts).

## Quickstart

```bash
cp .env.example .env   # fill in PAY_TO + RECEIPT_SECRET
npm install
npm test               # cap + receipt tests
npm run dev            # gateway on :4021
```

- Discovery: `GET /.well-known/metered.json` and `GET /llms.txt`
- Paid call: `POST /v1/extract` or `POST /v1/extract-fields` (x402, USDC on Base)
- Every paid call returns `{ data, receipt, spend }` — the receipt is
  HMAC-signed and verifiable offline.

## Mock mode for demo without funded spender wallet

`MOCK_UPSTREAM=true` makes the gateway skip the real x402 upstream payment and
return canned sample data with `txHash: "0xMOCK"`. Real mode uses the same flow
with x402-paid upstream calls — the spender wallet (`UPSTREAM_SPENDER_KEY`)
pays each wrapped service's 402 challenge via the x402 facilitator, so the end
caller only ever settles with Metered.

What stays identical in both modes: the 402 issuance, caller verification,
spend caps, spend recording, signed receipts, and the response envelope. The
mock is disclosed, never hidden:

- the response envelope carries `upstream: { mock: true, ... }`
- the signed receipt carries `mock: true` (signature-bound — flipping it
  invalidates the receipt)
- canned data is labeled `sample: true` with a note naming MOCK_UPSTREAM
- boot logs `MOCK_UPSTREAM=true — upstream payments are simulated. Production path is real.`

Real is the default and fail-closed: mock runs only when the var is exactly
`"true"`, and real mode refuses to proceed without `UPSTREAM_SPENDER_KEY`.
Demo line for the pitch: "gateway, caps, and receipts are live; the upstream
payment leg is simulated in this demo build, one env var flips it."

## Disclosure of pre-existing work

The two services Metered wraps in this demo — `/extract` ($0.01/call) and
`/extract-fields` ($0.02/call) — have been live on Base mainnet since
**2026-09-28**, before the Colosseum Crypto World's Fair submission window.
Everything else in this repo (the metered gateway, spend-cap middleware,
signed receipts, service registry) was built in-window for this hackathon.

## License

MIT
