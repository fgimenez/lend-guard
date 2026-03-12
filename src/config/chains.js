export const CHAIN_CONFIG = {
  ethereum: {
    chainId: 1,
    rpcUrl: process.env.RPC_ETHEREUM || 'https://eth.drpc.org',
    usdtAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
  },
  arbitrum: {
    chainId: 42161,
    rpcUrl: process.env.RPC_ARBITRUM || 'https://arb1.arbitrum.io/rpc',
    usdtAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
  },
  base: {
    chainId: 8453,
    rpcUrl: process.env.RPC_BASE || 'https://mainnet.base.org',
    usdtAddress: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2'
  },
  optimism: {
    chainId: 10,
    rpcUrl: process.env.RPC_OPTIMISM || 'https://mainnet.optimism.io',
    usdtAddress: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'
  },
  sepolia: {
    chainId: 11155111,
    rpcUrl: process.env.RPC_SEPOLIA || 'https://rpc.sepolia.org',
    usdtAddress: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0'
  },
  baseSepolia: {
    chainId: 84532,
    rpcUrl: process.env.RPC_BASE_SEPOLIA || 'https://sepolia.base.org',
    usdtAddress: '0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a'
  }
}
