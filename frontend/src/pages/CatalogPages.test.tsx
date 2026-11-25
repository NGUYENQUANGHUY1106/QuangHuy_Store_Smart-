import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CatalogPage } from './CatalogPage'
import { ProductDetailPage } from './ProductDetailPage'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { mockApi } from '../services/mockApi'

describe('Catalog & Detail UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders catalog page with products from API', async () => {
    vi.spyOn(mockApi, 'getCatalogProducts').mockResolvedValue({
      count: 1,
      hasNext: false,
      products: [
        {
          id: 'p-1',
          name: 'Giày Đá Bóng Test',
          slug: 'giay-da-bong-test',
          brand: 'Nike',
          category: 'Giày bóng đá',
          description: 'Mô tả test',
          originalPrice: 1200000,
          salePrice: 1000000,
          rating: 0,
          reviewCount: 0,
          image: '/test.jpg',
          badge: 'Mới',
          variants: [
            { id: 'v-1', sku: 'TEST-40', size: '40', color: 'Đen', stock: 5 },
          ],
        },
      ],
    })
    vi.spyOn(mockApi, 'getPublicCatalogOptions').mockResolvedValue({
      categories: [],
      brands: [],
    })

    render(
      <MemoryRouter initialEntries={['/search']}>
        <AuthProvider>
          <CartProvider>
            <CatalogPage />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Giày Đá Bóng Test')).toBeInTheDocument()
    expect(screen.getByText('1.000.000 ₫')).toBeInTheDocument()
  })

  it('selects variant and displays stock on product detail page', async () => {
    vi.spyOn(mockApi, 'getProductReviews').mockResolvedValue({
      results: [],
      eligible_order_item_id: null,
      next: null,
    })
    vi.spyOn(mockApi, 'getCatalogProduct').mockResolvedValue({
      id: 'p-detail',
      name: 'Giày Chi Tiết',
      slug: 'giay-chi-tiet',
      brand: 'Adidas',
      category: 'Giày bóng đá',
      description: 'Mô tả chi tiết',
      originalPrice: 1500000,
      salePrice: 1200000,
      rating: 0,
      reviewCount: 0,
      image: '/detail.jpg',
      images: [],
      badge: '',
      variants: [
        {
          id: 'v-1',
          unitPrice: 1200000,
          sku: 'AD-41-TRANG',
          size: '41',
          color: 'Trắng',
          stock: 3,
        },
        { id: 'v-2', sku: 'AD-42-TRANG', size: '42', color: 'Trắng', stock: 0 },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/products/giay-chi-tiet']}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/checkout" element={<p>Thanh toán trực tiếp</p>} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Giày Chi Tiết' }),
    ).toBeInTheDocument()

    // Variant stock 0 button for size 42 should be disabled
    const size42Btn = screen.getByRole('button', { name: '42' })
    expect(size42Btn).toBeDisabled()

    // Size 41 button should be enabled
    const size41Btn = screen.getByRole('button', { name: '41' })
    expect(size41Btn).not.toBeDisabled()
    fireEvent.click(size41Btn)

    expect(
      screen.getByText('SKU AD-41-TRANG · Còn 3 sản phẩm'),
    ).toBeInTheDocument()

    // Add to cart
    fireEvent.click(screen.getByRole('button', { name: 'Thêm vào giỏ' }))
    expect(
      await screen.findByText('Đã thêm 1 sản phẩm vào giỏ hàng.'),
    ).toBeInTheDocument()

    const addItem = vi.spyOn(mockApi, 'addCartItem')
    fireEvent.click(screen.getByRole('button', { name: 'Mua ngay' }))
    expect(screen.getByText('Thanh toán trực tiếp')).toBeInTheDocument()
    expect(addItem).not.toHaveBeenCalled()
  })
})
