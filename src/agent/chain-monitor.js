import { buildSnapshot } from './monitor.js'

export class ChainMonitor {
  constructor (walletFactory) {
    this._factory = walletFactory
  }

  async getSnapshots (chains) {
    return Promise.all(chains.map(chain => this._snapshotChain(chain)))
  }

  async _snapshotChain (chain) {
    const aave = this._factory.getLendingProtocol(chain)
    const account = this._factory.getAccount(chain)
    const token = this._factory.getTokenAddress(chain)
    const [accountData, walletBalance] = await Promise.all([
      aave.getAccountData(),
      account.getTokenBalance(token)
    ])
    return buildSnapshot(chain, accountData, walletBalance, accountData.currentLiquidityRate ?? 0n)
  }
}
