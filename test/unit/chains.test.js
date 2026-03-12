import { describe, it, expect } from 'vitest'
import { CHAIN_CONFIG } from '../../src/config/chains.js'

describe('chains module', () => {
  it('can be imported', () => {})

  it('exports CHAIN_CONFIG as an object', () => {
    expect(typeof CHAIN_CONFIG).toBe('object')
  })

  it('has an arbitrum entry', () => {
    expect(CHAIN_CONFIG.arbitrum).toBeDefined()
  })

  it('arbitrum entry has a rpcUrl string', () => {
    expect(typeof CHAIN_CONFIG.arbitrum.rpcUrl).toBe('string')
  })

  it('arbitrum entry has a usdtAddress starting with 0x', () => {
    expect(CHAIN_CONFIG.arbitrum.usdtAddress).toMatch(/^0x/)
  })

  it('arbitrum entry has a numeric chainId', () => {
    expect(typeof CHAIN_CONFIG.arbitrum.chainId).toBe('number')
  })

  it('has entries for ethereum, base, and optimism', () => {
    expect(CHAIN_CONFIG.ethereum).toBeDefined()
    expect(CHAIN_CONFIG.base).toBeDefined()
    expect(CHAIN_CONFIG.optimism).toBeDefined()
  })

  it('each entry has rpcUrl, usdtAddress, and chainId', () => {
    for (const chain of ['ethereum', 'base', 'optimism']) {
      expect(typeof CHAIN_CONFIG[chain].rpcUrl).toBe('string')
      expect(CHAIN_CONFIG[chain].usdtAddress).toMatch(/^0x/)
      expect(typeof CHAIN_CONFIG[chain].chainId).toBe('number')
    }
  })

  it('has a sepolia entry', () => {
    expect(CHAIN_CONFIG.sepolia).toBeDefined()
  })

  it('sepolia entry has chainId 11155111', () => {
    expect(CHAIN_CONFIG.sepolia.chainId).toBe(11155111)
  })

  it('sepolia entry has rpcUrl and usdtAddress', () => {
    expect(typeof CHAIN_CONFIG.sepolia.rpcUrl).toBe('string')
    expect(CHAIN_CONFIG.sepolia.usdtAddress).toMatch(/^0x/)
  })

  it('has a baseSepolia entry', () => {
    expect(CHAIN_CONFIG.baseSepolia).toBeDefined()
  })

  it('baseSepolia entry has chainId 84532', () => {
    expect(CHAIN_CONFIG.baseSepolia.chainId).toBe(84532)
  })

  it('baseSepolia entry has rpcUrl and usdtAddress', () => {
    expect(typeof CHAIN_CONFIG.baseSepolia.rpcUrl).toBe('string')
    expect(CHAIN_CONFIG.baseSepolia.usdtAddress).toMatch(/^0x/)
  })
})
