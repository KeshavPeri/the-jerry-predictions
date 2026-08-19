export const PREDICTION_PAYLOAD_VERSION = 1
export const MAX_MANUAL_ANSWER_LENGTH = 120

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
export interface PredictionPayload {
  version: number
  cups: Record<string, string>
  questions: Record<string, string | number | ScoreAnswer>
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
  return Object.values(payload.cups).filter(hasAnswer).length + Object.values(payload.questions).filter(hasAnswer).length
}

export function parsePredictionPayload(value: unknown): PredictionPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyPredictions()
  const source = value as Record<string, unknown>
  const cups = source.cups && typeof source.cups === 'object' && !Array.isArray(source.cups) ? source.cups as Record<string, unknown> : {}
  const questions = source.questions && typeof source.questions === 'object' && !Array.isArray(source.questions) ? source.questions as Record<string, unknown> : {}
  const parsed = emptyPredictions()
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
