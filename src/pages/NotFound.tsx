import { mateRenderProps } from '@/components/dotmate/render-images'
import { Link } from 'react-router'
import { DotOSWordmark } from '@/components/brand/DotOSBrand'
import { SvgIcon } from '@/components/icons/SvgIcon'
import '../landing/dotos-landing.css'

export function NotFound() {
  return (
    <div className="dotos-site os-not-found"><Link to="/" aria-label="DotOS home"><DotOSWordmark /></Link><img {...mateRenderProps('owl','mint','300px')} alt="IGGY" /><span className="os-eyebrow">404 / UNMAPPED SECTOR</span><h1>This route is off duty.</h1><p>Let’s get you back to your system.</p><Link className="os-button" to="/app">Open DotOS<SvgIcon name="arrow-up-right" size={17} /></Link></div>
  )
}
