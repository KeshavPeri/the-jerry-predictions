import { describe, expect, it } from 'vitest'
import { CompetitionLoadError, getSupabaseConfiguration } from './supabase'

describe('Supabase browser configuration', () => {
  it('requires both browser-safe values', () => {
    expect(() => getSupabaseConfiguration({})).toThrowError(
      expect.objectContaining<Partial<CompetitionLoadError>>({ kind: 'configuration' }),
    )
  })

  it('rejects invalid URLs, insecure remote URLs, and non-publishable keys', () => {
    expect(() =>
      getSupabaseConfiguration({
        VITE_SUPABASE_URL: 'not-a-url',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
      }),
    ).toThrowError(expect.objectContaining<Partial<CompetitionLoadError>>({ kind: 'configuration' }))
    expect(() =>
      getSupabaseConfiguration({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_never-in-browser',
      }),
    ).toThrowError(expect.objectContaining<Partial<CompetitionLoadError>>({ kind: 'configuration' }))
    expect(() =>
      getSupabaseConfiguration({
        VITE_SUPABASE_URL: 'http://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    ).toThrowError(expect.objectContaining<Partial<CompetitionLoadError>>({ kind: 'configuration' }))
  })

  it('returns only the URL and publishable key used by the browser client', () => {
    expect(
      getSupabaseConfiguration({
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example',
      }),
    ).toEqual({
      url: 'https://example.supabase.co/',
      publishableKey: 'sb_publishable_example',
    })
  })
})
