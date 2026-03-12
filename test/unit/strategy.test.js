import { describe, it, expect } from 'vitest'
import { parseStrategy, validateStrategy } from '../../src/config/strategy.js'

describe('strategy module', () => {
  it('can be imported', () => {})

  it('exports parseStrategy as a function', () => {
    expect(typeof parseStrategy).toBe('function')
  })

  it('parseStrategy returns an object', () => {
    expect(typeof parseStrategy({})).toBe('object')
  })

  it('parseStrategy returns a default minHealthFactor', () => {
    expect(parseStrategy({}).minHealthFactor).toBeGreaterThan(0)
  })

  it('parseStrategy lets caller override minHealthFactor', () => {
    expect(parseStrategy({ minHealthFactor: 2.0 }).minHealthFactor).toBe(2.0)
  })

  it('parseStrategy returns a default targetHealthFactor greater than minHealthFactor', () => {
    const s = parseStrategy({})
    expect(s.targetHealthFactor).toBeGreaterThan(s.minHealthFactor)
  })

  it('parseStrategy returns a default intervalMinutes', () => {
    expect(parseStrategy({}).intervalMinutes).toBeGreaterThan(0)
  })

  it('parseStrategy returns a default non-empty chains array', () => {
    expect(parseStrategy({}).chains.length).toBeGreaterThan(0)
  })

  it('exports validateStrategy as a function', () => {
    expect(typeof validateStrategy).toBe('function')
  })

  it('validateStrategy does not throw for a valid default strategy', () => {
    expect(() => validateStrategy(parseStrategy({}))).not.toThrow()
  })

  it('validateStrategy throws when minHealthFactor is below 1', () => {
    expect(() => validateStrategy(parseStrategy({ minHealthFactor: 0.9 }))).toThrow('minHealthFactor must be >= 1')
  })

  it('validateStrategy throws when minHealthFactor >= targetHealthFactor', () => {
    expect(() => validateStrategy(parseStrategy({ minHealthFactor: 2.0, targetHealthFactor: 1.5 }))).toThrow('minHealthFactor must be less than targetHealthFactor')
  })

  it('validateStrategy throws when intervalMinutes is less than 1', () => {
    expect(() => validateStrategy(parseStrategy({ intervalMinutes: 0 }))).toThrow('intervalMinutes must be >= 1')
  })

  it('validateStrategy throws when chains is empty', () => {
    expect(() => validateStrategy(parseStrategy({ chains: [] }))).toThrow('chains must not be empty')
  })

  it('validateStrategy throws when an unknown chain name is provided', () => {
    expect(() => validateStrategy(parseStrategy({ chains: ['not-a-chain'] }))).toThrow('unknown chain')
  })

  it('validateStrategy accepts baseSepolia as a valid chain', () => {
    expect(() => validateStrategy(parseStrategy({ chains: ['baseSepolia'] }))).not.toThrow()
  })
})
