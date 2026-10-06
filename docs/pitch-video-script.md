# Metered — pitch video script FINAL (2:00–2:30, ~370 words)

**Status: final draft for your review. Lock by Thursday Oct 8.**

## Script

**0:00 — the problem (30s)**
"AI agents are about to pay for everything. Every scrape, every extraction, every
inference — paid per call, on-chain. But today every priced API reinvents billing
from scratch: API keys, monthly plans, docs a human has to read. An agent can't
read your docs page. And shared payment rails keep getting exploited — because
the money sits in their contracts. Billing for agents is broken twice: nothing
is machine-discoverable, and the custody models get people rekt."

> [VERIFY BEFORE FILMING — the earlier draft cited a "$6M Base vault whitelist
> attack" from an unverified feed item. Either confirm the details or keep the
> general line above. Do not name a number you can't source.]

**0:30 — why now (25s)**
"x402 is live on Base. Last week, API3 launched AirnodeHub — an agent-first
marketplace for x402 APIs. The pattern is set: APIs are becoming products that
agents buy, not pages that humans read. Agents need three things the web never
gave them: discover a priced service without docs, pay per call without an
account, and prove what they spent. That's the window — and it's open right now."

**0:55 — what Metered is (40s)**
"Metered is an open-source pay-per-call billing layer for AI agents. One gateway
sits in front of any priced API. Agents discover services from a machine-readable
registry — no docs. Every call goes through a per-wallet daily spend cap, enforced
before a cent moves. Every paid call returns a cryptographically signed receipt —
wallet, service, price, transaction hash — verifiable offline by anyone. And
Metered is the paying party: it takes the caller's payment, pays the upstream
service with its own x402 client, and only settles the caller after the upstream
succeeds. Non-custodial by design — funds settle straight to the seller's wallet.
Nothing ever sits in our contracts. There is no vault to attack."

**1:35 — why us (25s)**
"We didn't start from a slide deck. We've run two live pay-per-call x402 services
on Base mainnet since September — real extraction endpoints, real 402 challenges,
real USDC settlement. Metered is built on that infrastructure, and our own paid
endpoints are its first upstream. We're dogfooding the exact flow we're selling."

**2:00 — the money (20s)**
"The economics are simple. Upstream costs us a cent or two a call. We retail at
fifteen and twenty-five millicents — a half-cent cut on every call.
[SHOW: unit-economics slide — extract: $0.015 − $0.01 = $0.005; extract-fields:
$0.025 − $0.02 = $0.005; at 10k calls a day that's $50 a day, per the ledger.]
We're not endpoint one-twenty-four. We're the layer the other hundred and
twenty-three sit behind — and we take a cut of every call."

**2:20 — close (10s)**
"Metered: billing infrastructure for the agent economy. Open source, live on
Base, shipping this week."

**Disclosure line (say once, ~5s — put it in the money beat or the demo):**
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
- $6M vault claim — VERIFY or cut (see problem beat)
