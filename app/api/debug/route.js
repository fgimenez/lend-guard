import { createClient } from '@vercel/kv'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET () {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  try {
    const kv = createClient({ url, token })
    await kv.set('debug_test', 'hello')
    const val = await kv.get('debug_test')
    const lastRun = await kv.get('last_run')
    const lastRunStr = lastRun ? JSON.stringify(lastRun).slice(0, 120) : null
    return NextResponse.json({
      urlPrefix: url ? url.slice(0, 30) + '...' : null,
      hasToken: !!token,
      writeReadTest: val,
      lastRunSnippet: lastRunStr
    })
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack?.slice(0, 300) }, { status: 500 })
  }
}
