/** A card's "More settings" expanded in place, below the card body (no modal). */

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export function InlineSettings({ children, className }: { readonly children: ReactNode; readonly className?: string }): ReactNode {
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => { panel.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }) }, [])
  return (
    <div
      ref={panel}
      {...className === undefined ? {} : { className }}
      style={{ borderTop: '1px solid var(--dsw-alias-border-l2)', marginTop: 12, paddingTop: 12, minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}
    >
      {children}
    </div>
  )
}
