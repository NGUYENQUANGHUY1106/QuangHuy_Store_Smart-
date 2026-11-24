import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { CartPage } from './CartPage'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { mockApi } from '../services/mockApi'

describe('Cart UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders empty cart state when no items', () => {
    localStorage.setItem('qhs-cart', '[]')
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <CartPage />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Giỏ hàng trống' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Tiếp tục mua sắm' }),
    ).toBeInTheDocument()
  })

  it('calculates free shipping for orders >= 500k and applies voucher', async () => {
    localStorage.setItem(
      'qhs-cart',
      JSON.stringify([
        {
          variantId: 'variant-1',
          product: {
            name: 'Sample',
            brand: '',
            image: '/test.jpg',
            salePrice: 600000,
          },
          variant: { size: '41', color: 'black', stock: 3 },
          available: true,
          sku: 'NV16-410-BK',
          quantity: 1,
        },
      ]),
    )

    vi.spyOn(mockApi, 'validateVoucher').mockResolvedValue({
      eligible: true,
      voucher: { code: 'GIAM50', value: '50000', discount_type: 'FIXED' },
      discount: '50000',
    })

    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <CartPage />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Miễn phí')).toBeInTheDocument()

    const voucherInput = screen.getByPlaceholderText('Nhập mã voucher')
    fireEvent.change(voucherInput, { target: { value: 'GIAM50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng' }))

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Đã áp dụng GIAM50')
      expect(screen.getByText('-50.000 ₫')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Bỏ mã' }))
    expect(screen.queryByText('-50.000 ₫')).not.toBeInTheDocument()
    expect(voucherInput).toHaveValue('')
  })
  it('keeps server items visible on update and delete errors and permits retry', async () => {
    sessionStorage.setItem(
      'qhs-user',
      JSON.stringify({ id: 'user-1', addresses: [] }),
    )
    const line = {
      id: 'line-1',
      variant_id: 'variant-1',
      sku: 'SKU-41',
      product_name: 'Test shoe',
      color: 'Black',
      size: '41',
      qty: 1,
      unit_price: '500000',
      stock_qty: 4,
      is_available: true,
    }
    vi.spyOn(mockApi, 'getCart').mockResolvedValue({ items: [line] })
    const update = vi
      .spyOn(mockApi, 'updateCartItem')
      .mockRejectedValueOnce(new Error('Không thể đổi số lượng'))
      .mockResolvedValue({ item: { ...line, qty: 2 } })
    const remove = vi
      .spyOn(mockApi, 'removeCartItem')
      .mockRejectedValueOnce(new Error('Không thể xóa SKU'))
      .mockResolvedValue(null)
    render(
      <MemoryRouter>
        <AuthProvider>
          <CartProvider>
            <CartPage />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    const add = await screen.findByRole('button', { name: 'Tăng số lượng' })
    fireEvent.click(add)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể đổi số lượng',
    )
    expect(screen.getByRole('heading', { name: 'Test shoe' })).toBeVisible()
    fireEvent.click(add)
    await waitFor(() => expect(update).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
    const button = screen.getByRole('button', { name: 'Xóa' })
    fireEvent.click(button)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể xóa SKU',
    )
    fireEvent.click(button)
    expect(
      await screen.findByRole('heading', { name: 'Giỏ hàng trống' }),
    ).toBeVisible()
    expect(remove).toHaveBeenCalledTimes(2)
  })
})
