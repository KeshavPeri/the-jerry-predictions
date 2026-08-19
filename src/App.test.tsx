import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App scaffold', () => {
  it('renders the approved product name', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'THE JERRY PREDICTIONS' }),
    ).toBeInTheDocument()
  })
})
