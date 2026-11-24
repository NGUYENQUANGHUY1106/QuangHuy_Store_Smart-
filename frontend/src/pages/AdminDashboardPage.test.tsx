import { MemoryRouter } from 'react-router-dom'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminDashboardPage } from './AdminPages'
import { mockApi } from '../services/mockApi'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  sessionStorage.clear()
})

it('shows the approved dashboard metrics and requests the selected day', async () => {
  const metrics = vi.spyOn(mockApi, 'getDashboardMetrics').mockResolvedValue({
    date: '2026-11-23',
    orders: { pending: 1 },
    inventory: { low_stock_count: 1 },
    revenue_delivered: '650000.00',
    cod_collected: null,
    top_products: [{ sku_snapshot: 'DASH-41', quantity: 2 }],
  })
  render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText('Giá trị hàng đã giao sau giảm')).toBeVisible()
  expect(screen.getByText(/650[.,]000/)).toBeVisible()
  expect(screen.getByText('Chưa theo dõi')).toBeVisible()
  expect(screen.getByText('DASH-41 · 2')).toBeVisible()
  fireEvent.change(screen.getByLabelText('Ngày báo cáo (Asia/Saigon)'), {
    target: { value: '2026-11-22' },
  })
  expect(metrics).toHaveBeenLastCalledWith('2026-11-22')
  await screen.findByText('DASH-41 · 2')
})

it.each(['offline', '500'])(
  'shows an error on %s without invented metrics',
  async (failure) => {
    const fetch = vi.fn()
    if (failure === 'offline') fetch.mockRejectedValue(new TypeError('offline'))
    else fetch.mockResolvedValue(new Response(null, { status: 500 }))
    vi.stubGlobal('fetch', fetch)
    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể tải dashboard',
    )
    expect(screen.queryByText('Giá trị hàng đã giao sau giảm')).toBeNull()
  },
)

it('rotates tokens and retries the protected request once', async () => {
  sessionStorage.setItem('qhs-access-token', 'old-access')
  sessionStorage.setItem('qhs-refresh-token', 'old-refresh')
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(
      Response.json({ access: 'new-access', refresh: 'new-refresh' }),
    )
    .mockResolvedValueOnce(Response.json({ date: '2026-11-23' }))
  vi.stubGlobal('fetch', fetch)

  await expect(mockApi.getDashboardMetrics()).resolves.toMatchObject({
    date: '2026-11-23',
  })
  expect(fetch).toHaveBeenCalledTimes(3)
  expect(fetch.mock.calls[1][0]).toMatch(/\/auth\/refresh$/)
  expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access')
  expect(sessionStorage.getItem('qhs-refresh-token')).toBe('new-refresh')
})
