export class WalletFactory {
  constructor (seed, chainConfig, { WalletAccount, AaveProtocol, confirmationDelay = 3000 } = {}) {
    this._seed = seed
    this._chainConfig = chainConfig
    this._WalletAccount = WalletAccount
    this._AaveProtocol = AaveProtocol
    this._accounts = {}
    this._confirmationDelay = confirmationDelay
  }

  getTokenAddress (chain) {
    return this._chainConfig[chain].usdtAddress
  }

  getAccount (chain) {
    if (!this._accounts[chain]) {
      const cfg = this._chainConfig[chain]
      this._accounts[chain] = new this._WalletAccount(this._seed, `0'/0/0`, { provider: cfg.rpcUrl })
    }
    return this._accounts[chain]
  }

  getLendingProtocol (chain) {
    return new this._AaveProtocol(this.getAccount(chain))
  }

  async waitForTransaction (chain, hash) {
    const account = this.getAccount(chain)
    while (true) {
      const receipt = await account.getTransactionReceipt(hash)
      if (receipt) {
        // Brief pause to allow RPC nodes to propagate the confirmed state
        await new Promise(resolve => setTimeout(resolve, this._confirmationDelay))
        return receipt
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}
