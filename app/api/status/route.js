import { createClient } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { DashboardStore } from '../../../src/dashboard/store.js'

export const dynamic = 'force-dynamic'

export async function GET () {
  try {
    const kv = createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })
    const store = new DashboardStore(kv)
    const status = await store.getStatus()
    return NextResponse.json(status)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
