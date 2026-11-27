import { MemoryRouter } from 'react-router-dom'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminDashboardPage } from './AdminDashboardPage'
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
    start_date: '2026-11-23',
    orders: {
      pending: 1,
      confirmed: 0,
      shipping: 0,
      completed: 1,
      cancelled: 0,
      total: 2,
    },
    inventory: { low_stock_count: 1, out_of_stock_count: 0, watch: [] },
    catalog: { published: 1, draft: 0, archived: 0, active_customers: 1 },
    revenue_delivered: '650000.00',
    cod_collected: null,
    series: [
      {
        date: '2026-11-23',
        revenue_delivered: '650000.00',
        orders_created: 0,
        orders_completed: 1,
      },
    ],
    top_skus: [
      {
        sku_snapshot: 'DASH-41',
        name: 'Giày Dash',
        color: 'Đen',
        size: '41',
        quantity: 2,
      },
    ],
    recent_orders: [],
  })
  render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>,
  )
  expect(await screen.findByText('COD đã thu · Chưa theo dõi')).toBeVisible()
  expect(screen.getAllByText(/650[.,]000/)).toHaveLength(2)
  expect(screen.getByText(/DASH-41/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Đơn hàng' }))
  expect(
    screen.getByRole('button', { name: /0 đơn mới, 1 hoàn thành/ }),
  ).toHaveAttribute('aria-pressed', 'true')
  fireEvent.change(screen.getByLabelText('Khoảng báo cáo'), {
    target: { value: '14' },
  })
  expect(metrics).toHaveBeenLastCalledWith('', 14)
  await screen.findByText(/DASH-41/)
  fireEvent.change(screen.getByLabelText('Ngày kết thúc'), {
    target: { value: '2026-11-22' },
  })
  expect(metrics).toHaveBeenLastCalledWith('2026-11-22', 14)
  await screen.findByText(/DASH-41/)
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
      'Không thể tải báo cáo',
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
