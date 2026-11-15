/**
 * One-time move from the removed multi-account pool to the single-record store.
 *
 * This fork keeps exactly one Antigravity account. Installs that signed in
 * while the pool existed hold their credential in `accounts.json` beside the
 * single-record `auth.json`. On first start the active pooled account is
 * written as the single record (same refresh token, project and lineage, so
 * gate evidence stays valid) and the pool file is renamed to
 * `accounts.json.migrated`. Nothing happens when `auth.json` already exists or
 * there is no usable pooled account.
 */

import { existsSync, readFileSync, renameSync, writeFileSync, chmodSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { makeAuthRecord } from './auth-store.ts'

export function poolPathFor(storePath: string): string {
  return join(dirname(storePath), 'accounts.json')
}

interface PooledAccount {
  refreshToken?: unknown
  projectId?: unknown
  email?: unknown
  lineage?: unknown
}

/**
 * Adopt the active pooled account as the single record.
 * @returns `true` when a record was written.
 */
export function adoptPooledAccount(
  storePath: string,
  maskEmail: (value: string | undefined) => string | undefined,
  poolPath: string = poolPathFor(storePath),
): boolean {
  if (existsSync(storePath) || !existsSync(poolPath)) return false
  let pool: { accounts?: unknown; activeIndex?: unknown }
  try { pool = JSON.parse(readFileSync(poolPath, 'utf8')) as typeof pool } catch { return false }
  const accounts = Array.isArray(pool.accounts) ? pool.accounts as PooledAccount[] : []
  const index = typeof pool.activeIndex === 'number' && Number.isInteger(pool.activeIndex) ? pool.activeIndex : 0
  const active = accounts[index] ?? accounts[0]
  if (active === undefined || typeof active.refreshToken !== 'string' || active.refreshToken.length === 0
    || typeof active.projectId !== 'string' || active.projectId.length === 0) return false

  const email = typeof active.email === 'string' ? maskEmail(active.email) : undefined
  const record = makeAuthRecord({
    refreshToken: active.refreshToken,
    projectId: active.projectId,
    ...email === undefined ? {} : { email },
    ...typeof active.lineage === 'string' && active.lineage.length > 0 ? { lineage: active.lineage } : {},
  }, 1)
  const temporary = join(dirname(storePath), `.${randomUUID()}.tmp`)
  writeFileSync(temporary, `${JSON.stringify(record)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
  chmodSync(temporary, 0o600)
  renameSync(temporary, storePath)
  renameSync(poolPath, `${poolPath}.migrated`)
  return true
}
