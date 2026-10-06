# Metered — demo video script (3:00)

**Status: draft for review. Rehearse Wed Oct 7, film Sat Oct 10.**
**Supersedes the Oct 5 75-second draft** — this version translates `scripts/demo.sh`
shot-for-shot (all five shots, self-checking, exit 0).

## Pre-flight (do this before every take)

- Run `./scripts/demo.sh` once — expect exit 0, "All five shots verified."
- Each run generates a **fresh random wallet**, so receipt wallet addresses differ
  between takes. That's expected, not an error — don't re-record over it.
- Terminal: large font, clean prompt, no clutter.
- If showing the Render URL, warm it first (free tier cold-starts).

## The five shots (timed)

**0:00–0:20 — open + boot**
Run `./scripts/demo.sh`. As it boots, say:
"Metered — pay-per-call billing for AI agents on Base. Three minutes, five shots,
all live. First line of the log: mock mode announced at boot. The upstream
payment leg is simulated in this build — everything else you're about to see is
real."

**0:20–0:50 — shot 1: discovery**
"An agent doesn't read docs. It reads the registry."
Show: `curl /.well-known/metered.json` → two services, `$0.015` and `$0.025`,
on `eip155:8453`. Quick flash of `/llms.txt`.

**0:50–1:30 — shot 2: the paid call**
"One paid call: data back, spend recorded, receipt minted."
Show: `POST /v1/extract-fields` → 200. Point at three things in the response:
the data labeled `sample: true`, the receipt with `mock: true` and a signature,
and `spend.spentToday: 0.025`.

**1:30–1:50 — shot 3: the cap**
"Same wallet, second call — the cap bites."
Show: `402 "daily spend cap reached"`, with spent vs cap in the body.
Say: "Budgets are enforced, not suggested."

**1:50–2:20 — shot 4: the receipt**
"Every receipt verifies offline. And it's tamper-evident."
Show: pipe the receipt to `node scripts/verify-receipt.mjs` → `VALID`.
Then flip the `mock` flag and re-run → `INVALID`.
Say: "The mock flag is inside the signature. You can't relabel a simulated
payment as a real one."

**2:20–2:50 — shot 5: the economics**
"The business model, on screen."
Show: `curl /economics` → `extract-fields`: revenue `0.025`, cost `0.02`,
margin `0.005`, one call, `mode: "mock"`.
Say: "Half a cent a call. At ten thousand calls a day, that's fifty dollars —
from a gateway, not an endpoint."

**2:50–3:00 — close**
"Metered: billing infrastructure for the agent economy. Open source — link below."

## What not to show

- Don't linger on the mock disclosure beyond the boot line and the receipt flag —
  it's disclosed three times already (boot, envelope, receipt). Say it once, move on.
- Don't show `.env`, keys, or the Render dashboard.
- Don't promise the live upstream path on camera — "one env var flips it" is the
  line; the code is the proof.
