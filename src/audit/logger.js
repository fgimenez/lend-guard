export class AuditLogger {
  constructor (filePath, appendFile) {
    this._filePath = filePath
    this._appendFile = appendFile
  }

  async log (entry) {
    const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n'
    await this._appendFile(this._filePath, line)
  }
}
