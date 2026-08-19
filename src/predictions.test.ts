import { describe, expect, it } from 'vitest'
import { answeredCount, emptyPredictions, normalizeManualAnswer, parsePredictionPayload, parseWholeNumber } from './predictions'

describe('prediction payload helpers', () => {
  it('normalizes and limits manual answers', () => {
    expect(normalizeManualAnswer('  Ada   Lovelace  ')).toBe('Ada Lovelace')
    expect(normalizeManualAnswer('a'.repeat(121))).toHaveLength(120)
  })
  it('accepts only non-negative whole numbers', () => {
    expect(parseWholeNumber('0')).toBe(0)
    expect(parseWholeNumber('12')).toBe(12)
    expect(parseWholeNumber('-1')).toBeNull()
    expect(parseWholeNumber('1.5')).toBeNull()
  })
  it('loads only known valid answers and counts completed fields', () => {
    const payload = parsePredictionPayload({ cups: { 'FA Cup': '  Arsenal ' }, questions: { 'chelsea-red-cards': 3, 'arsenal-chelsea-emirates': { home: 0, away: 0 }, unknown: 'no' } })
    expect(payload.cups['FA Cup']).toBe('Arsenal')
    expect(answeredCount(payload)).toBe(3)
    expect(parsePredictionPayload(null)).toEqual(emptyPredictions())
  })

  it('enforces the declared answer shape for every question', () => {
    const payload = parsePredictionPayload({
      questions: {
        'golden-boot': 9,
        'chelsea-red-cards': 'three',
        'arsenal-set-piece-goals': -1,
        'arsenal-chelsea-emirates': { home: 2, away: null },
        'chelsea-arsenal-stamford-bridge': { home: 2, away: 1 },
      },
    })
    expect(payload.questions).toEqual({
      'arsenal-chelsea-emirates': { home: 2, away: null },
      'chelsea-arsenal-stamford-bridge': { home: 2, away: 1 },
    })
    expect(answeredCount(payload)).toBe(1)
  })

  it('preserves a valid partial score without treating it as an answer', () => {
    const payload = parsePredictionPayload({ questions: { 'arsenal-chelsea-emirates': { home: 0, away: null } } })
    expect(payload.questions['arsenal-chelsea-emirates']).toEqual({ home: 0, away: null })
    expect(answeredCount(payload)).toBe(0)
  })
})
