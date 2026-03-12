export class DashboardStore {
  constructor (kv) { this._kv = kv }
  async saveRun (run) {
    const replacer = (_, v) => typeof v === 'bigint' ? v.toString() : v
    const safe = JSON.stringify(run, replacer)
    const entry = JSON.stringify({ ...run, timestamp: new Date().toISOString() }, replacer)
    const [setResult, pushResult] = await Promise.all([
      this._kv.set('last_run', safe),
      this._kv.lpush('audit_log', entry).then(n => { this._kv.ltrim('audit_log', 0, 19); return n })
    ])
    console.log('[store] kv.set result:', setResult, 'kv.lpush result:', pushResult)
  }
  async getStatus () {
    const [raw, entries] = await Promise.all([
      this._kv.get('last_run'),
      this._kv.lrange('audit_log', 0, 19)
    ])
    const parse = v => typeof v === 'string' ? JSON.parse(v) : v
    return {
      lastRun: raw != null ? parse(raw) : null,
      auditLog: Array.isArray(entries) ? entries.map(parse) : []
    }
  }
}
