export const CHAIN = { id: 4663, hexId: '0x1237', name: 'Robinhood Chain', currency: 'ETH', rpc: 'https://rpc.mainnet.chain.robinhood.com', explorer: 'https://robinhoodchain.blockscout.com', confirmations: 12 } as const
export const PONS = { factory: '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e', hook: '0xE5e702641Ea86F4ae6cC3cDaeD2B886f976Be044', escrow: '0xd3AFEB2a57f70eF218Aa82451c51B2fb0416Ac9e' } as const
export type SkillManifest = { name: string; version: string; chainId: number; status: 'read-only' | 'unavailable'; source: string; contracts: string[]; permissions: string[]; cost: string; reason?: string }
const available = (name: string, source: string, contracts: string[] = []): SkillManifest => ({ name, version: '1.0.0', chainId: CHAIN.id, status: 'read-only', source, contracts, permissions: ['read public data', 'notify'], cost: 'Free; no transactions' })
const unavailable = (name: string, reason: string): SkillManifest => ({ ...available(name, 'No verified adapter'), status: 'unavailable', permissions: [], reason })
export const MANIFESTS: SkillManifest[] = [
  available('Portfolio Monitor', 'Robinhood Chain RPC: ETH + configured ERC-20 balances'),
  available('Wallet Tracker', 'Robinhood Chain blocks + ERC-20 Transfer logs'),
  available('Pons Launch Watcher', 'Pons V2 launch / graduation events + bonding curve', [PONS.factory]),
  available('Pons Fee Monitor', 'Pons V2 escrow credits / claims + curve / hook', [PONS.factory, PONS.escrow, PONS.hook]),
  available('Token Price Watcher', 'Coinbase ETH/USD; Pons V2 ETH-paired curve / Uniswap v4 pool'),
  unavailable('Reward Scanner', 'A verified Robinhood Chain reward adapter is required.'),
  unavailable('Scheduled Purchase', 'Transaction execution and smart-account permissions are a later phase.'),
  unavailable('Position Monitor', 'A verified lending or liquidity protocol adapter is required.'),
  unavailable('Stock Token Monitor', 'Requires a verified stock-token registry and corporate-action data.'),
]
export const availableSkill = (name: string) => MANIFESTS.some(skill => skill.name === name && skill.status === 'read-only')
