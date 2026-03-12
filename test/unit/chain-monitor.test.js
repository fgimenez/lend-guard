import { describe, it, expect, vi } from 'vitest'
import { ChainMonitor } from '../../src/agent/chain-monitor.js'

const makeStubFactory = (overrides = {}) => ({
  getLendingProtocol: vi.fn().mockReturnValue({
    getAccountData: vi.fn().mockResolvedValue({
      totalCollateralBase: 0n, totalDebtBase: 0n, availableBorrowsBase: 0n,
      currentLiquidationThreshold: 0n, ltv: 0n, healthFactor: 2n ** 256n - 1n
    })
  }),
  getAccount: vi.fn().mockReturnValue({
    getTokenBalance: vi.fn().mockResolvedValue(0n)
  }),
  getTokenAddress: vi.fn().mockReturnValue('0xABC'),
  ...overrides
})

describe('chain-monitor module', () => {
  it('can be imported', () => {})

  it('exports ChainMonitor as a class', () => {
    expect(typeof ChainMonitor).toBe('function')
  })

  it('can be instantiated with a walletFactory', () => {
    expect(() => new ChainMonitor({})).not.toThrow()
  })

  it('has a getSnapshots method', () => {
    expect(typeof new ChainMonitor({}).getSnapshots).toBe('function')
  })

  it('getSnapshots returns a promise', () => {
    expect(new ChainMonitor(makeStubFactory()).getSnapshots([])).toBeInstanceOf(Promise)
  })

  it('getSnapshots resolves to an array', async () => {
    const result = await new ChainMonitor(makeStubFactory()).getSnapshots([])
    expect(Array.isArray(result)).toBe(true)
  })

  it('getSnapshots returns one snapshot per chain', async () => {
    const result = await new ChainMonitor(makeStubFactory()).getSnapshots(['arbitrum', 'base'])
    expect(result).toHaveLength(2)
  })

  it('each snapshot has a chain field matching the chain name', async () => {
    const result = await new ChainMonitor(makeStubFactory()).getSnapshots(['arbitrum'])
    expect(result[0].chain).toBe('arbitrum')
  })

  it('snapshot healthFactor is Infinity when no debt', async () => {
    const result = await new ChainMonitor(makeStubFactory()).getSnapshots(['arbitrum'])
    expect(result[0].healthFactor).toBe(Infinity)
  })

  it('snapshot walletUSDTBalance comes from getTokenBalance', async () => {
    const factory = makeStubFactory({
      getAccount: vi.fn().mockReturnValue({
        getTokenBalance: vi.fn().mockResolvedValue(500_000000n)
      })
    })
    const result = await new ChainMonitor(factory).getSnapshots(['arbitrum'])
    expect(result[0].walletUSDTBalance).toBe(500_000000n)
  })

  it('getSnapshots calls getLendingProtocol with each chain name', async () => {
    const factory = makeStubFactory()
    await new ChainMonitor(factory).getSnapshots(['arbitrum', 'base'])
    expect(factory.getLendingProtocol).toHaveBeenCalledWith('arbitrum')
    expect(factory.getLendingProtocol).toHaveBeenCalledWith('base')
  })
})
