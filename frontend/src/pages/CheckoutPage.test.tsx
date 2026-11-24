import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CheckoutPage } from './CheckoutPage'
import { OrderSuccessPage } from './OrderSuccessPage'
import { CartProvider } from '../context/CartContext'
import { AuthProvider } from '../context/AuthContext'
import { OrderProvider } from '../context/OrderContext'
import { mockApi } from '../services/mockApi'

describe('Checkout UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders empty checkout message when cart is empty', () => {
    localStorage.setItem('qhs-cart', '[]')
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <CheckoutPage />
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Không có sản phẩm để thanh toán' }),
    ).toBeInTheDocument()
  })

  it('successfully creates order via API and navigates to success page', async () => {
    sessionStorage.setItem(
      'qhs-user',
      JSON.stringify({
        id: 'test-user',
        name: '',
        email: '',
        phone: '',
        addresses: [],
      }),
    )
    vi.spyOn(mockApi, 'getCart').mockResolvedValue({
      items: [
        {
          id: 'line-uuid',
          variant_id: 'variant-1',
          sku: 'TEST-41',
          product_name: 'Sample',
          size: '41',
          color: 'Black',
          qty: 1,
          unit_price: '600000',
          stock_qty: 3,
          is_available: true,
        },
      ],
    })
    vi.spyOn(mockApi, 'quoteCheckout').mockResolvedValue({
      subtotal: '600000',
      shipping: '0',
      discount: '0',
      total: '600000',
      quote_token: 'signed-quote',
    })

    const checkout = vi
      .spyOn(mockApi, 'checkout')
      .mockRejectedValueOnce(new TypeError('Mất kết nối sau khi gửi đơn'))
      .mockResolvedValue({
        id: 'ord-12345',
        number: 'QHS-261121-000001',
        status: 'PENDING',
        total: '3890000',
      })

    vi.spyOn(mockApi, 'getOrderDetail').mockResolvedValue({
      number: 'QHS-261121-000001',
      total: '3890000',
    })

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <Routes>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
              </Routes>
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    // Fill form
    fireEvent.change(await screen.findByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    })
    fireEvent.change(screen.getByPlaceholderText('0900000000'), {
      target: { value: '0901234567' },
    })
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
      target: { value: 'a@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Số nhà, tên đường'), {
      target: { value: '123 Test Street' },
    })

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Đặt hàng ngay' }),
      ).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng ngay' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Mất kết nối sau khi gửi đơn',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng ngay' }))
    expect(checkout.mock.calls[1]).toEqual(checkout.mock.calls[0])

    await waitFor(() => {
      expect(mockApi.checkout).toHaveBeenCalled()
      expect(screen.getByTestId('order-number')).toHaveTextContent(
        'QHS-261121-000001',
      )
    })
  })

  it('displays transparent error message when checkout fails', async () => {
    sessionStorage.setItem(
      'qhs-user',
      JSON.stringify({
        id: 'test-user',
        name: '',
        email: '',
        phone: '',
        addresses: [],
      }),
    )
    vi.spyOn(mockApi, 'getCart').mockResolvedValue({
      items: [
        {
          id: 'line-uuid',
          variant_id: 'variant-1',
          sku: 'TEST-41',
          product_name: 'Sample',
          size: '41',
          color: 'Black',
          qty: 1,
          unit_price: '600000',
          stock_qty: 3,
          is_available: true,
        },
      ],
    })
    vi.spyOn(mockApi, 'quoteCheckout').mockResolvedValue({
      subtotal: '600000',
      shipping: '0',
      discount: '0',
      total: '600000',
      quote_token: 'signed-quote',
    })

    vi.spyOn(mockApi, 'checkout').mockRejectedValue(
      new Error('Sản phẩm không đủ tồn kho.'),
    )

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <AuthProvider>
          <CartProvider>
            <OrderProvider>
              <Routes>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
              </Routes>
            </OrderProvider>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    fireEvent.change(await screen.findByPlaceholderText('Nguyễn Văn A'), {
      target: { value: 'Nguyễn Văn A' },
    })
    fireEvent.change(screen.getByPlaceholderText('0900000000'), {
      target: { value: '0901234567' },
    })
    fireEvent.change(screen.getByPlaceholderText('email@example.com'), {
      target: { value: 'a@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Số nhà, tên đường'), {
      target: { value: '123 Test Street' },
    })

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Đặt hàng ngay' }),
      ).toBeEnabled(),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Đặt hàng ngay' }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Sản phẩm không đủ tồn kho.',
      )
    })
  })
})
