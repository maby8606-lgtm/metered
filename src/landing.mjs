// Metered landing page: single self-contained HTML response for GET /.
// No external assets, fonts, or CDNs — inline CSS + inline brand SVG only.
// Respects prefers-color-scheme. The demo curl examples use the request's
// own host so they work on any deployment (Render, localhost, ...).

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Metered mark" width="40" height="40"><defs><linearGradient id="metered-blue-m" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0052FF"/><stop offset="1" stop-color="#00A3FF"/></linearGradient></defs><g stroke="url(#metered-blue-m)" fill="none" stroke-linecap="round"><path d="M 15.03 48.97 A 24 24 0 1 1 48.97 48.97" stroke-width="7"/><path d="M 15.03 48.97 L 19.27 44.73" stroke-width="3"/><path d="M 32 8 L 32 14" stroke-width="3"/><path d="M 48.97 48.97 L 44.73 44.73" stroke-width="3"/><path d="M 32 32 L 49.3 22" stroke-width="4"/></g><circle cx="32" cy="32" r="4" fill="#0052FF"/></svg>`;

const CSS = `
:root{
  --bg:#ffffff; --fg:#0a0b0d; --muted:#5b6470; --line:#e8eaed;
  --card:#f7f8fa; --code-bg:#0d1117; --code-fg:#e6edf3;
  --blue:#0052ff; --blue-soft:#eef4ff; --green:#0f7b3d; --green-soft:#e9f7ef;
  --radius:14px;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0a0b0d; --fg:#f2f4f7; --muted:#9aa3af; --line:#23262b;
    --card:#121417; --blue-soft:#0e1c3f; --green-soft:#0d2317;
  }
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0; background:var(--bg); color:var(--fg);
  font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  line-height:1.65; font-size:17px;
}
.wrap{max-width:880px; margin:0 auto; padding:0 24px}
header.nav{display:flex; align-items:center; gap:12px; padding:28px 0}
.brand{display:flex; align-items:center; gap:10px; text-decoration:none; color:var(--fg)}
.brand b{font-size:22px; font-weight:700; letter-spacing:-.5px}
.badge{
  margin-left:auto; display:inline-flex; align-items:center; gap:8px;
  font-size:13px; font-weight:600; color:var(--muted);
  border:1px solid var(--line); border-radius:999px; padding:6px 14px;
  font-variant-numeric:tabular-nums; white-space:nowrap;
}
.dot{width:8px; height:8px; border-radius:50%; background:#22c55e; animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
.hero{padding:72px 0 56px; text-align:left}
.hero h1{
  font-size:clamp(38px,6vw,60px); line-height:1.08; letter-spacing:-2px;
  margin:0 0 20px; font-weight:750;
}
.hero p.sub{font-size:19px; color:var(--muted); max-width:640px; margin:0 0 32px}
.cta-row{display:flex; gap:12px; flex-wrap:wrap}
.btn{
  display:inline-block; padding:13px 26px; border-radius:10px; font-weight:650;
  font-size:16px; text-decoration:none; border:1px solid transparent;
}
.btn.primary{background:var(--blue); color:#fff}
.btn.primary:hover{filter:brightness(1.08)}
.btn.secondary{border-color:var(--line); color:var(--fg); background:transparent}
.btn.secondary:hover{border-color:var(--blue); color:var(--blue)}
section{padding:40px 0; border-top:1px solid var(--line)}
section h2{font-size:26px; letter-spacing:-.6px; margin:0 0 16px}
section p{color:var(--muted); max-width:660px}
.cards{display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:16px; margin-top:24px}
.card{background:var(--card); border:1px solid var(--line); border-radius:var(--radius); padding:24px}
.card h3{margin:0 0 8px; font-size:18px; letter-spacing:-.3px}
.card p{font-size:15px; margin:0}
.card code{font-size:13px}
pre{
  background:var(--code-bg); color:var(--code-fg); border-radius:12px;
  padding:18px 20px; overflow-x:auto; font-size:13.5px; line-height:1.6;
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
pre .c{color:#8b949e}
code.inline{
  font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-size:.88em; background:var(--card); border:1px solid var(--line);
  border-radius:6px; padding:2px 7px;
}
.callout{
  border-radius:var(--radius); padding:24px 26px; margin-top:8px;
  border:1px solid transparent;
}
.callout.green{background:var(--green-soft); border-color:color-mix(in srgb, var(--green) 25%, transparent)}
.callout.green strong{color:var(--green)}
.callout p{margin:8px 0 0; font-size:16px}
.disclosure{font-size:14px; color:var(--muted)}
.disclosure a{color:var(--muted)}
footer{padding:40px 0 64px; border-top:1px solid var(--line); font-size:14px; color:var(--muted)}
footer .row{display:flex; flex-wrap:wrap; gap:8px 28px; margin-bottom:12px}
footer a{color:var(--muted)}
footer code{font-size:12.5px}
@media (max-width:560px){ .hero{padding:48px 0 40px} section{padding:32px 0} }
`;

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function landingPage({ host }) {
  const base = host.startsWith("localhost") ? `http://${host}` : `https://${host}`;
  const b = esc(base);
  const repo = "https://github.com/maby8606-lgtm/metered";
  const payTo = "0xea6c6d0361a758e51004fc5b0c31a3c6b2408858";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Metered — pay-per-call billing infrastructure for AI agents on Base. Spend caps, signed receipts, agent-readable registry, settled in USDC via x402.">
<meta name="color-scheme" content="light dark">
<title>Metered — billing infrastructure for the agent economy</title>
<style>${CSS}</style>
</head>
<body>
<div class="wrap">

<header class="nav">
  <a class="brand" href="/">${MARK_SVG}<b>metered</b></a>
  <span class="badge"><span class="dot"></span>LIVE &middot; eip155:8453 &middot; x402</span>
</header>

<div class="hero">
  <h1>Billing infrastructure for the agent economy.</h1>
  <p class="sub">Metered sits in front of any priced x402 API. Callers pay Metered; Metered pays upstreams and keeps the spread. Spend caps, signed receipts, per-day P&amp;L &mdash; all in one gateway, settled in USDC on Base.</p>
  <div class="cta-row">
    <a class="btn primary" href="${repo}">View On Github</a>
    <a class="btn secondary" href="/economics">See live economics</a>
  </div>
</div>

<section>
  <h2>The problem</h2>
  <p>AI agents can pay for APIs, but no standard layer tracks who spent what, enforces budgets, or produces receipts. Every API rolls its own billing. Metered fixes that.</p>
</section>

<section>
  <h2>How it works</h2>
  <div class="cards">
    <div class="card">
      <h3>Gateway</h3>
      <p>Every paid call routes through one gateway. Caps checked, upstream paid, response returned.</p>
    </div>
    <div class="card">
      <h3>Signed receipts</h3>
      <p>Every call returns an HMAC-signed receipt. Verifiable offline &mdash; tampering invalidates the signature. Try it: <code class="inline">node scripts/verify-receipt.mjs</code></p>
    </div>
    <div class="card">
      <h3>Agent-readable registry</h3>
      <p><code class="inline">/.well-known/metered.json</code> lets agents discover priced services without reading docs.</p>
    </div>
  </div>
</section>

<section>
  <h2>Try it live</h2>
  <p>Discover priced services, make a paid call, hit the spend cap, verify the receipt, read the P&amp;L.</p>
  <pre><span class="c"># 1. discover</span>
curl ${b}/.well-known/metered.json

<span class="c"># 2. paid call ($0.025)</span>
curl -X POST ${b}/v1/extract-fields \\
  -H 'content-type: application/json' \\
  -H 'x-wallet: 0xYOUR_WALLET' \\
  -d '{"text":"Invoice #INV-2026-0042 total $1,234.50"}'

<span class="c"># 3. economics</span>
curl ${b}/economics</pre>
  <p>Prefer a rehearsed run? <code class="inline">scripts/demo.sh</code> in the repo boots the gateway, walks all five shots, and asserts every number. Each run uses a fresh wallet so cap tests stay isolated.</p>
</section>

<section>
  <div class="callout green">
    <strong>Non-custodial by design.</strong>
    <p>Funds never touch our contracts. Callers pay directly to <code class="inline">${payTo}</code>. Metered&rsquo;s spender wallet pays upstreams. Clean on-chain revenue-vs-cost accounting.</p>
  </div>
</section>

<section>
  <p class="disclosure"><strong>Demo build.</strong> Upstream payments are simulated (<code class="inline">MOCK_UPSTREAM=true</code>). The gateway, spend caps, and signed receipts are live &mdash; one env var flips the upstream leg to real x402 settlement. <a href="${repo}#mock-mode-for-demo-without-funded-spender-wallet">How the mock works</a>.</p>
</section>

<footer>
  <div class="row">
    <span>Network: <code>eip155:8453</code> (Base)</span>
    <span>payTo: <code>${payTo}</code></span>
  </div>
  <div class="row">
    <a href="${repo}">github.com/maby8606-lgtm/metered</a>
    <span>Built for the Colosseum Crypto World&rsquo;s Fair &mdash; Base track</span>
    <span>Launched October 2026</span>
  </div>
</footer>

</div>
</body>
</html>`;
}
