import { createClient } from '@vercel/kv'
import { NextResponse } from 'next/server'

export async function GET () {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  try {
    const kv = createClient({ url, token })
    await kv.set('debug_test', 'hello')
    const val = await kv.get('debug_test')
    const lastRun = await kv.get('last_run')
    return NextResponse.json({
      urlPrefix: url ? url.slice(0, 30) + '...' : null,
      hasToken: !!token,
      writeReadTest: val,
      lastRunPresent: lastRun !== null
    })
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack?.slice(0, 300) }, { status: 500 })
  }
}
