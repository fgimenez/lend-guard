import { createClient } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { DashboardStore } from '../../../src/dashboard/store.js'

export const dynamic = 'force-dynamic'

export async function GET () {
  try {
    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN
    console.log('[status] KV url:', url ? url.slice(0, 40) + '...' : 'MISSING')
    console.log('[status] KV token prefix:', token ? token.slice(0, 8) + '...' : 'MISSING')
    const kv = createClient({ url, token })
    const raw = await kv.get('last_run')
    console.log('[status] last_run type:', typeof raw, 'snippet:', JSON.stringify(raw)?.slice(0, 80))
    const store = new DashboardStore(kv)
    const status = await store.getStatus()
    return NextResponse.json(status, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
