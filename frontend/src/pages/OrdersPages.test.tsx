import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { OrdersPage, OrderDetailPage } from './OrdersPages'
import { OrderProvider } from '../context/OrderContext'
import { mockApi } from '../services/mockApi'

describe('Orders UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders orders list fetched from API', async () => {
    vi.spyOn(mockApi, 'getOrders').mockResolvedValue({
      hasNext: false,
      orders: [
        {
          id: 'QHS-TEST-001',
          status: 'completed',
          statusLabel: 'Hoàn thành',
          createdAt: '2026-11-21',
          total: 630000,
          items: [
            {
              id: 'it-1',
              productSlug: 'giay-da-bong-test',
              name: 'Giày Đá Bóng Test',
              sku: 'TEST-SKU-1',
              size: '41',
              color: 'Đen',
              quantity: 1,
              unitPrice: 600000,
              lineSubtotal: 600000,
            },
          ],
        },
      ],
    })

    render(
      <MemoryRouter>
        <OrderProvider>
          <OrdersPage />
        </OrderProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('QHS-TEST-001')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Đánh giá sản phẩm' }),
    ).toHaveAttribute(
      'href',
      '/products/giay-da-bong-test?reviewItem=it-1#reviews',
    )
    expect(screen.getByText(/630\.000/)).toBeInTheDocument()
  })

  it('renders order detail and cancels order via API', async () => {
    vi.spyOn(mockApi, 'getOrderDetail').mockResolvedValue({
      id: 'ord-uuid-1',
      number: 'QHS-DETAIL-001',
      status: 'PENDING',
      version: 1,
      payment_method: 'COD',
      total: '630000.00',
      address_snapshot: {
        receiver: 'Khách Xem',
        phone: '0901234567',
        street: '123 Đường Test',
      },
      items: [
        {
          id: 'it-1',
          variant: 'var-1',
          product_name_snapshot: 'Giày Chi Tiết',
          sku_snapshot: 'DETAIL-SKU',
          size_snapshot: '42',
          color_snapshot: 'Trắng',
          qty: 1,
          unit_price: '600000.00',
          line_subtotal: '600000.00',
        },
      ],
    })

    vi.spyOn(mockApi, 'cancelOrder')
      .mockRejectedValueOnce(new Error('Trạng thái đơn đã thay đổi'))
      .mockResolvedValue({
        id: 'ord-uuid-1',
        number: 'QHS-DETAIL-001',
        status: 'CANCELLED',
      })

    render(
      <MemoryRouter initialEntries={['/account/orders/QHS-DETAIL-001']}>
        <OrderProvider>
          <Routes>
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
          </Routes>
        </OrderProvider>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'QHS-DETAIL-001' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/123 Đường Test/)).toBeInTheDocument()

    // Click "Hủy đơn" button
    const cancelBtn = screen.getByRole('button', { name: 'Hủy đơn' })
    fireEvent.click(cancelBtn)

    expect(
      screen.getByText('Bạn có chắc muốn hủy đơn QHS-DETAIL-001?'),
    ).toBeInTheDocument()
    const confirmCancelBtn = screen.getAllByRole('button', {
      name: 'Hủy đơn',
    })[1]
    fireEvent.click(confirmCancelBtn)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Trạng thái đơn đã thay đổi',
    )
    expect(screen.getByRole('dialog')).toBeVisible()
    fireEvent.click(confirmCancelBtn)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await waitFor(() => {
      expect(mockApi.cancelOrder).toHaveBeenCalledWith(
        'QHS-DETAIL-001',
        'Khách hàng hủy đơn',
        1,
      )
    })
  })
})
