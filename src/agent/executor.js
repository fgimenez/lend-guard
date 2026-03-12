export class ActionExecutor {
  constructor (walletFactory) {
    this._factory = walletFactory
  }

  async execute (decision) {
    if (decision.action === 'hold' || decision.amountRaw === 0n) return { txHash: null, error: null }
    const aave = this._factory.getLendingProtocol(decision.chain)
    const token = this._factory.getTokenAddress(decision.chain)
    try {
      if (decision.action === 'supply') {
        const account = this._factory.getAccount(decision.chain)
        const poolAddress = await aave.getPoolAddress()
        const { hash: approveHash } = await account.approve({ token, spender: poolAddress, amount: decision.amountRaw })
        await this._factory.waitForTransaction(decision.chain, approveHash)
        const { hash } = await aave.supply({ token, amount: decision.amountRaw })
        await this._factory.waitForTransaction(decision.chain, hash)
        return { txHash: hash, error: null }
      }
      if (decision.action === 'repay') {
        const account = this._factory.getAccount(decision.chain)
        const poolAddress = await aave.getPoolAddress()
        const { hash: approveHash } = await account.approve({ token, spender: poolAddress, amount: decision.amountRaw })
        await this._factory.waitForTransaction(decision.chain, approveHash)
        const { hash } = await aave.repay({ token, amount: decision.amountRaw })
        await this._factory.waitForTransaction(decision.chain, hash)
        return { txHash: hash, error: null }
      }
      if (decision.action === 'withdraw') {
        const { hash } = await aave.withdraw({ token, amount: decision.amountRaw })
        await this._factory.waitForTransaction(decision.chain, hash)
        return { txHash: hash, error: null }
      }
    } catch (err) {
      return { txHash: null, error: err.message }
    }
  }
}
