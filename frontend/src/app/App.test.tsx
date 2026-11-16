import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('foundation shell links to the backend readiness check', () => {
  render(<App />)
  expect(
    screen.getByRole('heading', { name: 'QuangHuy_Sport' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('link')).toHaveAttribute('href', '/health')
})
