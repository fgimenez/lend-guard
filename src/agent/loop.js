export class AgentLoop {
  constructor ({ monitor, decisionEngine, executor, strategy, store } = {}) {
    this._monitor = monitor
    this._decisionEngine = decisionEngine
    this._executor = executor
    this._strategy = strategy
    this._store = store
  }

  async runOnce () {
    console.log('[loop] getSnapshots start', this._strategy.chains)
    const snapshots = await this._monitor.getSnapshots(this._strategy.chains)
    console.log('[loop] getSnapshots done', JSON.stringify(snapshots, (_, v) => typeof v === 'bigint' ? v.toString() : v))
    const decision = await this._decisionEngine.decide(snapshots)
    console.log('[loop] decision', JSON.stringify(decision, (_, v) => typeof v === 'bigint' ? v.toString() : v))
    const execResult = await this._executor.execute(decision)
    console.log('[loop] execResult', JSON.stringify(execResult, (_, v) => typeof v === 'bigint' ? v.toString() : v))
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
