import { createClient } from '@supabase/supabase-js'
import {
  COMPETITION_SLUG,
  CompetitionDataError,
  parseCompetitionHome,
  type CompetitionHome,
} from './competition'
import { emptyPredictions, parsePredictionPayload, type PredictionPayload } from './predictions'

export type LoadFailureKind = 'configuration' | 'empty' | 'invalid' | 'unavailable'

export class CompetitionLoadError extends Error {
  constructor(
    public readonly kind: LoadFailureKind,
    message: string,
  ) {
    super(message)
    this.name = 'CompetitionLoadError'
  }
}

export interface BrowserEnvironment {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

export function getSupabaseConfiguration(environment: BrowserEnvironment): {
  url: string
  publishableKey: string
} {
  const url = environment.VITE_SUPABASE_URL?.trim()
  const publishableKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!url || !publishableKey) {
    throw new CompetitionLoadError(
      'configuration',
      'The browser-safe Supabase URL and publishable key are required.',
    )
  }
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    throw new CompetitionLoadError('configuration', 'The Supabase URL is invalid.')
  }
  const isLocalHttp =
    parsedUrl.protocol === 'http:' && ['127.0.0.1', 'localhost', '::1'].includes(parsedUrl.hostname)
  if (
    (parsedUrl.protocol !== 'https:' && !isLocalHttp) ||
    !publishableKey.startsWith('sb_publishable_')
  ) {
    throw new CompetitionLoadError('configuration', 'Only browser-safe Supabase configuration is allowed.')
  }
  return { url: parsedUrl.toString(), publishableKey }
}

export type CompetitionLoader = () => Promise<CompetitionHome>

export interface PredictionStore {
  load(profileId: string): Promise<PredictionPayload>
  save(profileId: string, predictions: PredictionPayload): Promise<void>
  /** Atomically persists the final payload and changes a draft into a locked entry. */
  lock?(profileId: string, predictions: PredictionPayload): Promise<void>
}

function createBrowserClient() {
  const { url, publishableKey } = getSupabaseConfiguration({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  })
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export function createPredictionStore(): PredictionStore {
  return {
    async load(profileId) {
      const response = await createBrowserClient()
        .from('prediction_entries')
        .select('predictions')
        .eq('participant_id', profileId)
        .maybeSingle()
      if (response.error) throw new CompetitionLoadError('unavailable', response.error.message)
      return response.data ? parsePredictionPayload(response.data.predictions) : emptyPredictions()
    },
    async save(profileId, predictions) {
      const response = await createBrowserClient()
        .from('prediction_entries')
        .update({ predictions })
        .eq('participant_id', profileId)
        .eq('status', 'draft')
        .select('participant_id')
      if (response.error) throw new CompetitionLoadError('unavailable', response.error.message)
      if (!response.data?.length) throw new CompetitionLoadError('unavailable', 'Locked entries cannot be changed.')
    },
    async lock(profileId, predictions) {
      const response = await createBrowserClient()
        .from('prediction_entries')
        .update({ predictions, status: 'locked' })
        .eq('participant_id', profileId)
        .eq('status', 'draft')
        .select('participant_id')
      if (response.error) throw new CompetitionLoadError('unavailable', response.error.message)
      if (!response.data?.length) {
        throw new CompetitionLoadError('unavailable', 'This entry was no longer available to lock.')
      }
    },
  }
}

export async function loadCompetitionHome(): Promise<CompetitionHome> {
  const client = createBrowserClient()

  const competitionResponse = await client
    .from('competitions')
    .select('id, slug, title, subtitle')
    .eq('slug', COMPETITION_SLUG)
    .maybeSingle()

  if (competitionResponse.error) {
    throw new CompetitionLoadError('unavailable', competitionResponse.error.message)
  }
  if (!competitionResponse.data) {
    throw new CompetitionLoadError('empty', 'No fixed competition was returned.')
  }

  const [participantResponse, entryResponse] = await Promise.all([
    client
      .from('participants')
      .select('id, competition_id, slug, display_name, monogram, display_order')
      .eq('competition_id', competitionResponse.data.id)
      .order('display_order'),
    client
      .from('prediction_entries')
      .select('participant_id, status, predictions')
      .eq('competition_id', competitionResponse.data.id),
  ])

  if (participantResponse.error || entryResponse.error) {
    throw new CompetitionLoadError(
      'unavailable',
      participantResponse.error?.message ?? entryResponse.error?.message ?? 'Competition query failed.',
    )
  }

  try {
    return parseCompetitionHome(
      competitionResponse.data,
      participantResponse.data,
      entryResponse.data,
    )
  } catch (error) {
    if (error instanceof CompetitionDataError) {
      throw new CompetitionLoadError(error.kind, error.message)
    }
    throw error
  }
}
