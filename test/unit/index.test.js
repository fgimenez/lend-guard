import { describe, it, expect, vi } from 'vitest'
import { createAgent } from '../../src/index.js'
import { AgentLoop } from '../../src/agent/loop.js'

const makeStubDeps = () => ({
  monitor: { getSnapshots: vi.fn().mockResolvedValue([]) },
  decisionEngine: { decide: vi.fn().mockResolvedValue({ action: 'hold', chain: null, amountRaw: 0n }) },
  executor: { execute: vi.fn().mockResolvedValue({ txHash: null, error: null }) },
  strategy: { chains: ['arbitrum'], intervalMinutes: 30 }
})

describe('index module', () => {
  it('can be imported', () => {})

  it('exports createAgent as a function', () => {
    expect(typeof createAgent).toBe('function')
  })

  it('createAgent returns an AgentLoop', () => {
    expect(createAgent(makeStubDeps())).toBeInstanceOf(AgentLoop)
  })
})
