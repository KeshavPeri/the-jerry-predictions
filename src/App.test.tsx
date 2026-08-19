import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { SELECTED_PROFILE_KEY, type CompetitionHome } from './competition'
import { CompetitionLoadError } from './supabase'

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
  beforeEach(() => window.localStorage.clear())

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
})
