export const PREDICTION_PAYLOAD_VERSION = 1
export const MAX_MANUAL_ANSWER_LENGTH = 120
export const SCORING_TOTAL = 277
export const SCORING_ALLOCATION = {
  table: 135,
  cups: 38,
  categoricalQuestions: 70,
  numericQuestions: 20,
  matchPredictions: 14,
} as const

export const premierLeagueClubs = [
  { id: 'afc-bournemouth', name: 'AFC Bournemouth' },
  { id: 'arsenal', name: 'Arsenal' },
  { id: 'aston-villa', name: 'Aston Villa' },
  { id: 'brentford', name: 'Brentford' },
  { id: 'brighton-and-hove-albion', name: 'Brighton & Hove Albion' },
  { id: 'chelsea', name: 'Chelsea' },
  { id: 'coventry-city', name: 'Coventry City' },
  { id: 'crystal-palace', name: 'Crystal Palace' },
  { id: 'everton', name: 'Everton' },
  { id: 'fulham', name: 'Fulham' },
  { id: 'hull-city', name: 'Hull City' },
  { id: 'ipswich-town', name: 'Ipswich Town' },
  { id: 'leeds-united', name: 'Leeds United' },
  { id: 'liverpool', name: 'Liverpool' },
  { id: 'manchester-city', name: 'Manchester City' },
  { id: 'manchester-united', name: 'Manchester United' },
  { id: 'newcastle-united', name: 'Newcastle United' },
  { id: 'nottingham-forest', name: 'Nottingham Forest' },
  { id: 'sunderland', name: 'Sunderland' },
  { id: 'tottenham-hotspur', name: 'Tottenham Hotspur' },
] as const

export type ClubId = (typeof premierLeagueClubs)[number]['id']
export const initialTableOrder = premierLeagueClubs.map(({ id }) => id)
export const clubNameById = Object.fromEntries(premierLeagueClubs.map(({ id, name }) => [id, name])) as Record<ClubId, string>

export const cupQuestions = [
  'UEFA Champions League',
  'UEFA Europa League',
  'UEFA Conference League',
  'FA Cup',
  'Carabao Cup',
] as const

export type QuestionKind = 'person' | 'club' | 'manager' | 'manager-departure' | 'number' | 'score'

export interface LeagueQuestion {
  id: string
  label: string
  kind: QuestionKind
  helper?: string
}

export const leagueQuestions: LeagueQuestion[] = [
  { id: 'golden-boot', label: 'Golden Boot winner', kind: 'person' },
  { id: 'playmaker', label: 'Most assists / Playmaker winner', kind: 'person' },
  { id: 'golden-glove', label: 'Golden Glove winner', kind: 'person' },
  { id: 'player-of-season', label: 'Player of the Season', kind: 'person' },
  { id: 'young-player', label: 'Young Player of the Season', kind: 'person' },
  { id: 'manager-of-season', label: 'Manager of the Season', kind: 'manager' },
  { id: 'most-improved', label: 'Most improved player', kind: 'person' },
  { id: 'impact-signing', label: 'Impact signing of the season', kind: 'person' },
  { id: 'flop', label: 'Flop of the season', kind: 'person' },
  { id: 'first-manager-leave', label: 'First permanent Premier League manager to leave their role', kind: 'manager-departure' },
  { id: 'chelsea-red-cards', label: 'Chelsea Premier League red cards — closest wins', kind: 'number' },
  {
    id: 'arsenal-set-piece-goals',
    label: 'Arsenal Premier League set-piece goals — closest wins',
    kind: 'number',
    helper: 'Corners, direct or indirect free kicks, or throw-ins before open play resumes count. Penalties do not; own goals from the same phase do.',
  },
  { id: 'arsenal-chelsea-emirates', label: 'Arsenal vs Chelsea at the Emirates — score prediction', kind: 'score' },
  { id: 'chelsea-arsenal-stamford-bridge', label: 'Chelsea vs Arsenal at Stamford Bridge — score prediction', kind: 'score' },
]

export const suggestionCatalog = [
  'Arsenal', 'Aston Villa', 'AFC Bournemouth', 'Brentford', 'Brighton & Hove Albion', 'Chelsea',
  'Coventry City', 'Crystal Palace', 'Everton', 'Fulham', 'Hull City', 'Ipswich Town', 'Leeds United',
  'Liverpool', 'Manchester City', 'Manchester United', 'Newcastle United', 'Nottingham Forest', 'Sunderland',
  'Tottenham Hotspur', 'Barcelona', 'Bayern Munich', 'Borussia Dortmund', 'Inter Milan', 'Juventus',
  'Napoli', 'Paris Saint-Germain', 'Real Madrid', 'Atletico Madrid', 'Mohamed Salah', 'Erling Haaland',
  'Cole Palmer', 'Bukayo Saka', 'Declan Rice', 'Mikel Arteta', 'Enzo Maresca', 'Pep Guardiola',
  'Arne Slot', 'No managerial departure',
]

export interface ScoreAnswer { home: number | null; away: number | null }
export interface TablePrediction { order: ClubId[]; confirmed: boolean }
export interface PredictionPayload {
  version: number
  cups: Record<string, string>
  questions: Record<string, string | number | ScoreAnswer>
  table?: TablePrediction
}

export const emptyPredictions = (): PredictionPayload => ({ version: PREDICTION_PAYLOAD_VERSION, cups: {}, questions: {} })

export function normalizeManualAnswer(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_MANUAL_ANSWER_LENGTH)
}

export function parseWholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

export function hasAnswer(value: unknown): boolean {
  if (typeof value === 'string') return value.length > 0
  if (typeof value === 'number') return true
  return typeof value === 'object' && value !== null &&
    typeof (value as ScoreAnswer).home === 'number' &&
    typeof (value as ScoreAnswer).away === 'number'
}

export function answeredCount(payload: PredictionPayload): number {
  return Object.values(payload.cups).filter(hasAnswer).length + Object.values(payload.questions).filter(hasAnswer).length + (payload.table?.confirmed ? 20 : 0)
}

export class PredictionDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PredictionDataError'
  }
}

export function isCompleteTableOrder(value: unknown): value is ClubId[] {
  return Array.isArray(value) && value.length === initialTableOrder.length &&
    value.every((club): club is ClubId => typeof club === 'string' && club in clubNameById) &&
    new Set(value).size === initialTableOrder.length
}

export function moveClub(order: ClubId[], from: number, to: number): ClubId[] {
  if (from < 0 || to < 0 || from >= order.length || to >= order.length || from === to) return order
  const next = [...order]
  const [club] = next.splice(from, 1)
  next.splice(to, 0, club)
  return next
}

export function parsePredictionPayload(value: unknown): PredictionPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyPredictions()
  const source = value as Record<string, unknown>
  const cups = source.cups && typeof source.cups === 'object' && !Array.isArray(source.cups) ? source.cups as Record<string, unknown> : {}
  const questions = source.questions && typeof source.questions === 'object' && !Array.isArray(source.questions) ? source.questions as Record<string, unknown> : {}
  const parsed = emptyPredictions()
  if ('table' in source && source.table !== undefined) {
    const table = source.table
    if (!table || typeof table !== 'object' || Array.isArray(table)) {
      throw new PredictionDataError('The saved Premier League table is malformed.')
    }
    const candidate = table as Record<string, unknown>
    if (!isCompleteTableOrder(candidate.order) || typeof candidate.confirmed !== 'boolean') {
      throw new PredictionDataError('The saved Premier League table is malformed.')
    }
    parsed.table = { order: [...candidate.order], confirmed: candidate.confirmed }
  }
  for (const cup of cupQuestions) if (typeof cups[cup] === 'string') parsed.cups[cup] = normalizeManualAnswer(cups[cup])
  for (const question of leagueQuestions) {
    const answer = questions[question.id]
    if (question.kind === 'number' && typeof answer === 'number' && Number.isSafeInteger(answer) && answer >= 0) {
      parsed.questions[question.id] = answer
    }
    if (question.kind === 'score' && answer && typeof answer === 'object' && !Array.isArray(answer)) {
      const score = answer as ScoreAnswer
      const homeIsValid = score.home === null || (typeof score.home === 'number' && Number.isSafeInteger(score.home) && score.home >= 0)
      const awayIsValid = score.away === null || (typeof score.away === 'number' && Number.isSafeInteger(score.away) && score.away >= 0)
      if (homeIsValid && awayIsValid && (score.home !== null || score.away !== null)) {
        parsed.questions[question.id] = { home: score.home, away: score.away }
      }
    }
    if (question.kind !== 'number' && question.kind !== 'score' && typeof answer === 'string') {
      const normalized = normalizeManualAnswer(answer)
      if (normalized) parsed.questions[question.id] = normalized
    }
  }
  return parsed
}
