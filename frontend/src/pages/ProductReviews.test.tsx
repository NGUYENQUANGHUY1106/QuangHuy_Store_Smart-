import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { mockApi } from '../services/mockApi'
import { ProductReviews } from './ProductReviews'

const existingReview = {
  id: 4,
  author: 'Nguyễn Huy',
  body: '<b>Đúng kích cỡ</b>',
  rating: 5,
  product_name: 'Giày Mizuno',
  color: 'Xanh',
  size: '40',
  thumbnail: '/media/catalog-db/test',
  replies: [
    {
      id: 1,
      author: 'Nguyễn Huy',
      body: 'Phản hồi của người mua',
      from_shop: false,
    },
    { id: 2, author: 'An', body: 'Phản hồi hỗ trợ', from_shop: true },
  ],
}

function renderReviews() {
  render(
    <MemoryRouter>
      <AuthProvider>
        <ProductReviews slug="test-kit" />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Product reviews', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem(
      'qhs-user',
      JSON.stringify({ id: 'buyer', addresses: [] }),
    )
  })

  afterEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('posts rating and comment only when the API provides an eligible order item', async () => {
    vi.spyOn(mockApi, 'getProductReviews')
      .mockResolvedValueOnce({
        eligible_order_item_id: 'item-1',
        results: [],
        next: null,
      })
      .mockResolvedValue({
        eligible_order_item_id: null,
        results: [existingReview],
        next: null,
      })
    const createReview = vi
      .spyOn(mockApi, 'createReview')
      .mockResolvedValue({ id: 4 })
    renderReviews()
    fireEvent.click(await screen.findByRole('radio', { name: '5 sao' }))
    fireEvent.change(screen.getByLabelText('Nhận xét của bạn'), {
      target: { value: 'Đúng kích cỡ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }))
    expect(await screen.findByText('<b>Đúng kích cỡ</b>')).toBeInTheDocument()
    expect(screen.getByText('Màu Xanh · Size 40')).toBeInTheDocument()
    expect(screen.getAllByText('Nguyễn Huy')).toHaveLength(2)
    expect(screen.getAllByText('Chủ shop')).toHaveLength(1)
    expect(createReview).toHaveBeenCalledWith('item-1', 5, 'Đúng kích cỡ')
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  })

  it('lets an ineligible signed-in customer reply without a rating form', async () => {
    vi.spyOn(mockApi, 'getProductReviews').mockResolvedValue({
      eligible_order_item_id: null,
      results: [existingReview],
      next: null,
    })
    const reply = vi
      .spyOn(mockApi, 'replyToReview')
      .mockResolvedValue({ id: 5 })
    renderReviews()
    fireEvent.click(await screen.findByRole('button', { name: 'Phản hồi' }))
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nội dung phản hồi'), {
      target: { value: 'Cảm ơn bạn' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi phản hồi' }))
    expect(await screen.findByText('Đã gửi phản hồi.')).toBeInTheDocument()
    expect(reply).toHaveBeenCalledWith(4, 'Cảm ơn bạn')
  })
})
