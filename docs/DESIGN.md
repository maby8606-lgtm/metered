# Metered — design notes

## What it is

An open-source pay-per-call billing layer for AI agents on Base. One gateway
in front of any priced API:

1. **Metered gateway** (`src/server.mjs`) — express proxy; every paid call goes
   through the spend-cap check first.
2. **Per-wallet spend tracking + caps** (`src/meter.mjs`) — daily USDC cap per
   caller wallet, enforced before the upstream call runs. In-memory now; swap
   for Redis/DB for production (interface is `checkCap` / `recordSpend`).
3. **Signed usage receipts** (`src/receipts.mjs`) — every paid call returns an
   HMAC-signed receipt (wallet, service, price, tx hash, timestamp). Verifiable
   offline by the agent or any third party. Rotate `RECEIPT_SECRET` via the
   reserved `kid` field.
4. **Agent-readable service registry** (`src/registry.mjs`) — `/.well-known/metered.json`
   + `/llms.txt` so an agent discovers priced services without reading docs.

## Non-custodial by design (security)

On 2026-10-05 a DeFi vault on Base lost >$6M: an attacker got a brand-new
contract added to the vault's whitelist, then drained it. Neither Base nor
Aave's core contracts were compromised — the failure was entirely in the
vault's own access control.

Design consequence for Metered: **never custody user funds.**

- Payments settle through the x402 facilitator **directly to `PAY_TO`**. USDC
  never sits in a Metered-controlled contract or vault, so there is no honeypot
  to whitelist-attack.
- Spend caps are enforced in gateway middleware (off-chain), not with on-chain
  escrow. There is deliberately no contract holding balances.
- If an on-chain spending-cap contract is ever added later: keep it minimal,
  no admin whitelist backdoors, timelocked upgrades.

This is also a pitch line: "non-custodial billing — funds never touch our
contracts."

## Market context (honest)

The Base x402 catalog sits around ~123 paid routes and keeps growing
(observed 2026-10-05). Another endpoint is a commodity; billing *infrastructure*
that any of those 123 sellers could plug into is the differentiator. Metered
is not endpoint #124 — it is the layer the other 123 sit behind.

## Build checklist (Oct 5 → Oct 12)

- [ ] Wire real x402 payment verification (`@x402/express`) in `server.mjs`
      — replace the `x-wallet`/`x-tx` placeholder headers with the verified
      payer + tx hash from the x402 receipt.
- [ ] Forward the x402 payment proof to the upstream service on proxy.
- [ ] Swap the in-memory meter for a persistent store.
- [ ] `npm test` green, deploy somewhere public (Render free tier works).
- [ ] Logo, demo video, pitch video — required for the Colosseum submission.
- [ ] Colosseum draft → submit after 04:00 PDT Oct 6 (11:00 Accra). Repo must be PUBLIC.
