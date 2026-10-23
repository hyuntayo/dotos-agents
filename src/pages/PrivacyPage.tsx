import { useEffect } from 'react'
import { Link } from 'react-router'
import { usePageMetadata } from '@/lib/usePageMetadata'
import { DotOSWordmark } from '@/components/brand/DotOSBrand'
import '../landing/dotos-landing.css'
import './privacy.css'

export function PrivacyPage() {
  usePageMetadata('/privacy')
  useEffect(() => { document.title = 'Access & privacy — DotOS'; window.scrollTo(0, 0) }, [])
  return <main className="data-page"><article>
    <nav><Link to="/" aria-label="DotOS home"><DotOSWordmark /></Link><Link to="/app/settings">System settings</Link></nav>
    <h1>Access & privacy.</h1>
    <p>DotOS is a personal AI workspace for read-only Robinhood Chain monitoring. This page describes the current service. Updated October 26, 2026.</p>
    <h2>Your workspace</h2>
    <p>The server stores your characters, task instructions, watched public addresses, monitoring results, alerts, preferences and conversations in a database. An essential, HttpOnly session cookie links this browser to your workspace and expires after one year. Browser storage also keeps appearance, tour and notification preferences.</p>
    <p>Anonymous access depends on that browser session. Optional wallet sign-in verifies a signed authentication message and links a public address to your saved account, so you can access it on another device. DotOS never asks for your seed phrase or stores your wallet private key.</p>
    <h2>Monitoring and notifications</h2>
    <p>Configured addresses and asset identifiers are sent to Robinhood Chain RPC, Coinbase and the Pons V2 contracts to read public data. Tasks run at their saved interval; source errors, request limits or outages can delay checks. Results include available timestamps and source data. Alerts appear in the dashboard. Optional Web Push notifications require browser permission and can arrive when the tab is closed. The server stores your browser’s push endpoint and encryption keys; your browser’s push provider delivers an encrypted, generic alert containing no watched addresses or task details. Delivery depends on browser and operating system settings. Disable notifications in Settings or sign out to remove this browser’s server subscription.</p>
    <h2>AI conversations</h2>
    <p>Chat messages and relevant workspace context — including watched public addresses, task settings and recent monitoring summaries — are sent through OpenRouter to the configured AI provider. Avoid entering passwords, seed phrases or confidential information. Provider data handling depends on the selected service; see <a href="https://openrouter.ai/privacy" target="_blank" rel="noreferrer">OpenRouter’s privacy policy</a>. AI responses can be inaccurate and should be checked against source data.</p>
    <h2>Your controls</h2>
    <p>Previous Solana workspaces are kept in a private archive, available from Settings. Their tasks do not run on Robinhood Chain. The previous Solana wallet can recover the same workspace; new wallet accounts use an EVM authentication signature.</p>
    <p>Settings lets you export your workspace, restore its setup, unlink a public address, sign out or reset the crew, tasks and history. Restoring replaces crew and tasks, starts monitoring with fresh observations and clears current conversations and history. Account access and the currently linked wallet remain yours. A reset keeps appearance and the currently linked public address. Conversations can also be cleared separately. The server keeps up to seven backup copies for recovery; deleted workspace content can remain in those copies until they rotate out.</p>
    <h2>Available access</h2>
    <p>DotOS is an independent project, with no official affiliation to Robinhood, Pons or ChatGPT. ETH pays network gas. The current workspace only reads public data.</p>
    <p>The public Network section displays aggregate counts of active Dots, enabled responsibilities, retained checks and recent alerts. It does not publish wallet addresses, task instructions or conversations.</p>
    <p>A free workspace supports up to six Dots and forty active monitoring tasks. AI conversations share the service’s daily allowance and upstream limits. DotOS does not hold funds or provide deposits, withdrawals, trading execution or paid subscriptions.</p>
    <p><Link to="/app">Open your workspace</Link></p>
  </article></main>
}
