import { describe, it, expect, vi } from 'vitest'
import { ChainMonitor } from '../../src/agent/chain-monitor.js'
import { DecisionEngine } from '../../src/agent/decision.js'
import { ActionExecutor } from '../../src/agent/executor.js'
import { AgentLoop } from '../../src/agent/loop.js'

const MAX_UINT256 = 2n ** 256n - 1n

const makeStubWalletFactory = (healthFactor = MAX_UINT256, walletBalance = 1000_000000n) => ({
  getLendingProtocol: vi.fn().mockReturnValue({
    getAccountData: vi.fn().mockResolvedValue({
      totalCollateralBase: 200_00000000n,
      totalDebtBase: 0n,
      availableBorrowsBase: 0n,
      currentLiquidationThreshold: 8000n,
      ltv: 7500n,
      healthFactor,
      currentLiquidityRate: 0n
    }),
    getPoolAddress: vi.fn().mockResolvedValue('0xPool'),
    supply: vi.fn().mockResolvedValue({ hash: '0xabc123' }),
    repay: vi.fn().mockResolvedValue({ hash: '0xdef456' }),
    withdraw: vi.fn().mockResolvedValue({ hash: '0xghi789' })
  }),
  getAccount: vi.fn().mockReturnValue({
    getTokenBalance: vi.fn().mockResolvedValue(walletBalance),
    approve: vi.fn().mockResolvedValue({ hash: '0xapprove' })
  }),
  getTokenAddress: vi.fn().mockReturnValue('0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'),
  waitForTransaction: vi.fn().mockResolvedValue({ status: 1 })
})

const makeStubLlm = (action = 'hold') => ({
  messages: {
    create: vi.fn().mockResolvedValue({
      content: [{ text: JSON.stringify({ action, chain: 'arbitrum', amountUSDT: 100, reasoning: 'test', confidence: 0.9, urgency: 'low' }) }]
    })
  }
})

describe('agent loop integration', () => {
  it('runOnce completes end-to-end and returns snapshots, decision, and execResult', async () => {
    const walletFactory = makeStubWalletFactory()
    const monitor = new ChainMonitor(walletFactory)
    const strategy = { chains: ['arbitrum'], minHealthFactor: 1.5, targetHealthFactor: 2.0, intervalMinutes: 30 }
    const decisionEngine = new DecisionEngine(makeStubLlm('hold'), strategy)
    const executor = new ActionExecutor(walletFactory)

    const loop = new AgentLoop({ monitor, decisionEngine, executor, strategy })
    const result = await loop.runOnce()

    expect(result.snapshots).toHaveLength(1)
    expect(result.snapshots[0].chain).toBe('arbitrum')
    expect(result.decision.action).toBe('hold')
    expect(result.execResult.txHash).toBeNull()
    expect(result.execResult.error).toBeNull()
  })

  it('runOnce executes supply action when llm decides to supply', async () => {
    const walletFactory = makeStubWalletFactory()
    const monitor = new ChainMonitor(walletFactory)
    const strategy = { chains: ['arbitrum'], minHealthFactor: 1.5, targetHealthFactor: 2.0, intervalMinutes: 30 }
    const decisionEngine = new DecisionEngine(makeStubLlm('supply'), strategy)
    const executor = new ActionExecutor(walletFactory)

    const loop = new AgentLoop({ monitor, decisionEngine, executor, strategy })
    const result = await loop.runOnce()

    expect(result.decision.action).toBe('supply')
    expect(result.execResult.txHash).toBe('0xabc123')
    expect(result.execResult.error).toBeNull()
  })

  it('snapshot healthFactor is Infinity when no debt', async () => {
    const walletFactory = makeStubWalletFactory(MAX_UINT256)
    const monitor = new ChainMonitor(walletFactory)
    const strategy = { chains: ['arbitrum'], minHealthFactor: 1.5, targetHealthFactor: 2.0, intervalMinutes: 30 }
    const decisionEngine = new DecisionEngine(makeStubLlm('hold'), strategy)
    const executor = new ActionExecutor(walletFactory)

    const loop = new AgentLoop({ monitor, decisionEngine, executor, strategy })
    const result = await loop.runOnce()

    expect(result.snapshots[0].healthFactor).toBe(Infinity)
  })

  it('snapshot healthFactor is a finite number when debt exists', async () => {
    const hf = 1_800000000000000000n // 1.8 in WAD
    const walletFactory = makeStubWalletFactory(hf)
    const monitor = new ChainMonitor(walletFactory)
    const strategy = { chains: ['arbitrum'], minHealthFactor: 1.5, targetHealthFactor: 2.0, intervalMinutes: 30 }
    const decisionEngine = new DecisionEngine(makeStubLlm('hold'), strategy)
    const executor = new ActionExecutor(walletFactory)

    const loop = new AgentLoop({ monitor, decisionEngine, executor, strategy })
    const result = await loop.runOnce()

    expect(result.snapshots[0].healthFactor).toBeCloseTo(1.8, 3)
  })
})
