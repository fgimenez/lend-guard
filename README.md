# LendGuard

**Autonomous USDT Lending Position Manager** — a fully autonomous AI agent that protects your Aave V3 positions from liquidation and maximizes yield across multiple EVM chains, with zero human intervention required.

Built for [Hackathon Galáctica: WDK Edition 1](https://dorahacks.io/hackathon/wdk-edition-1) · **Lending Bot** track

---

## What it does

LendGuard runs a continuous loop — every 30 minutes via Vercel Cron — across all configured chains:

1. **Liquidation Guardian** — reads the health factor of every active borrow position. When it falls below your defined threshold (default: 1.5), the agent auto-repays debt or adds collateral to bring it back to the target (default: 2.0). No margin calls. No liquidation penalties.

2. **Yield Optimizer** — any idle USDT sitting in the wallet gets compared against current supply APYs across all chains. The agent supplies it to the highest-yield Aave V3 market automatically.

3. **Live Dashboard** — a Next.js UI shows real-time chain snapshots (health factor, APY, wallet balance), Claude's latest reasoning, and a full audit log of every decision and transaction.

4. **Audit trail** — every decision and transaction is stored in Vercel KV with full LLM reasoning, confidence score, and urgency level.

The rules are yours. The execution is the agent's.

---

## How it works

```
Every 30 min (Vercel Cron → POST /api/run):
  1. ChainMonitor   → snapshot health factor + supply APY on each chain (parallel)
  2. DecisionEngine → Claude Haiku analyzes snapshots against strategy rules
                      → returns { action, chain, amountUSDT, reasoning }
  3. ActionExecutor → executes supply / repay / withdraw on Aave V3 via WDK
  4. DashboardStore → saves result to Vercel KV (last_run + audit_log list)

GET /api/status     → reads KV, serves dashboard data
GET /              → Next.js dashboard UI (polls /api/status every 30s)
```

The agent is purely reactive to on-chain state. Every decision is made fresh from live data — no persistent memory, no drift, fully auditable.

---

## Architecture

```
src/
  config/
    chains.js        CHAIN_CONFIG — chainId, rpcUrl, usdtAddress per chain
    strategy.js      parseStrategy() + validateStrategy() — user-defined rules
  wallet/
    factory.js       WalletFactory — injectable WDK constructors, tx confirmation
    aave-patch.js    PatchedAaveProtocolEvm — testnet support for Sepolia / Base Sepolia
  agent/
    monitor.js       Pure helpers — normalizeHealthFactor(), normalizeAPY(), buildSnapshot()
    chain-monitor.js ChainMonitor — parallel WDK calls across all chains
    decision.js      DecisionEngine — Claude Haiku prompt + BigInt-safe JSON + response parsing
    executor.js      ActionExecutor — ERC20 approve → supply / repay / withdraw
    loop.js          AgentLoop — runOnce() / start() / stop()
  dashboard/
    store.js         DashboardStore — saveRun() / getStatus() with injectable KV
  audit/
    logger.js        AuditLogger — JSONL append (for standalone mode)
  index.js           bootstrap() — wires all real deps from env vars

app/
  page.jsx           Dashboard UI (Client Component, auto-refresh every 30s)
  layout.jsx         Root layout
  api/
    run/route.js     POST — runs one agent cycle, saves to Vercel KV
    status/route.js  GET — reads from Vercel KV

vercel.json          Cron: POST /api/run every 30 minutes
next.config.mjs      Next.js config (ESM externals for WDK packages)
```

All components use **dependency injection** — no class instantiates WDK or Anthropic directly. This makes every layer independently testable and swappable.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Next.js 14 (App Router) |
| Blockchain | WDK (`@tetherto/wdk-wallet-evm`, `@tetherto/wdk-protocol-lending-aave-evm`) |
| AI decision | Claude Haiku 4.5 via Anthropic SDK |
| Protocol | Aave V3 — supply, repay, withdraw, health factor |
| Chains | Ethereum, Arbitrum, Base, Optimism |
| Scheduling | Vercel Cron (every 30 min) |
| State | Vercel KV (last run + audit log) |
| Tests | Vitest — unit (136), integration (4), e2e (6, Base Sepolia testnet) |
| CI | GitHub Actions — all three test layers on every push |
| Deployment | Vercel |

---

## Deploy to Vercel

### 1. Create a Vercel KV database

In your Vercel project dashboard → Storage → Create KV Database → connect to project.

### 2. Set environment variables

In Vercel project settings → Environment Variables:

```env
WDK_SEED="your twelve word bip39 seed phrase here"
ANTHROPIC_API_KEY=sk-ant-...

# Optional — strategy
CHAINS=ethereum,arbitrum,base,optimism
MIN_HEALTH_FACTOR=1.5
TARGET_HEALTH_FACTOR=2.0
INTERVAL_MINUTES=30

# Optional — custom RPC endpoints
RPC_ETHEREUM=
RPC_ARBITRUM=
RPC_BASE=
RPC_OPTIMISM=
```

The `KV_REST_API_URL` and `KV_REST_API_TOKEN` vars are added automatically when you connect the KV database.

### 3. Deploy

```bash
npx vercel --prod
```

The dashboard will be live at your Vercel URL. The cron job runs automatically every 30 minutes.

---

## Local development

```bash
cp .env.example .env.local
# edit .env.local with your keys + KV vars from Vercel dashboard

npm install
npm run dev        # Next.js dev server at localhost:3000
node src/index.js  # run agent loop standalone (no dashboard)
```

### Strategy rules

| Variable | Default | Effect |
|---|---|---|
| `MIN_HEALTH_FACTOR` | `1.5` | Trigger repay/collateral below this |
| `TARGET_HEALTH_FACTOR` | `2.0` | Target health factor after action |
| `CHAINS` | all four | Which chains to monitor |
| `INTERVAL_MINUTES` | `30` | Polling frequency (standalone mode) |

---

## Tests

```bash
npm test                  # 136 unit tests
npm run test:integration  # 4 integration tests
npm run test:e2e          # 6 e2e tests (requires WDK_SEED + ANTHROPIC_API_KEY)
```

The e2e suite runs against Sepolia and Base Sepolia testnets, including a real Aave V3 supply and withdraw cycle.

---

## License

Apache 2.0
