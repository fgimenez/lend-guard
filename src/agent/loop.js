export class AgentLoop {
  constructor ({ monitor, decisionEngine, executor, strategy, store } = {}) {
    this._monitor = monitor
    this._decisionEngine = decisionEngine
    this._executor = executor
    this._strategy = strategy
    this._store = store
  }

  async runOnce () {
    const snapshots = await this._monitor.getSnapshots(this._strategy.chains)
    const decision = await this._decisionEngine.decide(snapshots)
    const execResult = await this._executor.execute(decision)
    const result = { snapshots, decision, execResult }
    if (this._store) await this._store.saveRun(result)
    return result
  }

  start () {
    const run = () => this.runOnce().catch(err => console.error('runOnce error:', err))
    run()
    this._timer = setInterval(run, this._strategy.intervalMinutes * 60 * 1000)
  }

  stop () {
    clearInterval(this._timer)
  }
}
