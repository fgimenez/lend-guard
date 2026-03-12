export function parseStrategy (raw = {}) {
  return {
    minHealthFactor: raw.minHealthFactor ?? 1.5,
    targetHealthFactor: raw.targetHealthFactor ?? 2.0,
    intervalMinutes: raw.intervalMinutes ?? 30,
    chains: raw.chains ?? ['ethereum', 'arbitrum', 'base', 'optimism']
  }
}

export function validateStrategy (s) {
  if (s.minHealthFactor < 1) throw new Error('minHealthFactor must be >= 1')
  if (s.minHealthFactor >= s.targetHealthFactor) throw new Error('minHealthFactor must be less than targetHealthFactor')
  if (s.intervalMinutes < 1) throw new Error('intervalMinutes must be >= 1')
  if (!s.chains || s.chains.length === 0) throw new Error('chains must not be empty')
  const supported = ['ethereum', 'arbitrum', 'base', 'optimism', 'polygon', 'avalanche', 'bnb', 'baseSepolia']
  for (const chain of s.chains) {
    if (!supported.includes(chain)) throw new Error(`unknown chain: ${chain}`)
  }
}
