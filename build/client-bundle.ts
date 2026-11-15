import type { UserConfig } from 'tsdown'

/**
 * Browser client bundle: `lib/client.cjs`, registered through the Web app's
 * `window.__ModuleLoader__`. The loader calls `factory(require)` with the
 * `dsh.client.inject` module table, so React and first-party client packages
 * stay external and are resolved through that `require`.
 *
 * Reconstructed for the fork: upstream ignored `build/` in Git, so this helper
 * never reached the repository. Output shape matches published 0.5.5.
 */
export function clientBundle(packageName: string): UserConfig {
  return {
    name: `${packageName}-client`,
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    inputOptions: { platform: 'browser' },
    target: 'es2024',
    tsconfig: 'tsconfig.client.json',
    hash: false,
    clean: false,
    dts: false,
    sourcemap: true,
    deps: {
      neverBundle: [/^react(\/|$)/, /^react-dom(\/|$)/, /^@deepseek-ai\//],
    },
    outExtensions: () => ({ js: '.cjs' }),
    outputOptions: {
      banner: `window.__ModuleLoader__.load({\nid: ${JSON.stringify(packageName)},\nfactory: (require) => {\nvar module = { exports: {} };\nvar exports = module.exports;`,
      footer: 'return module.exports;\n}\n});',
    },
  }
}
