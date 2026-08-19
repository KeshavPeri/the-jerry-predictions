import { describe, expect, it } from 'vitest'
import {
  CompetitionDataError,
  mapEntryStatus,
  parseCompetitionHome,
  readSelectedProfile,
  rememberSelectedProfile,
  SELECTED_PROFILE_KEY,
} from './competition'

const competitionRow = {
  id: 'competition-id',
  slug: 'the-jerry-predictions-2026-27',
  title: 'THE JERRY PREDICTIONS',
  subtitle: '2026/27 Football Prediction Competition',
}

const participants = [
  { id: 'ke', competition_id: 'competition-id', slug: 'keshav', display_name: 'Keshav', monogram: 'KE', display_order: 1 },
  { id: 'an', competition_id: 'competition-id', slug: 'anshul', display_name: 'Anshul', monogram: 'AN', display_order: 2 },
  { id: 'ki', competition_id: 'competition-id', slug: 'kshitij', display_name: 'Kshitij', monogram: 'KI', display_order: 3 },
  { id: 'pa', competition_id: 'competition-id', slug: 'parth', display_name: 'Parth', monogram: 'PA', display_order: 4 },
]

const entries = participants.map(({ id }) => ({ participant_id: id, status: 'draft', predictions: {} }))

describe('competition parsing', () => {
  it('maps blank drafts, nonblank drafts, and locked entries to display status', () => {
    expect(mapEntryStatus('draft', {})).toBe('Not started')
    expect(mapEntryStatus('draft', { answer: '  ' })).toBe('Not started')
    expect(mapEntryStatus('draft', { version: 1, cups: {}, questions: {} })).toBe('Not started')
    expect(mapEntryStatus('draft', { answer: 'Arsenal' })).toBe('In progress')
    expect(mapEntryStatus('locked', {})).toBe('Locked')
  })

  it('parses only the exact ordered fixed profile set', () => {
    const result = parseCompetitionHome(competitionRow, [...participants].reverse(), entries)
    expect(result.profiles.map(({ name, monogram }) => [name, monogram])).toEqual([
      ['Keshav', 'KE'],
      ['Anshul', 'AN'],
      ['Kshitij', 'KI'],
      ['Parth', 'PA'],
    ])
  })

  it('classifies empty and malformed records without creating defaults', () => {
    expect(() => parseCompetitionHome(null, [], [])).toThrowError(
      expect.objectContaining<Partial<CompetitionDataError>>({ kind: 'empty' }),
    )
    expect(() => parseCompetitionHome(competitionRow, participants.slice(0, 3), entries)).toThrowError(
      expect.objectContaining<Partial<CompetitionDataError>>({ kind: 'invalid' }),
    )
    expect(() => mapEntryStatus('mystery', {})).toThrowError(
      expect.objectContaining<Partial<CompetitionDataError>>({ kind: 'invalid' }),
    )
    expect(() => mapEntryStatus('locked', null)).toThrowError(
      expect.objectContaining<Partial<CompetitionDataError>>({ kind: 'invalid' }),
    )
  })
})

describe('profile persistence', () => {
  it('stores and reads only an approved profile slug', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    }

    rememberSelectedProfile(storage, 'keshav')
    expect(values.get(SELECTED_PROFILE_KEY)).toBe('keshav')
    expect(readSelectedProfile(storage)).toBe('keshav')
    values.set(SELECTED_PROFILE_KEY, 'intruder')
    expect(readSelectedProfile(storage)).toBeNull()
  })
})
