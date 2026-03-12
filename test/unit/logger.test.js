import { describe, it, expect, vi } from 'vitest'
import { AuditLogger } from '../../src/audit/logger.js'

describe('logger module', () => {
  it('can be imported', () => {})

  it('exports AuditLogger as a class', () => {
    expect(typeof AuditLogger).toBe('function')
  })

  it('can be instantiated with a file path and appendFile function', () => {
    expect(() => new AuditLogger('/tmp/audit.jsonl', vi.fn())).not.toThrow()
  })

  it('has a log method', () => {
    expect(typeof new AuditLogger('/tmp/audit.jsonl', vi.fn()).log).toBe('function')
  })

  it('log returns a promise', () => {
    const logger = new AuditLogger('/tmp/audit.jsonl', vi.fn().mockResolvedValue(undefined))
    expect(logger.log({})).toBeInstanceOf(Promise)
  })

  it('log calls appendFile with the configured path', async () => {
    const appendFile = vi.fn().mockResolvedValue(undefined)
    const logger = new AuditLogger('/tmp/audit.jsonl', appendFile)
    await logger.log({ action: 'hold' })
    expect(appendFile).toHaveBeenCalledWith('/tmp/audit.jsonl', expect.any(String))
  })

  it('log writes a JSON line ending with newline', async () => {
    const appendFile = vi.fn().mockResolvedValue(undefined)
    const logger = new AuditLogger('/tmp/audit.jsonl', appendFile)
    await logger.log({ action: 'supply', chain: 'arbitrum' })
    const written = appendFile.mock.calls[0][1]
    expect(written.endsWith('\n')).toBe(true)
    const parsed = JSON.parse(written.trim())
    expect(parsed.action).toBe('supply')
    expect(parsed.chain).toBe('arbitrum')
  })

  it('log includes a timestamp field in the written entry', async () => {
    const appendFile = vi.fn().mockResolvedValue(undefined)
    const logger = new AuditLogger('/tmp/audit.jsonl', appendFile)
    await logger.log({ action: 'hold' })
    const written = appendFile.mock.calls[0][1]
    const parsed = JSON.parse(written.trim())
    expect(parsed.timestamp).toBeDefined()
  })
})
