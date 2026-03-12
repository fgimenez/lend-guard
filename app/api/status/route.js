import { createClient } from '@vercel/kv'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET () {
  try {
    const kv = createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
    const [raw, entries] = await Promise.all([
      kv.get('last_run'),
      kv.lrange('audit_log', 0, 19)
    ])
    const parse = v => typeof v === 'string' ? JSON.parse(v) : v
    return NextResponse.json({
      lastRun: raw != null ? parse(raw) : null,
      auditLog: Array.isArray(entries) ? entries.map(parse) : []
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
