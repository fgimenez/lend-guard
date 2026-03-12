export class DashboardStore {
  constructor (kv) { this._kv = kv }
  async saveRun (run) {
    const replacer = (_, v) => typeof v === 'bigint' ? v.toString() : v
    const safe = JSON.stringify(run, replacer)
    const entry = JSON.stringify({ ...run, timestamp: new Date().toISOString() }, replacer)
    await Promise.all([
      this._kv.set('last_run', safe),
      this._kv.lpush('audit_log', entry).then(() => this._kv.ltrim('audit_log', 0, 19))
    ])
  }
  async getStatus () {
    const [raw, entries] = await Promise.all([
      this._kv.get('last_run'),
      this._kv.lrange('audit_log', 0, 19)
    ])
    return {
      lastRun: raw ? JSON.parse(raw) : null,
      auditLog: entries.map(e => JSON.parse(e))
    }
  }
}
