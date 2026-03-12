import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { bootstrap } from '../../../src/index.js'
import { DashboardStore } from '../../../src/dashboard/store.js'

export async function POST () {
  try {
    const loop = bootstrap()
    const result = await loop.runOnce()
    const store = new DashboardStore(kv)
    await store.saveRun(result)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
