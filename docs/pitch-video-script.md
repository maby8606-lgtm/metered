# Metered — pitch video script CUT A (2:00 cap, 287 words)

**Status: locked Oct 8 per the form's 2:00 cap. ~1:55 at 150 wpm, ~2:03 at 140 wpm — deliver at normal pace, don't linger.**

## Script

**0:00 — the problem (20s)**
"AI agents are about to pay for everything — every scrape, extraction, and
inference, paid per call, on-chain. But every priced API reinvents billing: API
keys, monthly plans, docs a human has to read. An agent can't read your docs.
And shared rails keep getting exploited because the money sits in their
contracts."

**0:20 — why now (10s)**
"x402 is live on Base. APIs are becoming products agents buy, not pages humans
read. That window is open now."

**0:30 — what Metered is (45s)**
"Metered is an open-source pay-per-call billing layer for AI agents. One gateway
sits in front of any priced API. Agents discover services from a machine-readable
registry — no docs. Every call passes a per-wallet daily spend cap, enforced
before a cent moves. Every paid call returns a signed receipt — wallet, service,
price, transaction hash — verifiable offline. Metered pays the upstream with its
own x402 client and settles the caller only after the upstream succeeds.
Non-custodial by design — funds settle straight to the seller's wallet. Nothing
ever sits in our contracts."

**1:15 — why us (20s)**
"We run two live x402 services on Base mainnet. They're Metered's first upstream —
and they've already taken their first external payment. Block 52325709, $0.02, a
stranger's agent paying for structured extraction. Real demand, before Metered
was announced."

**1:35 — the money (15s)**
"Upstream costs a cent or two. We retail at fifteen and twenty-five millicents —
a half-cent cut per call. We're not endpoint one-twenty-four. We're the layer the
other hundred and twenty-three sit behind — and we take a cut of every call."

**1:50 — close (5s)**
"Metered: billing infrastructure for the agent economy. Open source, live on
Base."

**Disclosure line (say once, ~10s):**
"The gateway, caps, and receipts you're seeing are live. The upstream payment
leg is simulated in this demo build — one env var flips it to real x402
settlement."

## Shots

- Unit-economics slide (see `unit-economics.md` — refreshed with decided pricing)
- Registry shot: `/.well-known/metered.json` rendered
- Receipt-verify in terminal: VALID, then tampered → INVALID
- Live landing page: https://metered-jzfn.onrender.com (warm it before filming)

## Filming-day status (all true as of Oct 6)

- `upstream.mjs` built, mock + real paths in code — DONE
- Public deployment live on Render — DONE
- `/economics` returning real ledger numbers — DONE
