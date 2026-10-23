import { CHAIN } from '../../../shared/chain'
import type { WalletProvider } from './types'
type Provider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; isMetaMask?: boolean; isRabby?: boolean; isCoinbaseWallet?: boolean; providers?: Provider[] }
const announced = new Map<string, Provider>()
window.addEventListener('eip6963:announceProvider', ((event: CustomEvent<{ info: { rdns: string }; provider: Provider }>) => { announced.set(event.detail.info.rdns, event.detail.provider) }) as EventListener)
window.dispatchEvent(new Event('eip6963:requestProvider'))
export function extension(kind: WalletProvider): Provider {
  const root = (window as unknown as { ethereum?: Provider }).ethereum
  const rdns = { metamask: 'io.metamask', rabby: 'io.rabby', coinbase: 'com.coinbase.wallet' }[kind as 'metamask' | 'rabby' | 'coinbase']
  const list = [...announced.values(), ...(root?.providers ?? (root ? [root] : []))]
  const provider = announced.get(rdns) ?? list.find(p => kind === 'injected' || kind === 'metamask' && p.isMetaMask && !p.isRabby || kind === 'rabby' && p.isRabby || kind === 'coinbase' && p.isCoinbaseWallet)
  if (!provider) throw Error(`Open or install ${kind} with EVM support.`)
  return provider
}
export async function connectEvm(kind: WalletProvider) {
  const wallet = extension(kind)
  const accounts = await wallet.request({ method: 'eth_requestAccounts' }) as string[]
  if (!Array.isArray(accounts) || !/^0x[0-9a-f]{40}$/i.test(accounts[0])) throw Error('The wallet returned an invalid EVM address.')
  if (Number(await wallet.request({ method: 'eth_chainId' })) !== CHAIN.id) {
    try { await wallet.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN.hexId }] }) }
    catch (error) {
      if ((error as { code?: number }).code !== 4902) throw error
      await wallet.request({ method: 'wallet_addEthereumChain', params: [{ chainId: CHAIN.hexId, chainName: CHAIN.name, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: [CHAIN.rpc], blockExplorerUrls: [CHAIN.explorer] }] })
      await wallet.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN.hexId }] })
    }
  }
  if (Number(await wallet.request({ method: 'eth_chainId' })) !== CHAIN.id) throw Error('Select Robinhood Chain before continuing.')
  return { wallet, address: accounts[0].toLowerCase() }
}
export const messageHex = (text: string) => '0x' + Array.from(new TextEncoder().encode(text), b => b.toString(16).padStart(2, '0')).join('')
