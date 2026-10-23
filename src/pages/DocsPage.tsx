import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { DotOSWordmark } from '@/components/brand/DotOSBrand'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { mateRenderProps } from '@/components/dotmate/render-images'
import { CREW } from '@/landing/experience/data'
import { DOCS } from '@/content/docs'
import { PROJECT_X_URL } from '@/content/links'
import { usePageMetadata } from '@/lib/usePageMetadata'
import './docs.css'

export function DocsPage() {
  usePageMetadata('/docs')
  const { hash } = useLocation()
  const [query, setQuery] = useState(''), [active, setActive] = useState('start')
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const visible = DOCS.filter(section => terms.every(term => `${section.title} ${section.intro} ${section.blocks.map(block => `${block.title} ${block.text}`).join(' ')}`.toLowerCase().includes(term)))
  useEffect(() => {
    const previousTitle = document.title, previousScheme = document.documentElement.style.colorScheme
    document.title = 'Docs — DotOS'
    document.documentElement.style.colorScheme = 'dark'
    if (!window.location.hash) window.scrollTo(0, 0)
    return () => { document.title = previousTitle; document.documentElement.style.colorScheme = previousScheme }
  }, [])
  useEffect(() => {
    const id = hash.slice(1)
    if (DOCS.some(section => section.id === id)) {
      const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
      return () => cancelAnimationFrame(frame)
    }
  }, [hash, query])
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const entry = entries.find(item => item.isIntersecting)
      if (entry) setActive(entry.target.id)
    }, { rootMargin: '-90px 0px -55% 0px' })
    document.querySelectorAll('.docs-section').forEach(section => observer.observe(section))
    return () => observer.disconnect()
  }, [query])
  return <div className="docs-page">
    <a className="docs-skip" href="#docs-content">Skip to documentation</a>
    <header className="docs-header"><Link to="/" aria-label="DotOS home"><DotOSWordmark /></Link><nav aria-label="Main navigation"><Link to="/">Home</Link><Link to="/docs" aria-current="page">Docs</Link><Link className="docs-open" to="/app">Open DotOS <SvgIcon name="arrow-up-right" size={16} /></Link></nav></header>
    <div className="docs-layout">
      <aside className="docs-sidebar">
        <label className="docs-search"><SvgIcon name="scan-eye" size={18} /><input type="search" aria-label="Search documentation" placeholder="Search docs…" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <nav aria-label="Documentation chapters">{DOCS.map((section, index) => <a key={section.id} href={`#${section.id}`} aria-current={active === section.id ? 'location' : undefined} onClick={() => setQuery('')}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a>)}</nav>
        <a className="docs-support" href={PROJECT_X_URL} target="_blank" rel="noopener noreferrer">Talk to the team <SvgIcon name="arrow-up-right" size={15} /></a>
      </aside>
      <main id="docs-content" className="docs-content" tabIndex={-1}>
        <div className="docs-hero"><div><p className="docs-eyebrow">The DotOS handbook</p><h1>Know your Dots.<br /><em>Make them yours.</em></h1><p>From your first watch to the details behind every signal.</p><a className="docs-start" href="#start" onClick={() => setQuery('')}>Start here <SvgIcon name="arrow-down" size={17} /></a></div><div className="docs-crew" aria-hidden="true">{CREW.map((mate, i) => <img key={mate.id} {...mateRenderProps(mate.body, mate.color, '(max-width: 700px) 85px, 115px')} className={`docs-mate docs-mate-${i}`} width="135" height="156" alt="" />)}</div></div>
        <div className="docs-meta"><span>Robinhood Chain · Mainnet</span><span>Updated November 4, 2026</span></div>
        {query && <div className="docs-results" role="status">{visible.length ? `${visible.length} matching chapters` : 'No matching chapters. Try “wallet”, “AI” or “notifications”.'}<button type="button" onClick={() => setQuery('')}>Clear search</button></div>}
        {visible.map(section => <section className="docs-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}><div className="docs-section-heading"><span>{String(DOCS.indexOf(section) + 1).padStart(2, '0')}</span><h2 id={`${section.id}-title`}><a href={`#${section.id}`}>{section.title}</a></h2></div><p className="docs-intro">{section.intro}</p>{section.blocks.map(block => <div className="docs-block" key={block.title}><h3>{block.title}</h3><p>{block.text}</p></div>)}{section.action && <Link className="docs-action" to={section.action.to}>{section.action.label}<SvgIcon name="arrow-up-right" size={16} /></Link>}</section>)}
        <footer className="docs-footer"><Link to="/privacy">Access & privacy</Link><a href={PROJECT_X_URL} target="_blank" rel="noopener noreferrer">Official X</a><a href="#docs-content">Back to top ↑</a></footer>
      </main>
    </div>
  </div>
}
