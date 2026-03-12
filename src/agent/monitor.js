const WAD = 10n ** 18n
const MAX_UINT256 = 2n ** 256n - 1n

export function normalizeHealthFactor (raw) {
  if (raw === MAX_UINT256) return Infinity
  return Number(raw * 10000n / WAD) / 10000
}

const RAY = 10n ** 27n

export function normalizeAPY (rayRate) {
  if (rayRate === 0n) return 0
  return Number(rayRate * 10000n / RAY) / 100
}

export function buildSnapshot (chain, rawAccountData, walletUSDTBalance, supplyRayRate) {
  return {
    chain,
    healthFactor: normalizeHealthFactor(rawAccountData.healthFactor),
    totalCollateralUSD: Number(rawAccountData.totalCollateralBase) / 1e8,
    totalDebtUSD: Number(rawAccountData.totalDebtBase) / 1e8,
    walletUSDTBalance,
    supplyAPY: normalizeAPY(supplyRayRate),
    timestamp: new Date()
  }
}
