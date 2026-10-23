import { mateRenderProps } from '@/components/dotmate/render-images'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import { DotOSWordmark } from '@/components/brand/DotOSBrand'
import { SvgIcon } from '@/components/icons/SvgIcon'
import { CREW } from './data'

const CHAPTERS = [['crew', 'Meet the crew'], ['system', 'The next shift'], ['capabilities', 'The toolkit'], ['network', 'The live desk']]

export function ChapterMenu({ onClose, quiet }: { onClose: () => void; quiet: boolean }) {
  const host = useRef<HTMLDialogElement>(null), close = useRef<HTMLButtonElement>(null)
  const [preview, setPreview] = useState(0)
  useEffect(() => {
    const dialog = host.current!
    const previous = document.activeElement as HTMLElement | null
    const body = document.body.style.overflow, root = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden'
    dialog.showModal(); close.current?.focus({ preventScroll: true })
    return () => { dialog.close(); document.body.style.overflow = body; document.documentElement.style.overflow = root; previous?.focus({ preventScroll: true }) }
  }, [])
  return <motion.dialog ref={host} id="experience-menu" className="chapter-menu" aria-label="Explore DotOS" onCancel={event => { event.preventDefault(); onClose() }} initial={quiet ? false : { clipPath: 'inset(0 0 100% 0 round 0 0 30px 30px)' }} animate={{ clipPath: 'inset(0 0 0% 0 round 0px)' }} exit={{ clipPath: quiet ? 'inset(0)' : 'inset(100% 0 0 0 round 30px 30px 0 0)' }} transition={{ duration: quiet ? 0 : .55, ease: [.76, 0, .24, 1] }}>
    <div className="chapter-menu-inner"><header><DotOSWordmark /><button ref={close} type="button" aria-label="Close menu" onClick={onClose}>Close<SvgIcon name="x" size={22} /></button></header><div className="chapter-menu-body"><nav aria-label="Site chapters">{CHAPTERS.map(([id, name], index) => <motion.a key={id} href={`#${id}`} onClick={onClose} onMouseEnter={() => setPreview(index)} onFocus={() => setPreview(index)} data-selected={preview === index || undefined} initial={quiet ? false : { y: 45, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: quiet ? 0 : .6, delay: quiet ? 0 : .15 + index * .07 }}><div><strong>{name}</strong></div><SvgIcon name="arrow-up-right" size={28} /></motion.a>)}</nav><div className="chapter-menu-preview" aria-hidden="true"><AnimatePresence mode="wait" initial={false}><motion.img key={preview} {...mateRenderProps(CREW[preview].body,CREW[preview].color,'(max-width: 760px) 110px, 330px')} alt="" width="400" height="440" initial={{ opacity: 0, y: quiet ? 0 : 30, rotate: quiet ? 0 : -10, scale: quiet ? 1 : .8 }} animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }} exit={{ opacity: 0, y: quiet ? 0 : -25, rotate: quiet ? 0 : 8 }} transition={{ duration: quiet ? 0 : .3 }} /></AnimatePresence><strong style={{ color: CREW[preview].accent }}>{CREW[preview].name}</strong></div></div><footer><Link to="/docs" onClick={onClose}>Docs<SvgIcon name="arrow-up-right" size={18} /></Link><Link to="/app" onClick={onClose}>Open your workspace<SvgIcon name="arrow-up-right" size={18} /></Link></footer></div>
  </motion.dialog>
}
