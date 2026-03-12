import { describe, it, expect, vi } from 'vitest'
import { DecisionEngine } from '../../src/agent/decision.js'

describe('decision module', () => {
  it('can be imported', () => {})

  it('exports DecisionEngine as a class', () => {
    expect(typeof DecisionEngine).toBe('function')
  })

  it('can be instantiated with an llm client and strategy', () => {
    expect(() => new DecisionEngine({}, {})).not.toThrow()
  })

  it('has a decide method', () => {
    expect(typeof new DecisionEngine({}, {}).decide).toBe('function')
  })

  const makeStubLlm = (text = '{"action":"hold","chain":null,"amountUSDT":0,"reasoning":"ok","confidence":1,"urgency":"low"}') => ({
    messages: { create: vi.fn().mockResolvedValue({ content: [{ text }] }) }
  })

  it('decide returns a promise', () => {
    const engine = new DecisionEngine(makeStubLlm(), {})
    expect(engine.decide([])).toBeInstanceOf(Promise)
  })

  it('decide resolves to an object with an action field', async () => {
    const engine = new DecisionEngine(makeStubLlm(), {})
    const result = await engine.decide([])
    expect(result).toHaveProperty('action')
  })

  it('decide calls llmClient.messages.create once', async () => {
    const create = vi.fn().mockResolvedValue({ content: [{ text: '{"action":"hold","chain":null,"amountUSDT":0,"reasoning":"ok","confidence":1,"urgency":"low"}' }] })
    const engine = new DecisionEngine({ messages: { create } }, {})
    await engine.decide([])
    expect(create).toHaveBeenCalledOnce()
  })

  it('decide passes a model id containing "haiku" to the llm', async () => {
    const llm = makeStubLlm()
    const engine = new DecisionEngine(llm, {})
    await engine.decide([])
    expect(llm.messages.create.mock.calls[0][0].model).toContain('haiku')
  })

  it('decide passes a system prompt to the llm', async () => {
    const llm = makeStubLlm()
    const engine = new DecisionEngine(llm, {})
    await engine.decide([])
    expect(llm.messages.create.mock.calls[0][0].system).toBeDefined()
  })

  it('decide passes max_tokens to the llm', async () => {
    const llm = makeStubLlm()
    const engine = new DecisionEngine(llm, {})
    await engine.decide([])
    expect(llm.messages.create.mock.calls[0][0].max_tokens).toBeGreaterThan(0)
  })

  it('decide includes snapshot chain name in the message sent to the llm', async () => {
    const llm = makeStubLlm()
    const engine = new DecisionEngine(llm, {})
    const snapshot = { chain: 'arbitrum', healthFactor: 2.0 }
    await engine.decide([snapshot])
    const body = JSON.stringify(llm.messages.create.mock.calls[0][0])
    expect(body).toContain('arbitrum')
  })

  it('decide returns the action from the llm response', async () => {
    const engine = new DecisionEngine(makeStubLlm('{"action":"repay","chain":"base","amountUSDT":100,"reasoning":"low hf","confidence":0.9,"urgency":"high"}'), {})
    const result = await engine.decide([])
    expect(result.action).toBe('repay')
  })

  it('decide returns chain, reasoning, confidence, and urgency from the llm response', async () => {
    const engine = new DecisionEngine(makeStubLlm('{"action":"supply","chain":"optimism","amountUSDT":50,"reasoning":"good apy","confidence":0.8,"urgency":"low"}'), {})
    const result = await engine.decide([])
    expect(result.chain).toBe('optimism')
    expect(result.reasoning).toBe('good apy')
    expect(result.confidence).toBe(0.8)
    expect(result.urgency).toBe('low')
  })

  it('decide converts amountUSDT to amountRaw bigint with 6 decimals', async () => {
    const engine = new DecisionEngine(makeStubLlm('{"action":"supply","chain":"base","amountUSDT":100.5,"reasoning":"","confidence":1,"urgency":"low"}'), {})
    const result = await engine.decide([])
    expect(result.amountRaw).toBe(100_500000n)
  })

  it('decide returns hold when the llm returns invalid json', async () => {
    const engine = new DecisionEngine(makeStubLlm('not valid json'), {})
    const result = await engine.decide([])
    expect(result.action).toBe('hold')
  })

  it('decide strips markdown code fences before parsing', async () => {
    const engine = new DecisionEngine(makeStubLlm('```json\n{"action":"supply","chain":"base","amountUSDT":50,"reasoning":"ok","confidence":0.9,"urgency":"low"}\n```'), {})
    const result = await engine.decide([])
    expect(result.action).toBe('supply')
  })

  it('decide serializes Infinity health factor as the string "Infinity"', async () => {
    const llm = makeStubLlm()
    const engine = new DecisionEngine(llm, {})
    await engine.decide([{ chain: 'arbitrum', healthFactor: Infinity }])
    const body = JSON.parse(llm.messages.create.mock.calls[0][0].messages[0].content)
    expect(body.snapshots[0].healthFactor).toBe('Infinity')
  })

  it('decide returns hold when the llm call throws', async () => {
    const llm = { messages: { create: vi.fn().mockRejectedValue(new Error('network error')) } }
    const engine = new DecisionEngine(llm, {})
    const result = await engine.decide([])
    expect(result.action).toBe('hold')
  })
})
