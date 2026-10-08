<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/metered-logo-dark.svg">
  <img src="brand/metered-logo.svg" alt="Metered" width="248">
</picture>

# Metered

Open-source pay-per-call billing layer for AI agents on Base. One gateway in
front of any priced API: per-wallet spend caps, signed usage receipts, and an
agent-readable service registry — settled in USDC via x402, non-custodial by
design (funds never touch our contracts).

**Live demo:** https://metered-jzfn.onrender.com — landing page, live
`/economics`, and the full endpoint surface. Upstream payments are simulated
in the demo build (see Mock mode below).

> **In the wild:** the upstream services Metered wraps took their first external
> payment on 2026-10-08 — a 0.02 USDC call to `/extract-fields` from an outside
> wallet (`0x6a0b…4518`), settled on Base mainnet in block 52325709. One call,
> one stranger's agent — proof the endpoints behind the gateway are used by
> people who aren't us.

## Quickstart

```bash
cp .env.example .env   # fill in PAY_TO + RECEIPT_SECRET
npm install
npm test               # cap + receipt tests
npm run dev            # gateway on :4021
```

- Discovery: `GET /.well-known/metered.json` and `GET /llms.txt`
- Paid call: `POST /v1/extract` ($0.015) or `POST /v1/extract-fields` ($0.025)
  (x402, USDC on Base)
- Every paid call returns `{ data, receipt, spend, upstream }` — the receipt is
  HMAC-signed and verifiable offline.

## Unit economics

`GET /economics` returns the gateway's daily P&L per service, straight from the
ledger — the same numbers on the pitch slide:

```json
{
  "day": "2026-10-06",
  "mode": "mock",
  "services": [
    { "id": "extract", "priceUsdc": 0.015, "upstreamPriceUsdc": 0.01,
      "revenue": 0.015, "cost": 0.01, "margin": 0.005, "calls": 1 },
    { "id": "extract-fields", "priceUsdc": 0.025, "upstreamPriceUsdc": 0.02,
      "revenue": 0.025, "cost": 0.02, "margin": 0.005, "calls": 1 }
  ]
}
```

`mode` is `"mock"` or `"live"` — disclosed like everything else. Margin per call
is thin by design: this is a volume game. Metered isn't endpoint #124 competing
on price; it's the layer the other ~123 Base x402 sellers sit behind, taking a
cut of every call.

### Per-call economics

| Service | Retail | Upstream cost | Margin/call |
|---|---|---|---|
| `/extract` | $0.015 | $0.01 | $0.005 |
| `/extract-fields` | $0.025 | $0.02 | $0.005 |

Upstream costs are the verified live prices on Base mainnet. Retail prices are
set in `registry.mjs`; upstream costs live server-side in `upstream.mjs`
(kept out of the public manifest — our costs are private).

### Volume story ($0.005 avg margin/call)

| Calls/day | Revenue/day | Cost/day | Margin/day |
|---|---|---|---|
| 100 | $2.00 | $1.50 | $0.50 |
| 1,000 | $20.00 | $15.00 | $5.00 |
| 10,000 | $200.00 | $150.00 | $50.00 |

## Verify a receipt offline

```bash
curl -s -X POST localhost:4021/v1/extract-fields \
  -H 'content-type: application/json' -H 'x-wallet: 0xYOUR_WALLET' \
  -d '{"text":"hello"}' | jq '.receipt' | node scripts/verify-receipt.mjs
# VALID  (exit 0) — or INVALID (exit 1) if anything was tampered with
```

The mock flag is part of the signed payload: flipping it invalidates the
signature. A simulated payment can never be relabeled as a real one.

## Full demo

```bash
./scripts/demo.sh   # boots the gateway, walks all five shots, asserts every number
```

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
