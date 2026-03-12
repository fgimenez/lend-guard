import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'
import { DashboardStore } from '../../../src/dashboard/store.js'

export async function GET () {
  try {
    const store = new DashboardStore(kv)
    const status = await store.getStatus()
    return NextResponse.json(status)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
