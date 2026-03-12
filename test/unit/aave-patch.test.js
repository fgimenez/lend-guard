import { describe, it, expect } from 'vitest'
import { PatchedAaveProtocolEvm } from '../../src/wallet/aave-patch.js'

describe('aave-patch module', () => {
  it('can be imported', () => {})

  it('exports PatchedAaveProtocolEvm as a class', () => {
    expect(typeof PatchedAaveProtocolEvm).toBe('function')
  })

  const makeStubAccount = (chainId) => ({
    address: '0x0000000000000000000000000000000000000001',
    _config: {},
    _provider: { getNetwork: async () => ({ chainId: BigInt(chainId) }) }
  })

  it('_getAddressMap resolves for baseSepolia chainId 84532', async () => {
    const instance = new PatchedAaveProtocolEvm(makeStubAccount(84532))
    instance._provider = makeStubAccount(84532)._provider
    const map = await instance._getAddressMap()
    expect(map.pool).toMatch(/^0x/)
    expect(map.poolAddressesProvider).toMatch(/^0x/)
  })

  it('getPoolAddress returns the pool address for a testnet chain', async () => {
    const instance = new PatchedAaveProtocolEvm(makeStubAccount(84532))
    instance._provider = makeStubAccount(84532)._provider
    const pool = await instance.getPoolAddress()
    expect(pool).toBe('0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27')
  })

  it('_getAddressMap resolves for sepolia chainId 11155111', async () => {
    const instance = new PatchedAaveProtocolEvm(makeStubAccount(11155111))
    instance._provider = makeStubAccount(11155111)._provider
    const map = await instance._getAddressMap()
    expect(map.pool).toMatch(/^0x/)
  })
})
