export function DotOSMark({ size = 30 }: { size?: number }) {
  return <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true"><path d="M7 6h7c8 0 12 4 12 10s-4 10-12 10H7V6Z" stroke="currentColor" strokeWidth="4"/><path d="M7 16h8" stroke="currentColor" strokeWidth="4"/></svg>
}
export function DotOSWordmark() {
  return <span className="os-wordmark"><span>Dot<span className="os-wordmark-os">OS</span></span></span>
}
