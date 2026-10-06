# Metered — unit economics (FINAL, for the Oct 10 slide)

**Decided pricing (2026-10-06):** same ~33% markup on both services.
Every number below matches what `GET /economics` returns — the slide and the
code read the same ledger.

## Per-call economics

| Service | Retail | Upstream cost | Margin/call | Margin % |
|---|---|---|---|---|
| `/extract` | $0.015 | $0.01 | $0.005 | 33% |
| `/extract-fields` | $0.025 | $0.02 | $0.005 | 20% |

Upstream costs are the verified live prices on Base mainnet. Retail prices are
set in `registry.mjs`; upstream costs live server-side in `upstream.mjs`
(kept out of the public manifest — our costs are private).

## Volume story ($0.005 avg margin/call)

| Calls/day | Revenue/day | Cost/day | Margin/day |
|---|---|---|---|
| 100 | $2.00 | $1.50 | $0.50 |
| 1,000 | $20.00 | $15.00 | $5.00 |
| 10,000 | $200.00 | $150.00 | $50.00 |

## The honest pitch line

Margin per call is thin by design — this is a volume game. Metered isn't endpoint
#124 competing on price; it's the layer the other ~123 Base x402 sellers sit
behind, taking a cut of every call. The spend-cap feature is the retention story:
sellers plug in because buyers trust capped, receipted billing more than raw
402 challenges.

## What `/economics` returns (live)

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

## Open items (post-hackathon, not blockers)

1. Measure one real upstream settle on Base and decide whether to fold gas into
   the cost model (currently margin = retail − upstream only).
2. Confirm CDP facilitator fees — zero or pass-through?
