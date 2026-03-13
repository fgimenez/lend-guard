import { describe, it, expect, vi } from 'vitest'
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'
import Anthropic from '@anthropic-ai/sdk'
import { ChainMonitor } from '../../src/agent/chain-monitor.js'
import { DecisionEngine } from '../../src/agent/decision.js'
import { ActionExecutor } from '../../src/agent/executor.js'
import { AgentLoop } from '../../src/agent/loop.js'
import { CHAIN_CONFIG } from '../../src/config/chains.js'
import { WalletFactory } from '../../src/wallet/factory.js'
import { PatchedAaveProtocolEvm } from '../../src/wallet/aave-patch.js'

const SEED = process.env.WDK_SEED
const RPC_SEPOLIA = process.env.RPC_SEPOLIA
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const RPC_BASE_SEPOLIA = process.env.RPC_BASE_SEPOLIA || 'https://sepolia.base.org'

describe('e2e: wallet connectivity', () => {
  it('WalletAccountEvm can connect to Sepolia and read ETH balance', async () => {
    if (!SEED || !RPC_SEPOLIA) return
    const account = new WalletAccountEvm(SEED, "0'/0/0", { provider: RPC_SEPOLIA })
    const balance = await account.getBalance()
    expect(typeof balance).toBe('bigint')
    expect(balance).toBeGreaterThan(0n)
  }, 15000)

  it('WalletAccountEvm address is deterministic from seed', () => {
    if (!SEED) return
    const account = new WalletAccountEvm(SEED, "0'/0/0", {})
    expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })

  it('WalletAccountEvm can connect to Base Sepolia and read ETH balance', async () => {
    if (!SEED) return
    const account = new WalletAccountEvm(SEED, "0'/0/0", { provider: RPC_BASE_SEPOLIA })
    const balance = await account.getBalance()
    expect(typeof balance).toBe('bigint')
    expect(balance).toBeGreaterThan(0n)
  }, 15000)
})

describe('e2e: decision engine with real Anthropic API', () => {
  it('DecisionEngine.decide returns a valid action from real Claude API', async () => {
    if (!ANTHROPIC_API_KEY) return
    const llm = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
    const strategy = { chains: ['baseSepolia'], minHealthFactor: 1.5, targetHealthFactor: 2.0, intervalMinutes: 30 }
    const engine = new DecisionEngine(llm, strategy)
    const snapshots = [{
      chain: 'baseSepolia',
      healthFactor: 'Infinity',
      totalCollateralUSD: 0,
      totalDebtUSD: 0,
      walletUSDTBalance: '10000000000',
      supplyAPY: 3.5,
      timestamp: new Date().toISOString()
    }]
    const decision = await engine.decide(snapshots)
    expect(['supply', 'repay', 'withdraw', 'hold']).toContain(decision.action)
    expect(typeof decision.reasoning).toBe('string')
  }, 30000)
})

describe('e2e: Aave supply and withdraw on Base Sepolia', () => {
  it('executor can supply USDT to Aave and withdraw it back', async () => {
    if (!SEED) return

    const factory = new WalletFactory(SEED, CHAIN_CONFIG, {
      WalletAccount: WalletAccountEvm,
      AaveProtocol: PatchedAaveProtocolEvm
    })

    const executor = new ActionExecutor(factory)
    const aave = factory.getLendingProtocol('baseSepolia')

    // Skip if wallet has insufficient USDT (agent may have deployed it)
    const account2 = factory.getAccount('baseSepolia')
    const walletBalance = await account2.getTokenBalance(CHAIN_CONFIG.baseSepolia.usdtAddress)
    if (walletBalance < 10_000000n) return

    // Check initial collateral
    const before = await aave.getAccountData()

    // Supply 10 USDT
    const supplyResult = await executor.execute({
      action: 'supply',
      chain: 'baseSepolia',
      amountRaw: 10_000000n,
      reasoning: 'e2e test supply',
      confidence: 1,
      urgency: 'low'
    })
    expect(supplyResult.error).toBeNull()
    expect(supplyResult.txHash).toMatch(/^0x/)

    // Verify collateral increased
    const after = await aave.getAccountData()
    expect(after.totalCollateralBase).toBeGreaterThan(before.totalCollateralBase)

    // Withdraw only what this test supplied (not MaxUint256 — would wipe any agent position)
    const withdrawResult = await executor.execute({
      action: 'withdraw',
      chain: 'baseSepolia',
      amountRaw: 10_000000n,
      reasoning: 'e2e test cleanup',
      confidence: 1,
      urgency: 'low'
    })
    expect(withdrawResult.error).toBeNull()
    expect(withdrawResult.txHash).toMatch(/^0x/)
  }, 120000)
})

describe('e2e: full agent loop (real APIs, stubbed Aave)', () => {
  it('AgentLoop.runOnce completes with real Anthropic API and real Base Sepolia RPC', async () => {
    if (!SEED || !ANTHROPIC_API_KEY) return

    const MAX_UINT256 = 2n ** 256n - 1n

    const factory = {
      getLendingProtocol: vi.fn().mockReturnValue({
        getAccountData: vi.fn().mockResolvedValue({
          totalCollateralBase: 0n,
          totalDebtBase: 0n,
          availableBorrowsBase: 0n,
          currentLiquidationThreshold: 0n,
          ltv: 0n,
          healthFactor: MAX_UINT256,
          currentLiquidityRate: 0n
        })
      }),
      getAccount: vi.fn().mockReturnValue(
        new WalletAccountEvm(SEED, "0'/0/0", { provider: RPC_BASE_SEPOLIA })
      ),
      getTokenAddress: vi.fn().mockReturnValue(CHAIN_CONFIG.baseSepolia.usdtAddress)
    }

    const llm = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
    const strategy = { chains: ['baseSepolia'], minHealthFactor: 1.5, targetHealthFactor: 2.0, intervalMinutes: 30 }

    const monitor = new ChainMonitor(factory)
    const decisionEngine = new DecisionEngine(llm, strategy)
    const executor = { execute: vi.fn().mockResolvedValue({ txHash: null, error: null }) }

    const loop = new AgentLoop({ monitor, decisionEngine, executor, strategy })
    const result = await loop.runOnce()

    expect(result.snapshots).toHaveLength(1)
    expect(result.snapshots[0].chain).toBe('baseSepolia')
    expect(['supply', 'repay', 'withdraw', 'hold']).toContain(result.decision.action)
    expect(result.execResult.error).toBeNull()
  }, 30000)
})
