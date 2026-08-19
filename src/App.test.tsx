import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App scaffold', () => {
  it('renders the approved product name', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'THE JERRY PREDICTIONS' }),
    ).toBeInTheDocument()
  })

  it('renders the approved competition subtitle once beneath the title', () => {
    const { container } = render(<App />)
    const view = within(container)

    const title = view.getByRole('heading', {
      level: 1,
      name: 'THE JERRY PREDICTIONS',
    })
    const subtitle = view.getByText(
      '2026/27 Football Prediction Competition',
      { selector: 'p' },
    )

    expect(view.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(
      view.getAllByText('2026/27 Football Prediction Competition'),
    ).toHaveLength(1)
    expect(title.nextElementSibling).toBe(subtitle)
  })
})
