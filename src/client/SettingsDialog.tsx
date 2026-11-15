/** Modal for a card's "More settings", shaped like Codex Connect's configuration dialog. */

import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

export interface SettingsDialogProps {
  readonly title: string
  readonly closeLabel: string
  readonly onClose: () => void
  readonly children: ReactNode
}

export function SettingsDialog({ title, closeLabel, onClose, children }: SettingsDialogProps): ReactNode {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => { element?.close() }
  }, [])
  const close = (): void => {
    dialog.current?.close()
    onClose()
  }
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); close() }}
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); close() } }}
      style={{
        boxSizing: 'border-box', width: 'min(880px, calc(100vw - 32px))', maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
        padding: 20, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12,
        background: 'var(--dsw-alias-bg-layer-1, white)', color: 'var(--dsw-alias-label-primary)', margin: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <h2 id={titleId} style={{ margin: 0, fontSize: 18 }}>{title}</h2>
        <button
          type="button"
          onClick={close}
          style={{ height: 32, padding: '0 14px', borderRadius: 8, cursor: 'pointer', font: 'inherit', fontSize: 13, border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,.3))', background: 'transparent', color: 'inherit' }}
        >
          {closeLabel}
        </button>
      </div>
      {children}
    </dialog>
  )
}
