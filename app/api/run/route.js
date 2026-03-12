import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST () {
  try {
    const { bootstrap } = await import('../../../src/index.js')
    const loop = await bootstrap()
    const result = await loop.runOnce()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('run error:', err)
    return NextResponse.json({ ok: false, error: err.message, stack: err.stack?.slice(0, 500) }, { status: 500 })
  }
}
