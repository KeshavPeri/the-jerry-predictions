import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { SELECTED_PROFILE_KEY, type CompetitionHome } from './competition'
import { CompetitionLoadError } from './supabase'
import { emptyPredictions, initialTableOrder, PredictionDataError, type PredictionPayload } from './predictions'

const competition: CompetitionHome = {
  id: 'competition-id',
  title: 'THE JERRY PREDICTIONS',
  subtitle: '2026/27 Football Prediction Competition',
  profiles: [
    { id: 'ke', slug: 'keshav', name: 'Keshav', monogram: 'KE', position: 1, accent: 'violet', status: 'Not started' },
    { id: 'an', slug: 'anshul', name: 'Anshul', monogram: 'AN', position: 2, accent: 'cyan', status: 'In progress' },
    { id: 'ki', slug: 'kshitij', name: 'Kshitij', monogram: 'KI', position: 3, accent: 'teal', status: 'Locked' },
    { id: 'pa', slug: 'parth', name: 'Parth', monogram: 'PA', position: 4, accent: 'gold', status: 'Not started' },
  ],
}

describe('competition home', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true })
  })

  it('shows purposeful loading while shared data is pending', () => {
    render(<App loadCompetition={() => new Promise(() => undefined)} />)
    expect(screen.getByRole('heading', { name: 'Opening the prediction room' })).toBeInTheDocument()
    expect(screen.getByText(/Loading the shared competition/)).toBeInTheDocument()
  })

  it('renders the exact title, subtitle, ordered profiles, monograms, and statuses', async () => {
    render(<App loadCompetition={() => Promise.resolve(competition)} />)

    const title = await screen.findByRole('heading', { level: 1, name: 'THE JERRY PREDICTIONS' })
    const subtitle = screen.getByText('2026/27 Football Prediction Competition', { selector: 'p' })
    expect(title.nextElementSibling).toBe(subtitle)

    const buttons = within(screen.getByRole('list', { name: 'Competition profiles' })).getAllByRole('button')
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Continue as Keshav',
      'Continue as Anshul',
      'Continue as Kshitij',
      'Continue as Parth',
    ])
    expect(buttons.map((button) => button.textContent)).toEqual([
      'KEKeshavNot startedChoose',
      'ANAnshulIn progressChoose',
      'KIKshitijLockedChoose',
      'PAParthNot startedChoose',
    ])
    expect(screen.getByText('1 of 4 locked')).toBeInTheDocument()
  })

  it('selects, switches, and restores a profile through device-local memory', async () => {
    const loader = () => Promise.resolve(competition)
    const firstRender = render(<App loadCompetition={loader} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Kshitij' }))
    expect(screen.getByRole('heading', { name: "Kshitij's predictions" })).toBeInTheDocument()
    expect(window.localStorage.getItem(SELECTED_PROFILE_KEY)).toBe('kshitij')
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Premier League table',
      'Cup winners',
      'Premier League questions',
      'Review & lock',
    ])

    fireEvent.click(screen.getByRole('button', { name: 'Switch profile' }))
    expect(screen.getByRole('button', { name: 'Continue as Keshav' })).toBeInTheDocument()

    firstRender.unmount()
    render(<App loadCompetition={loader} />)
    expect(await screen.findByRole('heading', { name: "Kshitij's predictions" })).toBeInTheDocument()
  })

  it.each([
    ['configuration', 'Competition setup is incomplete', false],
    ['empty', 'Competition data is empty', true],
    ['invalid', 'Competition data is incomplete', true],
    ['unavailable', 'Competition data cannot be reached', true],
  ] as const)('renders a distinct %s failure state', async (kind, heading, retries) => {
    render(<App loadCompetition={() => Promise.reject(new CompetitionLoadError(kind, 'test failure'))} />)

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' }) !== null).toBe(retries)
    expect(screen.queryByText('Not started')).not.toBeInTheDocument()
  })

  it('retries an unavailable load without inventing statuses', async () => {
    const loader = vi
      .fn<() => Promise<CompetitionHome>>()
      .mockRejectedValueOnce(new CompetitionLoadError('unavailable', 'offline'))
      .mockResolvedValueOnce(competition)
    render(<App loadCompetition={loader} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2))
    expect(await screen.findByRole('button', { name: 'Continue as Keshav' })).toBeInTheDocument()
  })

  it('saves ordered cup and question answers after a short idle period', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    expect(screen.getAllByRole('combobox').map((input) => input.closest('label')?.textContent)).toEqual([
      'UEFA Champions League', 'UEFA Europa League', 'UEFA Conference League', 'FA Cup', 'Carabao Cup',
    ])
    fireEvent.change(screen.getByLabelText('UEFA Champions League'), { target: { value: '  Real   Madrid ' } })
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1), { timeout: 1500 })
    expect(save.mock.calls[0][1].cups['UEFA Champions League']).toBe('Real Madrid')
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })

  it('keeps failed input visible and retries it', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockRejectedValueOnce(new Error('nope')).mockResolvedValueOnce(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Premier League questions' }))
    fireEvent.change(screen.getByLabelText('Golden Boot winner'), { target: { value: 'Cole Palmer' } })
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1), { timeout: 1500 })
    expect(await screen.findByText('Not saved')).toBeInTheDocument()
    expect(screen.getByLabelText('Golden Boot winner')).toHaveValue('Cole Palmer')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('coalesces quick changes into one debounced write containing the latest answers', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    fireEvent.change(screen.getByLabelText('UEFA Champions League'), { target: { value: 'Arsenal' } })
    fireEvent.change(screen.getByLabelText('FA Cup'), { target: { value: 'Chelsea' } })
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1), { timeout: 1500 })
    expect(save.mock.calls[0][1].cups).toEqual({ 'UEFA Champions League': 'Arsenal', 'FA Cup': 'Chelsea' })
  })

  it('saves a cleared answer and returns the current profile to not started', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    const field = screen.getByLabelText('FA Cup')
    fireEvent.change(field, { target: { value: 'Arsenal' } })
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1), { timeout: 1500 })
    fireEvent.change(field, { target: { value: '' } })
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2), { timeout: 1500 })
    expect(save.mock.calls[1][1].cups).toEqual({})
    expect(screen.getByText('Not started')).toBeInTheDocument()
  })

  it('does not write while offline and clearly says changes are not shared', async () => {
    const online = Object.getOwnPropertyDescriptor(window.navigator, 'onLine')
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false })
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    fireEvent.change(screen.getByLabelText('FA Cup'), { target: { value: 'Arsenal' } })
    expect(await screen.findByText('Offline — changes are not shared', {}, { timeout: 1500 })).toBeInTheDocument()
    expect(save).not.toHaveBeenCalled()
    if (online) Object.defineProperty(window.navigator, 'onLine', online)
  })

  it('loads a saved shared draft when the profile workspace is opened again', async () => {
    const saved = { ...emptyPredictions(), cups: { 'FA Cup': 'Arsenal' } }
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(saved), save: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    expect(screen.getByLabelText('FA Cup')).toHaveValue('Arsenal')
  })

  it('reloads a partial score without counting it as a completed prediction', async () => {
    const saved = {
      ...emptyPredictions(),
      questions: { 'arsenal-chelsea-emirates': { home: 2, away: null } },
    }
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(saved), save: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Premier League questions' }))
    expect(screen.getByLabelText('Arsenal vs Chelsea at the Emirates — score prediction: home score')).toHaveValue('2')
    expect(screen.getByLabelText('Arsenal vs Chelsea at the Emirates — score prediction: away score')).toHaveValue('')
    expect(screen.getByText('0 of 39 predictions answered')).toBeInTheDocument()
  })

  it('keeps the alphabetical table unconfirmed until explicitly confirmed, then saves all twenty positions', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    expect(screen.getByText('Not confirmed — 0 table predictions included')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(20)
    expect(screen.getByText('AFC Bournemouth')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Move AFC Bournemouth up' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirm table' }))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1), { timeout: 1500 })
    expect(save.mock.calls[0][1].table).toEqual({ order: initialTableOrder, confirmed: true })
    expect(screen.getByText('20 of 39 predictions answered')).toBeInTheDocument()
  })

  it('reorders with controls, announces the new position, and saves an unconfirmed draft', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('button', { name: 'Move Arsenal up' }))
    expect(await screen.findByText('Arsenal moved to position 1. Table needs confirmation.')).toBeInTheDocument()
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1), { timeout: 1500 })
    expect(save.mock.calls[0][1].table).toEqual({ order: ['arsenal', 'afc-bournemouth', ...initialTableOrder.slice(2)], confirmed: false })
  })

  it('reorders with a pointer drag handle', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Drag AFC Bournemouth' }))
    fireEvent.pointerUp(screen.getAllByRole('listitem')[1])
    expect(await screen.findByText('AFC Bournemouth moved to position 2. Table needs confirmation.')).toBeInTheDocument()
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1), { timeout: 1500 })
    expect(save.mock.calls[0][1].table?.order.slice(0, 2)).toEqual(['arsenal', 'afc-bournemouth'])
  })

  it('lets a participant skip a saved table and reload a confirmed table in the same order', async () => {
    const saved = { ...emptyPredictions(), table: { order: [...initialTableOrder].reverse(), confirmed: true } }
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(saved), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    expect(screen.getByText('Confirmed — 20 predictions included')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Tottenham Hotspur')
    fireEvent.click(screen.getByRole('button', { name: 'Skip table' }))
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1), { timeout: 1500 })
    expect(save.mock.calls[0][1].table).toBeUndefined()
  })

  it('stops without writing when a saved table is malformed', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.reject(new PredictionDataError('malformed table')), save }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    expect(await screen.findByText('We could not safely load this table')).toBeInTheDocument()
    expect(screen.getAllByText('Saved table needs attention')).toHaveLength(2)
    expect(save).not.toHaveBeenCalled()
  })

  it('reviews every category, treats an unconfirmed table as skipped, and blocks a blank lock', async () => {
    const saved = { ...emptyPredictions(), table: { order: initialTableOrder, confirmed: false } }
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(saved), save: () => Promise.resolve(), lock: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Review & lock' }))
    expect(screen.getByRole('heading', { name: '0 predictions ready' })).toBeInTheDocument()
    expect(screen.getAllByText('No prediction').length).toBeGreaterThan(10)
    expect(screen.getByText('Add at least one valid prediction before locking.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lock my predictions' })).toBeDisabled()
    expect(screen.getByText('Scoring reference — 277 points available')).toBeInTheDocument()
  })

  it('locks a valid saved entry atomically and makes the workspace read-only', async () => {
    const lock = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    const saved = { ...emptyPredictions(), cups: { 'FA Cup': 'Arsenal' } }
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(saved), save: () => Promise.resolve(), lock }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Review & lock' }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Lock my predictions' }))
    await waitFor(() => expect(lock).toHaveBeenCalledWith('ke', saved))
    expect(await screen.findByText("Keshav's entry is read-only")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm table' })).not.toBeInTheDocument()
    expect(screen.getByText('FA Cup')).toBeInTheDocument()
    expect(screen.getByText('Arsenal')).toBeInTheDocument()
    expect(screen.getAllByText('KE')).toHaveLength(2)
  })

  it('treats numeric zero and a 0–0 score as valid answers, and only confirmed tables count', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save, lock: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Premier League questions' }))
    fireEvent.change(screen.getByLabelText('Chelsea Premier League red cards — closest wins'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Arsenal vs Chelsea at the Emirates — score prediction: home score'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText('Arsenal vs Chelsea at the Emirates — score prediction: away score'), { target: { value: '0' } })
    await waitFor(() => expect(save).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('tab', { name: 'Review & lock' }))
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('0–0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Lock my predictions' })).toBeDisabled()
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: 'Lock my predictions' })).toBeEnabled()
  })

  it('offers a direct retry after a rejected lock without requiring an edit', async () => {
    const lock = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(undefined)
    const saved = { ...emptyPredictions(), cups: { 'FA Cup': 'Arsenal' } }
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(saved), save: () => Promise.resolve(), lock }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Review & lock' }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Lock my predictions' }))
    expect(await screen.findByRole('button', { name: 'Retry locking' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Retry locking' }))
    await waitFor(() => expect(lock).toHaveBeenCalledTimes(2))
    expect(await screen.findByText("Keshav's entry is read-only")).toBeInTheDocument()
  })

  it('blocks locking while a draft save is pending, failed, or offline', async () => {
    let resolveSave: (() => void) | undefined
    const pendingSave = new Promise<void>((resolve) => { resolveSave = resolve })
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save: () => pendingSave, lock: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    fireEvent.change(screen.getByLabelText('FA Cup'), { target: { value: 'Arsenal' } })
    fireEvent.click(screen.getByRole('tab', { name: 'Review & lock' }))
    expect(screen.getByRole('button', { name: 'Lock my predictions' })).toBeDisabled()
    resolveSave?.()
  })

  it('blocks locking after a failed save and while offline', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockRejectedValue(new Error('failed'))
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save, lock: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    fireEvent.change(screen.getByLabelText('FA Cup'), { target: { value: 'Arsenal' } })
    expect(await screen.findByText('Not saved')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Review & lock' }))
    expect(screen.getByRole('button', { name: 'Lock my predictions' })).toBeDisabled()
  })

  it('opens a previously locked profile as a grouped read-only entry', async () => {
    const saved = { ...emptyPredictions(), table: { order: initialTableOrder, confirmed: true }, cups: { 'FA Cup': 'Arsenal' }, questions: { 'chelsea-red-cards': 0 } }
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(saved), save: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Kshitij' }))
    expect(await screen.findByText("Kshitij's entry is read-only")).toBeInTheDocument()
    expect(screen.getAllByText('Arsenal').length).toBeGreaterThan(1)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lock my predictions' })).not.toBeInTheDocument()
  })

  it('opens an admin-reopened draft with its saved values editable and no revision history', async () => {
    const saved = { ...emptyPredictions(), cups: { 'FA Cup': 'Arsenal' } }
    const lockedCompetition = { ...competition, profiles: competition.profiles.map((profile) => profile.slug === 'keshav' ? { ...profile, status: 'Locked' as const } : profile) }
    const reopenedCompetition = { ...competition, profiles: competition.profiles.map((profile) => profile.slug === 'keshav' ? { ...profile, status: 'In progress' as const } : profile) }
    const first = render(<App loadCompetition={() => Promise.resolve(lockedCompetition)} predictionStore={{ load: () => Promise.resolve(saved), save: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    expect(await screen.findByText("Keshav's entry is read-only")).toBeInTheDocument()
    first.unmount()
    render(<App loadCompetition={() => Promise.resolve(reopenedCompetition)} predictionStore={{ load: () => Promise.resolve(saved), save: () => Promise.resolve() }} />)
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    expect(screen.getByLabelText('FA Cup')).toHaveValue('Arsenal')
    expect(screen.queryByText(/revision history/i)).not.toBeInTheDocument()
  })

  it('prevents review locking after an offline mutation', async () => {
    const online = Object.getOwnPropertyDescriptor(window.navigator, 'onLine')
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false })
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save: () => Promise.resolve(), lock: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('tab', { name: 'Cup winners' }))
    fireEvent.change(screen.getByLabelText('FA Cup'), { target: { value: 'Arsenal' } })
    expect(await screen.findByText('Offline — changes are not shared')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Review & lock' }))
    expect(screen.getByRole('button', { name: 'Lock my predictions' })).toBeDisabled()
    if (online) Object.defineProperty(window.navigator, 'onLine', online)
  })

  it('allows locking a confirmed table without any other answer', async () => {
    const save = vi.fn<(profileId: string, value: PredictionPayload) => Promise<void>>().mockResolvedValue(undefined)
    render(<App loadCompetition={() => Promise.resolve(competition)} predictionStore={{ load: () => Promise.resolve(emptyPredictions()), save, lock: () => Promise.resolve() }} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Continue as Keshav' }))
    await screen.findByText('Saved')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm table' }))
    await waitFor(() => expect(save).toHaveBeenCalled())
    expect(screen.getByText('20 of 39 predictions answered')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Review & lock' }))
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: 'Lock my predictions' })).toBeEnabled()
  })
})
