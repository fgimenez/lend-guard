import { describe, it, expect } from 'vitest'
import { normalizeHealthFactor, normalizeAPY, buildSnapshot } from '../../src/agent/monitor.js'

describe('monitor module', () => {
  it('can be imported', () => {})

  it('exports normalizeHealthFactor as a function', () => {
    expect(typeof normalizeHealthFactor).toBe('function')
  })

  it('normalizeHealthFactor converts 1e18 to 1.0', () => {
    expect(normalizeHealthFactor(10n ** 18n)).toBe(1.0)
  })

  it('normalizeHealthFactor converts 1.5e18 to 1.5', () => {
    expect(normalizeHealthFactor(15n * 10n ** 17n)).toBe(1.5)
  })

  it('normalizeHealthFactor returns Infinity for MaxUint256 (no debt)', () => {
    expect(normalizeHealthFactor(2n ** 256n - 1n)).toBe(Infinity)
  })

  it('normalizeHealthFactor returns 0 for zero input', () => {
    expect(normalizeHealthFactor(0n)).toBe(0)
  })

  it('exports normalizeAPY as a function', () => {
    expect(typeof normalizeAPY).toBe('function')
  })

  it('normalizeAPY returns 0 for a zero rate', () => {
    expect(normalizeAPY(0n)).toBe(0)
  })

  it('normalizeAPY converts a 3% ray rate to ~3.0', () => {
    // 3% APY in ray: 0.03 * 1e27 = 3e25
    expect(normalizeAPY(3n * 10n ** 25n)).toBeCloseTo(3.0, 1)
  })

  it('exports buildSnapshot as a function', () => {
    expect(typeof buildSnapshot).toBe('function')
  })

  it('buildSnapshot returns an object with the given chain name', () => {
    const raw = { totalCollateralBase: 0n, totalDebtBase: 0n, availableBorrowsBase: 0n, healthFactor: 0n }
    expect(buildSnapshot('arbitrum', raw, 0n, 0n).chain).toBe('arbitrum')
  })

  it('buildSnapshot sets healthFactor by normalizing raw accountData.healthFactor', () => {
    const raw = { totalCollateralBase: 0n, totalDebtBase: 0n, availableBorrowsBase: 0n, healthFactor: 15n * 10n ** 17n }
    expect(buildSnapshot('base', raw, 0n, 0n).healthFactor).toBe(1.5)
  })

  it('buildSnapshot converts totalCollateralBase (8 decimals) to USD float', () => {
    const raw = { totalCollateralBase: 1000_00000000n, totalDebtBase: 0n, availableBorrowsBase: 0n, healthFactor: 0n }
    expect(buildSnapshot('base', raw, 0n, 0n).totalCollateralUSD).toBeCloseTo(1000)
  })

  it('buildSnapshot converts totalDebtBase to USD float', () => {
    const raw = { totalCollateralBase: 0n, totalDebtBase: 500_00000000n, availableBorrowsBase: 0n, healthFactor: 0n }
    expect(buildSnapshot('base', raw, 0n, 0n).totalDebtUSD).toBeCloseTo(500)
  })

  it('buildSnapshot normalizes walletUSDTBalance to a USD float (6 decimals)', () => {
    const raw = { totalCollateralBase: 0n, totalDebtBase: 0n, availableBorrowsBase: 0n, healthFactor: 0n }
    expect(buildSnapshot('base', raw, 250_000000n, 0n).walletUSDT).toBeCloseTo(250)
  })

  it('buildSnapshot converts supplyRayRate to supplyAPY percent', () => {
    const raw = { totalCollateralBase: 0n, totalDebtBase: 0n, availableBorrowsBase: 0n, healthFactor: 0n }
    expect(buildSnapshot('base', raw, 0n, 3n * 10n ** 25n).supplyAPY).toBeCloseTo(3.0, 1)
  })

  it('buildSnapshot includes a timestamp that is a Date', () => {
    const raw = { totalCollateralBase: 0n, totalDebtBase: 0n, availableBorrowsBase: 0n, healthFactor: 0n }
    expect(buildSnapshot('base', raw, 0n, 0n).timestamp).toBeInstanceOf(Date)
  })
})
