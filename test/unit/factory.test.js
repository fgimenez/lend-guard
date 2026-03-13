import { describe, it, expect, vi } from 'vitest'
import { WalletFactory } from '../../src/wallet/factory.js'

describe('factory module', () => {
  it('can be imported', () => {})

  it('exports WalletFactory as a class', () => {
    expect(typeof WalletFactory).toBe('function')
  })

  it('can be instantiated with a seed and chain config', () => {
    expect(() => new WalletFactory('test seed phrase', {})).not.toThrow()
  })

  it('has a getTokenAddress method', () => {
    expect(typeof new WalletFactory('seed', {}).getTokenAddress).toBe('function')
  })

  it('getTokenAddress returns the usdtAddress for a given chain', () => {
    const chainConfig = { arbitrum: { usdtAddress: '0xABC', rpcUrl: 'https://arb.io', chainId: 42161 } }
    const factory = new WalletFactory('seed', chainConfig)
    expect(factory.getTokenAddress('arbitrum')).toBe('0xABC')
  })

  it('has a getLendingProtocol method', () => {
    expect(typeof new WalletFactory('seed', {}).getLendingProtocol).toBe('function')
  })

  it('getLendingProtocol returns the result of the AaveProtocol constructor', () => {
    const stubProtocol = { supply: () => {}, repay: () => {}, withdraw: () => {}, getAccountData: () => {} }
    const StubWalletAccount = vi.fn()
    const StubAaveProtocol = vi.fn().mockReturnValue(stubProtocol)
    const chainConfig = { arbitrum: { usdtAddress: '0xABC', rpcUrl: 'https://arb.io', chainId: 42161 } }
    const factory = new WalletFactory('seed', chainConfig, { WalletAccount: StubWalletAccount, AaveProtocol: StubAaveProtocol })
    const result = factory.getLendingProtocol('arbitrum')
    expect(result).toBe(stubProtocol)
  })

  it('getLendingProtocol passes the wallet account instance to AaveProtocol', () => {
    const stubAccount = {}
    const StubWalletAccount = vi.fn().mockReturnValue(stubAccount)
    const StubAaveProtocol = vi.fn()
    const chainConfig = { arbitrum: { usdtAddress: '0xABC', rpcUrl: 'https://arb.io', chainId: 42161 } }
    const factory = new WalletFactory('seed', chainConfig, { WalletAccount: StubWalletAccount, AaveProtocol: StubAaveProtocol })
    factory.getLendingProtocol('arbitrum')
    expect(StubAaveProtocol).toHaveBeenCalledWith(stubAccount)
  })

  it('has a getAccount method', () => {
    expect(typeof new WalletFactory('seed', {}).getAccount).toBe('function')
  })

  it('getAccount returns the WalletAccount instance for the given chain', () => {
    const stubAccount = {}
    const StubWalletAccount = vi.fn().mockReturnValue(stubAccount)
    const StubAaveProtocol = vi.fn()
    const chainConfig = { optimism: { usdtAddress: '0xGHI', rpcUrl: 'https://opt.io', chainId: 10 } }
    const factory = new WalletFactory('seed', chainConfig, { WalletAccount: StubWalletAccount, AaveProtocol: StubAaveProtocol })
    expect(factory.getAccount('optimism')).toBe(stubAccount)
  })

  it('has a waitForTransaction method', () => {
    expect(typeof new WalletFactory('seed', {}).waitForTransaction).toBe('function')
  })

  it('waitForTransaction polls getTransactionReceipt until non-null', async () => {
    const receipt = { status: 1 }
    const account = {
      getTransactionReceipt: vi.fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValue(receipt)
    }
    const StubWalletAccount = vi.fn().mockReturnValue(account)
    const chainConfig = { arbitrum: { usdtAddress: '0xABC', rpcUrl: 'https://arb.io', chainId: 42161 } }
    const factory = new WalletFactory('seed', chainConfig, { WalletAccount: StubWalletAccount, AaveProtocol: vi.fn(), confirmationDelay: 0 })
    const result = await factory.waitForTransaction('arbitrum', '0xhash')
    expect(account.getTransactionReceipt).toHaveBeenCalledWith('0xhash')
    expect(result).toBe(receipt)
  })

  it('waitForTransaction throws when receipt status is 0 (reverted)', async () => {
    const receipt = { status: 0 }
    const account = { getTransactionReceipt: vi.fn().mockResolvedValue(receipt) }
    const StubWalletAccount = vi.fn().mockReturnValue(account)
    const chainConfig = { arbitrum: { usdtAddress: '0xABC', rpcUrl: 'https://arb.io', chainId: 42161 } }
    const factory = new WalletFactory('seed', chainConfig, { WalletAccount: StubWalletAccount, AaveProtocol: vi.fn(), confirmationDelay: 0 })
    await expect(factory.waitForTransaction('arbitrum', '0xhash')).rejects.toThrow('Transaction reverted')
  })

  it('getLendingProtocol passes seed and rpcUrl to WalletAccount', () => {
    const StubWalletAccount = vi.fn()
    const StubAaveProtocol = vi.fn()
    const chainConfig = { base: { usdtAddress: '0xDEF', rpcUrl: 'https://base.io', chainId: 8453 } }
    const factory = new WalletFactory('my seed', chainConfig, { WalletAccount: StubWalletAccount, AaveProtocol: StubAaveProtocol })
    factory.getLendingProtocol('base')
    expect(StubWalletAccount).toHaveBeenCalledWith('my seed', expect.any(String), expect.objectContaining({ provider: 'https://base.io' }))
  })
})
