export const COMPETITION_SLUG = 'the-jerry-predictions-2026-27'
export const SELECTED_PROFILE_KEY = 'jerry-predictions:selected-profile'

export const expectedProfiles = [
  { slug: 'keshav', name: 'Keshav', monogram: 'KE', position: 1, accent: 'violet' },
  { slug: 'anshul', name: 'Anshul', monogram: 'AN', position: 2, accent: 'cyan' },
  { slug: 'kshitij', name: 'Kshitij', monogram: 'KI', position: 3, accent: 'teal' },
  { slug: 'parth', name: 'Parth', monogram: 'PA', position: 4, accent: 'gold' },
] as const

export type ProfileStatus = 'Not started' | 'In progress' | 'Locked'
export type Accent = (typeof expectedProfiles)[number]['accent']

export interface Profile {
  id: string
  slug: string
  name: string
  monogram: string
  position: number
  accent: Accent
  status: ProfileStatus
}

export interface CompetitionHome {
  id: string
  title: string
  subtitle: string
  profiles: Profile[]
}

interface CompetitionRow {
  id: unknown
  slug: unknown
  title: unknown
  subtitle: unknown
}

interface ParticipantRow {
  id: unknown
  competition_id: unknown
  slug: unknown
  display_name: unknown
  monogram: unknown
  display_order: unknown
}

interface EntryRow {
  participant_id: unknown
  status: unknown
  predictions: unknown
}

export class CompetitionDataError extends Error {
  constructor(
    public readonly kind: 'empty' | 'invalid',
    message: string,
  ) {
    super(message)
    this.name = 'CompetitionDataError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function hasPredictionValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.some(hasPredictionValue)
  if (isRecord(value)) return Object.entries(value)
    .filter(([key]) => key !== 'version')
    .some(([, answer]) => hasPredictionValue(answer))
  return false
}

export function mapEntryStatus(status: unknown, predictions: unknown): ProfileStatus {
  if (!isRecord(predictions)) {
    throw new CompetitionDataError('invalid', 'An entry has malformed predictions.')
  }
  if (status === 'locked') return 'Locked'
  if (status !== 'draft') {
    throw new CompetitionDataError('invalid', 'An entry has an unknown status.')
  }
  return hasPredictionValue(predictions) ? 'In progress' : 'Not started'
}

export function parseCompetitionHome(
  competitionValue: unknown,
  participantValues: unknown,
  entryValues: unknown,
): CompetitionHome {
  if (competitionValue === null || competitionValue === undefined) {
    throw new CompetitionDataError('empty', 'No competition record was returned.')
  }
  if (!isRecord(competitionValue)) {
    throw new CompetitionDataError('invalid', 'The competition record is malformed.')
  }
  if (!Array.isArray(participantValues) || !Array.isArray(entryValues)) {
    throw new CompetitionDataError('invalid', 'The competition relationships are malformed.')
  }

  const competition = competitionValue as unknown as CompetitionRow
  if (
    typeof competition.id !== 'string' ||
    competition.slug !== COMPETITION_SLUG ||
    competition.title !== 'THE JERRY PREDICTIONS' ||
    competition.subtitle !== '2026/27 Football Prediction Competition'
  ) {
    throw new CompetitionDataError('invalid', 'The fixed competition configuration is invalid.')
  }

  if (participantValues.length === 0 || entryValues.length === 0) {
    throw new CompetitionDataError('empty', 'The fixed participant data is empty.')
  }
  if (participantValues.length !== expectedProfiles.length || entryValues.length !== expectedProfiles.length) {
    throw new CompetitionDataError('invalid', 'The fixed competition must contain exactly four profiles and entries.')
  }

  const entriesByParticipant = new Map<string, EntryRow>()
  for (const value of entryValues) {
    if (!isRecord(value) || typeof value.participant_id !== 'string') {
      throw new CompetitionDataError('invalid', 'A prediction entry is malformed.')
    }
    if (entriesByParticipant.has(value.participant_id)) {
      throw new CompetitionDataError('invalid', 'A participant has duplicate prediction entries.')
    }
    entriesByParticipant.set(value.participant_id, value as unknown as EntryRow)
  }

  const participantsByPosition = new Map<number, ParticipantRow>()
  for (const value of participantValues) {
    if (!isRecord(value) || typeof value.display_order !== 'number') {
      throw new CompetitionDataError('invalid', 'A participant record is malformed.')
    }
    if (participantsByPosition.has(value.display_order)) {
      throw new CompetitionDataError('invalid', 'Participant order contains duplicates.')
    }
    participantsByPosition.set(value.display_order, value as unknown as ParticipantRow)
  }

  const profiles = expectedProfiles.map((expected) => {
    const participant = participantsByPosition.get(expected.position)
    if (
      !participant ||
      typeof participant.id !== 'string' ||
      participant.competition_id !== competition.id ||
      participant.slug !== expected.slug ||
      participant.display_name !== expected.name ||
      participant.monogram !== expected.monogram
    ) {
      throw new CompetitionDataError('invalid', `The ${expected.name} profile is missing or malformed.`)
    }
    const entry = entriesByParticipant.get(participant.id)
    if (!entry) {
      throw new CompetitionDataError('invalid', `The ${expected.name} prediction entry is missing.`)
    }

    return {
      id: participant.id,
      slug: expected.slug,
      name: expected.name,
      monogram: expected.monogram,
      position: expected.position,
      accent: expected.accent,
      status: mapEntryStatus(entry.status, entry.predictions),
    }
  })

  return {
    id: competition.id,
    title: competition.title as string,
    subtitle: competition.subtitle as string,
    profiles,
  }
}

export function readSelectedProfile(storage: Pick<Storage, 'getItem'>): string | null {
  try {
    const selected = storage.getItem(SELECTED_PROFILE_KEY)
    return expectedProfiles.some(({ slug }) => slug === selected) ? selected : null
  } catch {
    return null
  }
}

export function rememberSelectedProfile(
  storage: Pick<Storage, 'setItem'>,
  profileSlug: string,
): void {
  if (!expectedProfiles.some(({ slug }) => slug === profileSlug)) return
  try {
    storage.setItem(SELECTED_PROFILE_KEY, profileSlug)
  } catch {
    // Profile memory is a convenience; private browsing must not block entry.
  }
}
