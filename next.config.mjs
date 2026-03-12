/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
    serverComponentsExternalPackages: [
      '@tetherto/wdk-wallet-evm',
      '@tetherto/wdk-protocol-lending-aave-evm',
      '@anthropic-ai/sdk',
      'ethers'
    ]
  }
}

export default nextConfig
