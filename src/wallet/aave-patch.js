import AaveProtocolEvm from '@tetherto/wdk-protocol-lending-aave-evm'

const TESTNET_ADDRESS_MAP = {
  11155111: {
    pool: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951',
    poolAddressesProvider: '0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A',
    uiPoolDataProvider: '0x69529987FA4A075D0C00B0128fa848dc9ebbE9CE',
    priceOracle: '0x2da88497588bf89281816106C7259e31AF45a663'
  },
  84532: {
    pool: '0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27',
    poolAddressesProvider: '0xE4C23309117Aa30342BFaae6c95c6478e0A4Ad00',
    uiPoolDataProvider: '0x6a9D64f93DB660EaCB2b6E9424792c630CdA87d8',
    priceOracle: '0x943b0dE18d4abf4eF02A85912F8fc07684C141dF'
  }
}

export class PatchedAaveProtocolEvm extends AaveProtocolEvm {
  async getPoolAddress () {
    const { pool } = await this._getAddressMap()
    return pool
  }

  async getSupplyRate (token) {
    const reserve = await this._getTokenReserve(token)
    return reserve.liquidityRate ?? 0n
  }

  async _getAddressMap () {
    if (!this._addressMap) {
      const { chainId } = await this._provider.getNetwork()
      const id = Number(chainId)
      if (TESTNET_ADDRESS_MAP[id]) {
        this._addressMap = TESTNET_ADDRESS_MAP[id]
        this._chainId = BigInt(id)
        return this._addressMap
      }
    }
    return super._getAddressMap()
  }
}
