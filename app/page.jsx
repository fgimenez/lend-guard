'use client'
import { useEffect, useState } from 'react'

const HEALTH_COLOR = (hf) => {
  if (hf === null || hf === undefined) return '#64748b'
  if (hf === 'Infinity' || hf >= 3) return '#22c55e'
  if (hf >= 1.5) return '#eab308'
  return '#ef4444'
}

const ACTION_COLOR = { supply: '#00e5cc', repay: '#f97316', withdraw: '#a78bfa', hold: '#64748b' }

const fmt = (v) => v === 'Infinity' ? '∞' : typeof v === 'number' ? v.toFixed(2) : v ?? '—'
const fmtAPY = (v) => v ? (v * 100).toFixed(2) + '%' : '—'
const fmtUSDT = (v) => v ? '$' + (Number(v) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString() : '—'

export default function Dashboard () {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      setStatus(data)
      setLastUpdated(new Date())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30_000)
    return () => clearInterval(interval)
  }, [])

  const run = status?.lastRun
  const snapshots = run?.snapshots ?? []
  const decision = run?.decision
  const auditLog = status?.auditLog ?? []

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ fontSize: 36 }}>🛡️</div>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#00e5cc' }}>LendGuard</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            Autonomous USDT Lending Position Manager
            {lastUpdated && <span style={{ marginLeft: 8 }}>· updated {fmtTime(lastUpdated)}</span>}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 20,
            padding: '4px 12px', fontSize: 12, color: '#22c55e'
          }}>● ACTIVE</span>
        </div>
      </div>

      {loading && <p style={{ color: '#64748b' }}>Loading…</p>}

      {/* Chain snapshots */}
      {snapshots.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Chain Snapshots</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {snapshots.map(s => (
              <div key={s.chain} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
                <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 8 }}>{s.chain}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Health Factor</span>
                  <span style={{ fontWeight: 700, color: HEALTH_COLOR(s.healthFactor) }}>{fmt(s.healthFactor)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Supply APY</span>
                  <span style={{ color: '#00e5cc' }}>{fmtAPY(s.supplyAPY)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Wallet USDT</span>
                  <span>{fmtUSDT(s.walletUSDTBalance)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Last decision */}
      {decision && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Last Decision</h2>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{
                background: ACTION_COLOR[decision.action] + '22',
                color: ACTION_COLOR[decision.action],
                border: `1px solid ${ACTION_COLOR[decision.action]}44`,
                borderRadius: 6, padding: '2px 10px', fontSize: 13, fontWeight: 700, textTransform: 'uppercase'
              }}>{decision.action}</span>
              {decision.chain && <span style={{ color: '#94a3b8', fontSize: 13 }}>on <b style={{ color: '#e2e8f0' }}>{decision.chain}</b></span>}
              {decision.amountRaw && Number(decision.amountRaw) > 0 &&
                <span style={{ color: '#94a3b8', fontSize: 13 }}>{fmtUSDT(decision.amountRaw)}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                confidence {((decision.confidence ?? 0) * 100).toFixed(0)}% · {decision.urgency}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{decision.reasoning}</p>
          </div>
        </section>
      )}

      {/* Audit log */}
      {auditLog.length > 0 && (
        <section>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Audit Log</h2>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
            {auditLog.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                borderBottom: i < auditLog.length - 1 ? '1px solid #1e293b' : 'none',
                fontSize: 13
              }}>
                <span style={{ color: '#64748b', width: 72, flexShrink: 0 }}>{fmtTime(entry.timestamp)}</span>
                <span style={{
                  color: ACTION_COLOR[entry.decision?.action] ?? '#64748b',
                  fontWeight: 600, width: 60, flexShrink: 0, textTransform: 'uppercase', fontSize: 11
                }}>{entry.decision?.action ?? '—'}</span>
                <span style={{ color: '#94a3b8', flex: 1 }} title={entry.decision?.reasoning}>
                  {entry.decision?.chain ?? '—'}
                  {entry.execResult?.txHash &&
                    <span style={{ marginLeft: 8, color: '#475569', fontFamily: 'monospace', fontSize: 11 }}>
                      {entry.execResult.txHash.slice(0, 10)}…
                    </span>}
                </span>
                {entry.execResult?.error &&
                  <span style={{ color: '#ef4444', fontSize: 11 }}>{entry.execResult.error.slice(0, 40)}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && !run && (
        <div style={{ textAlign: 'center', color: '#64748b', paddingTop: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
          <p>No runs yet. The agent will execute on the next cron tick (every 30 min).</p>
        </div>
      )}
    </div>
  )
}
