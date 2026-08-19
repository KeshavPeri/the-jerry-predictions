import { describe, expect, it } from 'vitest'
import { answeredCount, emptyPredictions, initialTableOrder, isCompleteTableOrder, moveClub, normalizeManualAnswer, parsePredictionPayload, parseWholeNumber, PredictionDataError } from './predictions'

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

  it('uses the exact fixed twenty-club set and serializes a confirmed table for scoring', () => {
    expect(initialTableOrder).toHaveLength(20)
    expect(new Set(initialTableOrder).size).toBe(20)
    const payload = parsePredictionPayload({ table: { order: initialTableOrder, confirmed: true } })
    expect(payload.table).toEqual({ order: initialTableOrder, confirmed: true })
    expect(answeredCount(payload)).toBe(20)
  })

  it('keeps a table draft out of progress until it is confirmed', () => {
    expect(answeredCount({ ...emptyPredictions(), table: { order: initialTableOrder, confirmed: false } })).toBe(0)
  })

  it('validates complete table orders and preserves movement boundaries', () => {
    expect(isCompleteTableOrder(initialTableOrder)).toBe(true)
    expect(isCompleteTableOrder([...initialTableOrder.slice(1), initialTableOrder[1]])).toBe(false)
    expect(moveClub(initialTableOrder, 0, -1)).toBe(initialTableOrder)
    expect(moveClub(initialTableOrder, 0, 1).slice(0, 2)).toEqual([initialTableOrder[1], initialTableOrder[0]])
  })

  it('does not silently repair malformed stored tables', () => {
    expect(() => parsePredictionPayload({ table: { order: initialTableOrder.slice(1), confirmed: true } })).toThrow(PredictionDataError)
    expect(() => parsePredictionPayload({ table: { order: [...initialTableOrder.slice(0, 19), initialTableOrder[0]], confirmed: false } })).toThrow(PredictionDataError)
    expect(() => parsePredictionPayload({ table: { order: [...initialTableOrder.slice(0, 19), 'unknown-club'], confirmed: false } })).toThrow(PredictionDataError)
  })
})
