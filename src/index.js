import Anthropic from '@anthropic-ai/sdk'
import { appendFile } from 'fs/promises'
import { WalletAccountEvm } from '@tetherto/wdk-wallet-evm'
import { PatchedAaveProtocolEvm } from './wallet/aave-patch.js'

import { CHAIN_CONFIG } from './config/chains.js'
import { parseStrategy, validateStrategy } from './config/strategy.js'
import { WalletFactory } from './wallet/factory.js'
import { ChainMonitor } from './agent/chain-monitor.js'
import { DecisionEngine } from './agent/decision.js'
import { ActionExecutor } from './agent/executor.js'
import { AgentLoop } from './agent/loop.js'
import { AuditLogger } from './audit/logger.js'
import { DashboardStore } from './dashboard/store.js'

export function createAgent (deps) {
  return new AgentLoop(deps)
}

export async function bootstrap (env = process.env) {
  const seed = env.WDK_SEED
  if (!seed) throw new Error('WDK_SEED env var is required')

  const strategy = parseStrategy({
    chains: env.CHAINS ? env.CHAINS.split(',') : undefined,
    minHealthFactor: env.MIN_HEALTH_FACTOR ? Number(env.MIN_HEALTH_FACTOR) : undefined,
    targetHealthFactor: env.TARGET_HEALTH_FACTOR ? Number(env.TARGET_HEALTH_FACTOR) : undefined,
    intervalMinutes: env.INTERVAL_MINUTES ? Number(env.INTERVAL_MINUTES) : undefined
  })
  validateStrategy(strategy)

  const factory = new WalletFactory(seed, CHAIN_CONFIG, {
    WalletAccount: WalletAccountEvm,
    AaveProtocol: PatchedAaveProtocolEvm
  })

  const llm = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const monitor = new ChainMonitor(factory)
  const decisionEngine = new DecisionEngine(llm, strategy)
  const executor = new ActionExecutor(factory)
  const logger = new AuditLogger(env.AUDIT_LOG || 'audit.jsonl', appendFile)

  let store
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN) {
    console.log('[bootstrap] KV url:', env.KV_REST_API_URL.slice(0, 40) + '...')
    const { createClient } = await import('@vercel/kv')
    const kv = createClient({ url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN })
    store = new DashboardStore(kv)
    console.log('[bootstrap] KV store created')
  } else {
    console.log('[bootstrap] KV not configured')
  }

  const loop = new AgentLoop({ monitor, decisionEngine, executor, strategy, logger, store })
  return loop
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  (async () => {
    const loop = await bootstrap()
    console.log('Starting LendGuard — Autonomous Lending Position Manager...')
    loop.start()
  })()
}
