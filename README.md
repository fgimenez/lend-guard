# LendGuard

**Autonomous USDT Lending Position Manager** — a fully autonomous AI agent that protects your Aave V3 positions from liquidation and maximizes yield across multiple EVM chains, with zero human intervention required.

Built for [Hackathon Galáctica: WDK Edition 1](https://dorahacks.io/hackathon/wdk-edition-1) · **Lending Bot** track

---

## What it does

LendGuard runs a continuous loop — every configurable interval (default: 30 min) — across all configured chains:

1. **Liquidation Guardian** — reads the health factor of every active borrow position. When it falls below your defined threshold (default: 1.5), the agent auto-repays debt or adds collateral to bring it back to the target (default: 2.0). No margin calls. No liquidation penalties.

2. **Yield Optimizer** — any idle USDT sitting in the wallet gets compared against current supply APYs across all chains. The agent supplies it to the highest-yield Aave V3 market automatically.

3. **Audit trail** — every decision and executed transaction is logged to a JSONL file with full LLM reasoning, confidence score, and urgency level.

The rules are yours. The execution is the agent's.

---

## How it works

```
Every N minutes:
  1. ChainMonitor   → snapshot health factor + supply APY on each chain
  2. DecisionEngine → Claude Haiku analyzes snapshots against strategy rules
                      → returns { action, chain, amountUSDT, reasoning }
  3. ActionExecutor → executes supply / repay / withdraw on Aave V3 via WDK
  4. AuditLogger    → appends decision + tx hash to audit.jsonl
```

The agent is purely reactive to on-chain state. It has no persistent memory between cycles — every decision is made fresh from live data, which keeps it honest and auditable.

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
  audit/
    logger.js        AuditLogger — JSONL append with timestamp
  index.js           bootstrap() — wires all real deps from env vars
```

All components use **dependency injection** — no class instantiates WDK or Anthropic directly. This makes every layer independently testable and swappable.

---

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Blockchain | WDK (`@tetherto/wdk-wallet-evm`, `@tetherto/wdk-protocol-lending-aave-evm`) |
| AI decision | Claude Haiku 4.5 via Anthropic SDK |
| Protocol | Aave V3 — supply, repay, withdraw, health factor |
| Chains | Ethereum, Arbitrum, Base, Optimism |
| Tests | Vitest — unit (130), integration (4), e2e (6, Base Sepolia testnet) |
| CI | GitHub Actions — all three test layers on every push |

---

## Quickstart

### Prerequisites

- Node.js 20+
- A BIP-39 seed phrase (wallet funded with USDT on target chains)
- Anthropic API key

### Install

```bash
npm install
```

### Configure

```bash
cp .env.example .env
# edit .env
```

```env
WDK_SEED="your twelve word seed phrase here"
ANTHROPIC_API_KEY=sk-ant-...

# Optional — override defaults
CHAINS=ethereum,arbitrum,base,optimism
MIN_HEALTH_FACTOR=1.5
TARGET_HEALTH_FACTOR=2.0
INTERVAL_MINUTES=30
AUDIT_LOG=audit.jsonl

# Optional — custom RPC endpoints
RPC_ETHEREUM=https://...
RPC_ARBITRUM=https://...
RPC_BASE=https://...
RPC_OPTIMISM=https://...
```

### Run

```bash
node src/index.js
```

The agent starts immediately and runs every `INTERVAL_MINUTES`. Kill it with Ctrl+C.

### Strategy rules

| Variable | Default | Effect |
|---|---|---|
| `MIN_HEALTH_FACTOR` | `1.5` | Trigger repay/collateral below this |
| `TARGET_HEALTH_FACTOR` | `2.0` | Target health factor after action |
| `CHAINS` | all four | Which chains to monitor |
| `INTERVAL_MINUTES` | `30` | Polling frequency |

---

## Audit log

Every cycle appends a line to `audit.jsonl`:

```json
{
  "timestamp": "2026-03-12T09:04:22.000Z",
  "snapshots": [
    { "chain": "arbitrum", "healthFactor": 1.82, "supplyAPY": 0.048, "walletUSDTBalance": "500000000" }
  ],
  "decision": {
    "action": "supply",
    "chain": "arbitrum",
    "amountRaw": "500000000",
    "reasoning": "Health factor is safe at 1.82. Idle USDT in wallet at 4.8% APY — supplying to maximize yield.",
    "confidence": 0.91,
    "urgency": "low"
  },
  "execResult": { "txHash": "0xabc...", "error": null }
}
```

---

## Tests

```bash
npm test                  # 130 unit tests
npm run test:integration  # 4 integration tests
npm run test:e2e          # 6 e2e tests (requires WDK_SEED + ANTHROPIC_API_KEY)
```

The e2e suite runs against Sepolia and Base Sepolia testnets, including a real Aave V3 supply and withdraw cycle.

---

## License

Apache 2.0
