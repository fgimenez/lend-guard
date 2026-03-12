export class DashboardStore {
  constructor (kv) { this._kv = kv }
  async saveRun (run) {
    const replacer = (_, v) => typeof v === 'bigint' ? v.toString() : v
    const safe = JSON.parse(JSON.stringify(run, replacer))
    const entry = { ...safe, timestamp: new Date().toISOString() }
    await Promise.all([
      this._kv.set('last_run', safe),
      this._kv.lpush('audit_log', entry).then(() => this._kv.ltrim('audit_log', 0, 19))
    ])
  }
  async getStatus () {
    const [lastRun, auditLog] = await Promise.all([
      this._kv.get('last_run'),
      this._kv.lrange('audit_log', 0, 19)
    ])
    return { lastRun: lastRun ?? null, auditLog: auditLog ?? [] }
  }
}
