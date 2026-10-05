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

## Disclosure of pre-existing work

The two services Metered wraps in this demo — `/extract` ($0.01/call) and
`/extract-fields` ($0.02/call) — have been live on Base mainnet since
**2026-09-28**, before the Colosseum Crypto World's Fair submission window.
Everything else in this repo (the metered gateway, spend-cap middleware,
signed receipts, service registry) was built in-window for this hackathon.

## License

MIT
