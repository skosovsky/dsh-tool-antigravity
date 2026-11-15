import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { adoptPooledAccount, poolPathFor } from '../src/pool-migration.ts'
import { readAuthRecord } from '../src/auth-store.ts'

const directories: string[] = []
const mask = (value: string | undefined): string | undefined =>
  value === undefined ? undefined : value.replace(/^(.).*(@.*)$/u, '$1***$2')

afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

async function fixture(pool: unknown): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-agy-pool-'))
  directories.push(dir)
  const storePath = join(dir, 'auth.json')
  if (pool !== undefined) await writeFile(poolPathFor(storePath), JSON.stringify(pool), 'utf8')
  return storePath
}

describe('pool migration', () => {
  it('adopts the active pooled account as the single record and masks the email', async () => {
    const storePath = await fixture({
      version: 1,
      accounts: [
        { refreshToken: 'rt-a', projectId: 'p-a', email: 'first@example.com', lineage: 'line-a' },
        { refreshToken: 'rt-b', projectId: 'p-b', email: 'second@example.com', lineage: 'line-b' },
      ],
      activeIndex: 1,
    })
    expect(adoptPooledAccount(storePath, mask)).toBe(true)
    const record = await readAuthRecord(storePath)
    expect(record).toMatchObject({ refreshToken: 'rt-b', projectId: 'p-b', lineage: 'line-b', email: 's***@example.com' })
    // The pool file is renamed, not left to be read again.
    expect(existsSync(poolPathFor(storePath))).toBe(false)
    expect(existsSync(`${poolPathFor(storePath)}.migrated`)).toBe(true)
  })

  it('does nothing when the single record already exists', async () => {
    const storePath = await fixture({ version: 1, accounts: [{ refreshToken: 'rt', projectId: 'p', lineage: 'l' }], activeIndex: 0 })
    await writeFile(storePath, JSON.stringify({ version: 1, refreshToken: 'kept', projectId: 'kept', revision: 1, updatedAt: '', lineage: 'l' }), 'utf8')
    expect(adoptPooledAccount(storePath, mask)).toBe(false)
    expect((await readFile(storePath, 'utf8')).includes('kept')).toBe(true)
    expect(existsSync(poolPathFor(storePath))).toBe(true)
  })

  it('returns false for a missing pool, an empty pool, or an unusable active account', async () => {
    expect(adoptPooledAccount(await fixture(undefined), mask)).toBe(false)
    expect(adoptPooledAccount(await fixture({ version: 1, accounts: [], activeIndex: 0 }), mask)).toBe(false)
    expect(adoptPooledAccount(await fixture({ version: 1, accounts: [{ projectId: 'p' }], activeIndex: 0 }), mask)).toBe(false)
  })
})
