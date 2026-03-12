const VALID_ACTIONS = new Set(['supply', 'repay', 'withdraw', 'hold'])

function safeReplacer (_, v) {
  if (typeof v === 'bigint') return v.toString()
  if (typeof v === 'number' && !isFinite(v)) return String(v)
  return v
}

function stripFences (text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
}

export class DecisionEngine {
  constructor (llmClient, strategy) {
    this._llm = llmClient
    this._strategy = strategy
  }

  async decide (snapshots) {
    let response
    try {
      response = await this._llm.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: 'You are an autonomous DeFi lending position manager. Analyze the provided on-chain snapshots and strategy parameters, then respond with a JSON object containing: action ("supply"|"repay"|"withdraw"|"hold"), chain (chain name or null), amountUSDT (number), reasoning (string), confidence (0-1), urgency ("low"|"medium"|"high"). Protect health factor, optimize yield. Respond ONLY with valid JSON, no markdown.',
        messages: [{ role: 'user', content: JSON.stringify({ snapshots, strategy: this._strategy }, safeReplacer) }]
      })
    } catch {
      return { action: 'hold' }
    }
    let parsed
    try {
      parsed = JSON.parse(stripFences(response.content[0].text))
    } catch {
      return { action: 'hold' }
    }
    if (!VALID_ACTIONS.has(parsed.action)) return { action: 'hold' }
    return {
      action: parsed.action,
      chain: parsed.chain,
      amountRaw: BigInt(Math.round((parsed.amountUSDT ?? 0) * 1_000000)),
      reasoning: parsed.reasoning,
      confidence: parsed.confidence,
      urgency: parsed.urgency
    }
  }
}
