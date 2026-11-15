/** Antigravity card on the Models page (`settings.models.footer`), shaped like Codex Connect's. */

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AntigravityAuthRpcClient } from '../rpc-contract.ts'
import type { QuotaStatusView } from '../quota.ts'
import type { AntigravityStatusView } from '../status.ts'
import type { AntigravityAuthKey } from './locales.ts'
import { QuotaVisualDashboard } from './AntigravityAuthSettings.tsx'
import { ensureSettingsStyles } from './styles.ts'

export interface AntigravityModelsCardProps {
  readonly rpc: AntigravityAuthRpcClient
  readonly t: (key: AntigravityAuthKey) => string
  readonly subscribe: (listener: () => void) => () => void
}

const secondary = { color: 'var(--dsw-alias-label-secondary, #888)', fontSize: 12, lineHeight: '18px' } as const
const button = {
  height: 32, padding: '0 14px', borderRadius: 8, cursor: 'pointer', font: 'inherit', fontSize: 13,
  border: '1px solid var(--dsw-alias-border-l2, rgba(127,127,127,.3))', background: 'transparent', color: 'inherit',
} as const

/** Signed in when the single store holds a credential or the pool has an account. */
export function antigravitySignedIn(status: AntigravityStatusView | null): boolean {
  if (status === null) return false
  return status.credential?.configured === true || status.accounts.length > 0
}

export function AntigravityModelsCard({ rpc, t, subscribe }: AntigravityModelsCardProps): ReactNode {
  const [status, setStatus] = useState<AntigravityStatusView | null>(null)
  const [quota, setQuota] = useState<QuotaStatusView | null>(null)
  const [quotaError, setQuotaError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await rpc.status()
      if (result.ok) setStatus(result.value.status)
    } catch { /* the card stays on its last state */ }
  }, [rpc])
  const loadQuota = useCallback(async (force = false) => {
    if (rpc.usage === undefined) return
    setBusy(true)
    try {
      const result = await rpc.usage(undefined, force)
      if (result.ok) { setQuota(result.value); setQuotaError(null) } else setQuotaError(result.error.message || t('quotaFailed'))
    } catch { setQuotaError(t('quotaFailed')) } finally { setBusy(false) }
  }, [rpc, t])

  useEffect(() => { ensureSettingsStyles() }, [])
  useEffect(() => { void load() }, [load])
  useEffect(() => subscribe(() => { void load() }), [subscribe, load])
  useEffect(() => { if (open && quota === null) void loadQuota() }, [open, quota, loadQuota])

  const signedIn = antigravitySignedIn(status)
  useEffect(() => { if (!signedIn) setOpen(false) }, [signedIn])
  const active = status?.accounts.find(account => account.active) ?? status?.accounts[0]
  const email = active?.email
  const others = (status?.accounts.length ?? 0) - 1

  return (
    <div style={{ border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, padding: '12px 14px', color: 'var(--dsw-alias-label-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 14, lineHeight: '22px', fontWeight: 500 }}>{t('modelsCardName')}</span>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 4, background: signedIn ? '#16a34a' : 'var(--dsw-alias-label-secondary, #888)' }} />
        <span role="status" style={{ ...secondary, flex: 1 }}>{signedIn ? t('modelsSignedIn') : t('modelsSignedOut')}</span>
      </div>
      <div style={{ ...secondary, marginTop: 4 }}>{t('modelsPowered')}</div>
      {signedIn && email !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 18, display: 'grid', placeItems: 'center', fontWeight: 600, background: 'var(--dsw-alias-border-l2, rgba(127,127,127,.2))' }}>
            {email.trim().charAt(0).toUpperCase()}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600 }}>{email}</span>
            <span style={secondary}>{t('accountsActive')}{others > 0 ? ` · +${others}` : ''}</span>
          </div>
        </div>
      )}
      {signedIn && rpc.usage !== undefined && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" style={button} aria-expanded={open} onClick={() => { setOpen(!open) }}>{open ? t('modelsHideQuota') : t('modelsViewQuota')}</button>
          {open && <button type="button" style={button} disabled={busy} onClick={() => { void loadQuota(true) }}>{busy ? t('quotaLoading') : t('quotaRefresh')}</button>}
        </div>
      )}
      {open && signedIn && (
        <div style={{ borderTop: '1px solid var(--dsw-alias-border-l2)', marginTop: 12, paddingTop: 12 }}>
          <QuotaVisualDashboard quota={quota} busy={busy} error={quotaError} t={t} />
        </div>
      )}
      <div style={{ ...secondary, marginTop: 12 }}>{t('modelsHelp')}</div>
    </div>
  )
}
