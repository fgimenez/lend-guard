import { describe, it, expect, vi } from 'vitest'
import { AgentLoop } from '../../src/agent/loop.js'

const makeStubDecision = () => ({ action: 'hold', chain: null, amountRaw: 0n, reasoning: '', confidence: 1, urgency: 'low' })
const makeStubDeps = (overrides = {}) => ({
  monitor: { getSnapshots: vi.fn().mockResolvedValue([]) },
  decisionEngine: { decide: vi.fn().mockResolvedValue(makeStubDecision()) },
  executor: { execute: vi.fn().mockResolvedValue({ txHash: null, error: null }) },
  strategy: { chains: ['arbitrum', 'base'] },
  ...overrides
})

describe('loop module', () => {
  it('can be imported', () => {})

  it('exports AgentLoop as a class', () => {
    expect(typeof AgentLoop).toBe('function')
  })

  it('has a runOnce method', () => {
    expect(typeof new AgentLoop(makeStubDeps()).runOnce).toBe('function')
  })

  it('runOnce returns a promise', () => {
    expect(new AgentLoop(makeStubDeps()).runOnce()).toBeInstanceOf(Promise)
  })

  it('runOnce calls monitor.getSnapshots with strategy chains', async () => {
    const deps = makeStubDeps()
    await new AgentLoop(deps).runOnce()
    expect(deps.monitor.getSnapshots).toHaveBeenCalledWith(['arbitrum', 'base'])
  })

  it('runOnce passes snapshots from monitor to decisionEngine.decide', async () => {
    const snapshots = [{ chain: 'arbitrum', healthFactor: 1.8 }]
    const deps = makeStubDeps({ monitor: { getSnapshots: vi.fn().mockResolvedValue(snapshots) } })
    await new AgentLoop(deps).runOnce()
    expect(deps.decisionEngine.decide).toHaveBeenCalledWith(snapshots)
  })

  it('runOnce passes decision from decisionEngine to executor.execute', async () => {
    const decision = { action: 'repay', chain: 'arbitrum', amountRaw: 100_000000n, reasoning: 'low hf', confidence: 0.9, urgency: 'high' }
    const deps = makeStubDeps({ decisionEngine: { decide: vi.fn().mockResolvedValue(decision) } })
    await new AgentLoop(deps).runOnce()
    expect(deps.executor.execute).toHaveBeenCalledWith(decision)
  })

  it('has a start method', () => {
    expect(typeof new AgentLoop(makeStubDeps()).start).toBe('function')
  })

  it('start logs errors from runOnce without crashing', async () => {
    vi.useFakeTimers()
    const err = new Error('rpc timeout')
    const deps = makeStubDeps({ monitor: { getSnapshots: vi.fn().mockRejectedValue(err) } })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const loop = new AgentLoop(deps)
    loop.start()
    await Promise.resolve()
    await Promise.resolve()
    loop.stop()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('runOnce'), err)
    consoleSpy.mockRestore()
    vi.useRealTimers()
  })

  it('start calls runOnce immediately', async () => {
    vi.useFakeTimers()
    const deps = makeStubDeps()
    const loop = new AgentLoop(deps)
    loop.start()
    await Promise.resolve()
    loop.stop()
    expect(deps.monitor.getSnapshots).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('stop prevents further runOnce calls after the interval elapses', async () => {
    vi.useFakeTimers()
    const deps = makeStubDeps({ strategy: { chains: ['arbitrum'], intervalMinutes: 1 } })
    const loop = new AgentLoop(deps)
    loop.start()
    await Promise.resolve()
    loop.stop()
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000)
    expect(deps.monitor.getSnapshots).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('runOnce calls store.saveRun with result when store is provided', async () => {
    const store = { saveRun: vi.fn().mockResolvedValue(undefined) }
    const deps = makeStubDeps({ store })
    const result = await new AgentLoop(deps).runOnce()
    expect(store.saveRun).toHaveBeenCalledWith(result)
  })

  it('runOnce does not throw when no store is provided', async () => {
    await expect(new AgentLoop(makeStubDeps()).runOnce()).resolves.toBeDefined()
  })

  it('runOnce resolves to an object with snapshots, decision, and execResult', async () => {
    const snapshots = [{ chain: 'base', healthFactor: 2.1 }]
    const decision = makeStubDecision()
    const execResult = { txHash: '0xabc', error: null }
    const deps = makeStubDeps({
      monitor: { getSnapshots: vi.fn().mockResolvedValue(snapshots) },
      decisionEngine: { decide: vi.fn().mockResolvedValue(decision) },
      executor: { execute: vi.fn().mockResolvedValue(execResult) }
    })
    const result = await new AgentLoop(deps).runOnce()
    expect(result.snapshots).toBe(snapshots)
    expect(result.decision).toBe(decision)
    expect(result.execResult).toBe(execResult)
  })
})
