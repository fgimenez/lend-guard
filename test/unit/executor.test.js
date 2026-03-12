import { describe, it, expect, vi } from 'vitest'
import { ActionExecutor } from '../../src/agent/executor.js'

const makeFactory = (aave, overrides = {}) => ({
  getLendingProtocol: () => aave,
  getTokenAddress: () => '0xToken',
  getAccount: () => ({ approve: vi.fn().mockResolvedValue({ hash: '0xapprove' }) }),
  waitForTransaction: vi.fn().mockResolvedValue({ status: 1 }),
  ...overrides
})

describe('executor module', () => {
  it('can be imported', () => {})

  it('exports ActionExecutor as a class', () => {
    expect(typeof ActionExecutor).toBe('function')
  })

  it('has an execute method', () => {
    expect(typeof new ActionExecutor({}).execute).toBe('function')
  })

  it('execute returns a promise', () => {
    const executor = new ActionExecutor({})
    expect(executor.execute({ action: 'hold', amountRaw: 0n })).toBeInstanceOf(Promise)
  })

  it('execute returns txHash null and error null for hold action', async () => {
    const result = await new ActionExecutor({}).execute({ action: 'hold', amountRaw: 0n })
    expect(result.txHash).toBeNull()
    expect(result.error).toBeNull()
  })

  it('execute returns txHash null when amountRaw is zero regardless of action', async () => {
    const aave = { supply: vi.fn() }
    const factory = { getLendingProtocol: () => aave, getTokenAddress: () => '0x1' }
    const result = await new ActionExecutor(factory).execute({ action: 'supply', amountRaw: 0n })
    expect(aave.supply).not.toHaveBeenCalled()
    expect(result.txHash).toBeNull()
  })

  it('execute waits for approve tx confirmation before calling supply', async () => {
    const aave = { supply: vi.fn().mockResolvedValue({ hash: '0xsupply' }), getPoolAddress: vi.fn().mockResolvedValue('0xPool') }
    const factory = makeFactory(aave)
    await new ActionExecutor(factory).execute({ action: 'supply', chain: 'arbitrum', amountRaw: 100_000000n })
    expect(factory.waitForTransaction).toHaveBeenCalledWith('arbitrum', '0xapprove')
    expect(aave.supply).toHaveBeenCalled()
  })

  it('execute calls account.approve before aave.supply', async () => {
    const aave = { supply: vi.fn().mockResolvedValue({ hash: '0xabc' }), getPoolAddress: vi.fn().mockResolvedValue('0xPool') }
    const account = { approve: vi.fn().mockResolvedValue({ hash: '0xapprove' }) }
    const factory = makeFactory(aave, { getAccount: () => account })
    await new ActionExecutor(factory).execute({ action: 'supply', chain: 'arbitrum', amountRaw: 100_000000n })
    expect(account.approve).toHaveBeenCalledWith({ token: '0xToken', spender: '0xPool', amount: 100_000000n })
    expect(aave.supply).toHaveBeenCalled()
  })

  it('execute calls aave.supply with token address and amountRaw', async () => {
    const aave = { supply: vi.fn().mockResolvedValue({ hash: '0xabc' }), getPoolAddress: vi.fn().mockResolvedValue('0xPool') }
    const factory = makeFactory(aave)
    await new ActionExecutor(factory).execute({ action: 'supply', chain: 'arbitrum', amountRaw: 100_000000n })
    expect(aave.supply).toHaveBeenCalledWith({ token: '0xToken', amount: 100_000000n })
  })

  it('execute waits for supply tx confirmation', async () => {
    const aave = { supply: vi.fn().mockResolvedValue({ hash: '0xsupply' }), getPoolAddress: vi.fn().mockResolvedValue('0xPool') }
    const factory = makeFactory(aave)
    await new ActionExecutor(factory).execute({ action: 'supply', chain: 'arbitrum', amountRaw: 100_000000n })
    expect(factory.waitForTransaction).toHaveBeenCalledWith('arbitrum', '0xsupply')
  })

  it('execute returns the txHash from aave.supply', async () => {
    const aave = { supply: vi.fn().mockResolvedValue({ hash: '0xabc' }), getPoolAddress: vi.fn().mockResolvedValue('0xPool') }
    const factory = makeFactory(aave)
    const result = await new ActionExecutor(factory).execute({ action: 'supply', chain: 'arbitrum', amountRaw: 100_000000n })
    expect(result.txHash).toBe('0xabc')
  })

  it('execute calls account.approve before aave.repay', async () => {
    const aave = { repay: vi.fn().mockResolvedValue({ hash: '0xdef' }), getPoolAddress: vi.fn().mockResolvedValue('0xPool') }
    const account = { approve: vi.fn().mockResolvedValue({ hash: '0xapprove' }) }
    const factory = makeFactory(aave, { getAccount: () => account })
    await new ActionExecutor(factory).execute({ action: 'repay', chain: 'base', amountRaw: 50_000000n })
    expect(account.approve).toHaveBeenCalledWith({ token: '0xToken', spender: '0xPool', amount: 50_000000n })
  })

  it('execute calls aave.repay for repay action', async () => {
    const aave = { repay: vi.fn().mockResolvedValue({ hash: '0xdef' }), getPoolAddress: vi.fn().mockResolvedValue('0xPool') }
    const factory = makeFactory(aave)
    const result = await new ActionExecutor(factory).execute({ action: 'repay', chain: 'base', amountRaw: 50_000000n })
    expect(aave.repay).toHaveBeenCalledWith({ token: '0xToken', amount: 50_000000n })
    expect(result.txHash).toBe('0xdef')
  })

  it('execute calls aave.withdraw for withdraw action', async () => {
    const aave = { withdraw: vi.fn().mockResolvedValue({ hash: '0xghi' }) }
    const factory = makeFactory(aave)
    const result = await new ActionExecutor(factory).execute({ action: 'withdraw', chain: 'optimism', amountRaw: 75_000000n })
    expect(aave.withdraw).toHaveBeenCalledWith({ token: '0xToken', amount: 75_000000n })
    expect(result.txHash).toBe('0xghi')
  })

  it('execute returns error message when the aave call throws', async () => {
    const aave = { supply: vi.fn().mockRejectedValue(new Error('insufficient balance')), getPoolAddress: vi.fn().mockResolvedValue('0xPool') }
    const factory = makeFactory(aave)
    const result = await new ActionExecutor(factory).execute({ action: 'supply', chain: 'arbitrum', amountRaw: 100_000000n })
    expect(result.txHash).toBeNull()
    expect(result.error).toBe('insufficient balance')
  })
})
