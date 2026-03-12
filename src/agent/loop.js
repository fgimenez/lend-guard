export class AgentLoop {
  constructor ({ monitor, decisionEngine, executor, strategy } = {}) {
    this._monitor = monitor
    this._decisionEngine = decisionEngine
    this._executor = executor
    this._strategy = strategy
  }

  async runOnce () {
    const snapshots = await this._monitor.getSnapshots(this._strategy.chains)
    const decision = await this._decisionEngine.decide(snapshots)
    const execResult = await this._executor.execute(decision)
    return { snapshots, decision, execResult }
  }

  start () {
    this.runOnce()
    this._timer = setInterval(() => this.runOnce(), this._strategy.intervalMinutes * 60 * 1000)
  }

  stop () {
    clearInterval(this._timer)
  }
}
