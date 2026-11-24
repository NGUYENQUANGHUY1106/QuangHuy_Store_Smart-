import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('foundation shell renders the QuangHuy Sport home page', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /Bứt tốc/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Trang chủ' })).toBeInTheDocument()
})
