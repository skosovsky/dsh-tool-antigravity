import { describe, expect, it } from 'vitest'
import { neutralizeHostIdentity } from '../src/llm-adapter.ts'

describe('host identity neutralization', () => {
  it('rewrites the DSH identity line and keeps the rest unchanged', () => {
    const input = 'You are an AI agent powered by DeepSeek Harness.\n\nWork in ~/.dsh/profiles.'
    expect(neutralizeHostIdentity(input)).toBe('You are an AI agent.\n\nWork in ~/.dsh/profiles.')
  })
  it('is deterministic for prompt caching', () => {
    const input = 'You are an AI agent powered by DeepSeek Harness.'
    expect(neutralizeHostIdentity(input)).toBe(neutralizeHostIdentity(input))
  })
  it('leaves unrelated text alone', () => {
    expect(neutralizeHostIdentity('Use DeepSeek Harness tools carefully.')).toBe('Use DeepSeek Harness tools carefully.')
  })
})
