import { describe, it, expect, vi } from 'vitest'
import { DashboardStore } from '../../src/dashboard/store.js'

const makeKv = () => ({
  set: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  lpush: vi.fn().mockResolvedValue(1),
  ltrim: vi.fn().mockResolvedValue(undefined),
  lrange: vi.fn().mockResolvedValue([])
})

const makeRun = () => ({
  snapshots: [{ chain: 'arbitrum', healthFactor: 1.8, supplyAPY: 0.04, walletUSDTBalance: '1000000000' }],
  decision: { action: 'supply', chain: 'arbitrum', amountRaw: 100_000000n, reasoning: 'test', confidence: 0.9, urgency: 'low' },
  execResult: { txHash: '0xabc', error: null }
})

describe('DashboardStore', () => {
  it('exports DashboardStore class', () => {
    expect(typeof DashboardStore).toBe('function')
  })

  it('has saveRun and getStatus methods', () => {
    const store = new DashboardStore({})
    expect(typeof store.saveRun).toBe('function')
    expect(typeof store.getStatus).toBe('function')
  })

  it('saveRun stores snapshots and decision in kv as JSON string', async () => {
    const kv = makeKv()
    const store = new DashboardStore(kv)
    await store.saveRun(makeRun())
    expect(kv.set).toHaveBeenCalledWith('last_run', expect.any(String))
  })

  it('saveRun appends entry to audit list and trims to 20', async () => {
    const kv = makeKv()
    const store = new DashboardStore(kv)
    await store.saveRun(makeRun())
    expect(kv.lpush).toHaveBeenCalledWith('audit_log', expect.any(String))
    expect(kv.ltrim).toHaveBeenCalledWith('audit_log', 0, 19)
  })

  it('getStatus parses string values returned by kv', async () => {
    const run = { snapshots: [{ chain: 'arbitrum' }], decision: {}, execResult: {} }
    const kv = makeKv()
    kv.get.mockResolvedValue(JSON.stringify(run))
    kv.lrange.mockResolvedValue([JSON.stringify({ action: 'supply' })])
    const store = new DashboardStore(kv)
    const status = await store.getStatus()
    expect(status.lastRun.snapshots[0].chain).toBe('arbitrum')
    expect(status.auditLog).toHaveLength(1)
  })

  it('getStatus handles pre-parsed objects returned by kv (upstash auto-deserialize)', async () => {
    const run = { snapshots: [{ chain: 'arbitrum' }], decision: {}, execResult: {} }
    const kv = makeKv()
    kv.get.mockResolvedValue(run)
    kv.lrange.mockResolvedValue([{ action: 'supply' }])
    const store = new DashboardStore(kv)
    const status = await store.getStatus()
    expect(status.lastRun.snapshots[0].chain).toBe('arbitrum')
    expect(status.auditLog).toHaveLength(1)
  })

  it('getStatus returns null lastRun when no data in kv', async () => {
    const store = new DashboardStore(makeKv())
    const status = await store.getStatus()
    expect(status.lastRun).toBeNull()
    expect(status.auditLog).toEqual([])
  })
})
