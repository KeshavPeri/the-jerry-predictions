import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
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

  it('keeps the database transition guard: drafts may lock once, but locked entries reject ordinary anonymous writes', () => {
    const migration = readFileSync('supabase/migrations/202608190001_fixed_competition.sql', 'utf8')
    expect(migration).toContain("if old.status <> 'draft' then")
    expect(migration).toContain("raise exception 'Anonymous clients cannot change a locked entry'")
    expect(migration).toContain("if new.status = 'locked' and old.status = 'draft' then")
  })
})
