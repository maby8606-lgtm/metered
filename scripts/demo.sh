#!/usr/bin/env bash
# scripts/demo.sh — the rehearsed Metered demo, self-checking.
#
# Boots the gateway in MOCK mode (disclosed at boot, in the envelope, and in
# the signed receipts), walks the five video shots — discovery, paid call,
# spend cap, offline receipt verification, unit economics — and asserts every
# number matches the pitch. Exit 0 = every shot verified, 1 = something broke.
#
# Usage: ./scripts/demo.sh   (run from the repo root)
# Env overrides: PORT (default 4021), DEMO_CAP (default 0.03),
#                RECEIPT_SECRET (default demo-secret — must match server and verifier)

set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-4021}"
DEMO_CAP="${DEMO_CAP:-0.03}"
export MOCK_UPSTREAM=true
export DEFAULT_DAILY_CAP_USDC="$DEMO_CAP"
export RECEIPT_SECRET="${RECEIPT_SECRET:-demo-secret}"
BASE="http://localhost:$PORT"
WALLET="0x$(head -c 20 /dev/urandom | od -An -tx1 | tr -d ' \n')"
LOG="$(mktemp -t metered-demo-log.XXXXXX)"
CALL_JSON="call.json"
CAP_JSON="$(mktemp -t metered-demo-cap.XXXXXX)"

for bin in jq curl node; do
  command -v "$bin" >/dev/null || { echo "demo needs '$bin' on PATH"; exit 1; }
done
[ -d node_modules ] || { echo "run 'npm install' first"; exit 1; }

pass() { echo "  ok: $1"; }
fail() { echo "  FAIL: $1"; [ -n "${2:-}" ] && echo "$2" | head -20; exit 1; }
shot() { echo; echo "== $1 =="; }

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
  rm -f "$LOG" "$CAP_JSON"
}
trap cleanup EXIT

echo "Metered demo — MOCK MODE. Upstream payments are simulated;"
echo "the gateway, spend caps and signed receipts on these calls are live."
echo

# --- boot --------------------------------------------------------------------
MOCK_UPSTREAM=true PORT="$PORT" node src/server.mjs >"$LOG" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
  curl -sf "$BASE/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "$BASE/health" >/dev/null || fail "server did not come up" "$(tail -5 "$LOG")"

grep -q "MOCK_UPSTREAM=true" "$LOG" \
  && pass "boot announces mock mode: $(grep 'MOCK_UPSTREAM=true' "$LOG" | head -1)" \
  || fail "boot log missing the mock announcement (disclosure non-negotiable)" "$(cat "$LOG")"

# --- shot 1: discovery --------------------------------------------------------
shot "1. discovery — an agent reads the registry, not the docs"
curl -s "$BASE/.well-known/metered.json" | jq '{name, chain, billing, services: [.services[] | {id, priceUsdc}]}'
jq -e '.services | length == 2' >/dev/null < <(curl -s "$BASE/.well-known/metered.json") \
  || fail "manifest should list 2 services"
p1=$(curl -s "$BASE/.well-known/metered.json" | jq -r '.services[] | select(.id=="extract-fields") | .priceUsdc')
[ "$p1" = "0.025" ] || fail "extract-fields caller price should be 0.025, got $p1"
pass "manifest live: extract \$0.015, extract-fields \$0.025 on eip155:8453"
curl -s "$BASE/llms.txt" | head -3

# --- shot 2: the paid call ----------------------------------------------------
shot "2. paid call — data back, spend recorded, receipt minted"
code=$(curl -s -o "$CALL_JSON" -w "%{http_code}" -X POST "$BASE/v1/extract-fields" \
  -H 'content-type: application/json' -H "x-wallet: $WALLET" \
  -d '{"text":"Invoice #INV-2041 from Acme Corp. Total $1,250.00.","fields":["invoice_number","total","vendor"]}')
[ "$code" = "200" ] || fail "paid call returned HTTP $code" "$(cat "$CALL_JSON")"
jq -e '.data.sample == true' "$CALL_JSON" >/dev/null || fail "response data not labeled sample"
jq -e '.receipt.mock == true and (.receipt.sig | length) > 0' "$CALL_JSON" >/dev/null \
  || fail "receipt missing mock:true or signature"
jq -e '.upstream.mock == true and .upstream.txHash == "0xMOCK"' "$CALL_JSON" >/dev/null \
  || fail "envelope missing upstream.mock disclosure"
spent=$(jq -r '.spend.spentToday' "$CALL_JSON")
[ "$spent" = "0.025" ] || fail "spentToday should be 0.025, got $spent"
pass "200 — sample data, spend 0.025 recorded, receipt signed (mock:true)"
jq '{data: .data, receipt: .receipt, upstream: .upstream, spend: .spend}' "$CALL_JSON"

# --- shot 3: the cap ----------------------------------------------------------
shot "3. spend cap — the same wallet hits the wall"
code=$(curl -s -o "$CAP_JSON" -w "%{http_code}" -X POST "$BASE/v1/extract-fields" \
  -H 'content-type: application/json' -H "x-wallet: $WALLET" \
  -d '{"text":"second call","fields":[]}')
[ "$code" = "402" ] || fail "expected HTTP 402, got $code" "$(cat "$CAP_JSON")"
jq -e '.error == "daily spend cap reached"' "$CAP_JSON" >/dev/null \
  || fail "wrong 402 body" "$(cat "$CAP_JSON")"
pass "402 daily spend cap reached — spent $(jq -r .spent "$CAP_JSON") of cap $(jq -r .cap "$CAP_JSON")"

# --- shot 4: the receipt ------------------------------------------------------
shot "4. receipt — verifies offline; tamper it and the signature dies"
jq '.receipt' "$CALL_JSON" | node scripts/verify-receipt.mjs \
  || fail "valid receipt did not verify"
pass "offline verification: VALID"
if jq '.receipt | .mock = false' "$CALL_JSON" | node scripts/verify-receipt.mjs >/dev/null 2>&1; then
  fail "tampered receipt (mock flipped) verified — signature binding broken"
else
  pass "tampered receipt (mock:false) rejected — INVALID"
fi

# --- shot 5: the economics ----------------------------------------------------
shot "5. unit economics — our P&L on screen"
curl -s "$BASE/economics" | jq .
ef=$(curl -s "$BASE/economics" | jq -c '.services[] | select(.id=="extract-fields")')
rev=$(echo "$ef" | jq -r .revenue); cost=$(echo "$ef" | jq -r .cost)
margin=$(echo "$ef" | jq -r .margin); calls=$(echo "$ef" | jq -r .calls)
[ "$rev" = "0.025" ] && [ "$cost" = "0.02" ] && [ "$margin" = "0.005" ] && [ "$calls" = "1" ] \
  || fail "economics mismatch: revenue=$rev cost=$cost margin=$margin calls=$calls"
mode=$(curl -s "$BASE/economics" | jq -r .mode)
[ "$mode" = "mock" ] || fail "economics mode should disclose mock, got $mode"
pass "revenue 0.025 − cost 0.02 = margin 0.005 on 1 call (mode: mock)"

echo
echo "All five shots verified. Metered: billing infrastructure for the agent economy."
echo "https://github.com/maby8606-lgtm/metered"
