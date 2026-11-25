import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { mockApi } from '../services/mockApi'
import { AdminReviewsPage } from './AdminReviewsPage'

afterEach(() => vi.restoreAllMocks())

it('shows the order line and customer, replies as the store and confirms removal', async () => {
  const reviews = [
    {
      id: 12,
      author: 'Nguyễn Huy',
      body: 'Vừa chân',
      rating: 5,
      created_at: '2026-11-25T12:00:00Z',
      product_name: 'Giày Mizuno',
      thumbnail: '/media/catalog-db/mizuno',
      product_slug: 'giay-mizuno',
      size: '40',
      color: 'Xanh dương',
      order_number: 'QHS-123',
      sku: 'MIZ-40',
      customer_email: 'buyer@example.com',
      replies: [],
    },
  ]
  vi.spyOn(mockApi, 'getAdminReviews')
    .mockResolvedValueOnce({ results: reviews, next: null })
    .mockResolvedValueOnce({ results: reviews, next: null })
    .mockResolvedValue({ results: [], next: null })
  const reply = vi
    .spyOn(mockApi, 'adminReplyToReview')
    .mockResolvedValue({ id: 20 })
  const remove = vi.spyOn(mockApi, 'removeAdminReview').mockResolvedValue(null)
  render(
    <MemoryRouter>
      <AdminReviewsPage />
    </MemoryRouter>,
  )

  expect(await screen.findByText('buyer@example.com')).toBeInTheDocument()
  expect(screen.getByText('Màu Xanh dương · Size 40')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Xem sản phẩm' })).toHaveAttribute(
    'href',
    '/products/giay-mizuno#reviews',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Phản hồi' }))
  fireEvent.change(screen.getByLabelText('Phản hồi của cửa hàng'), {
    target: { value: 'Cảm ơn bạn.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Gửi phản hồi' }))
  expect(
    await screen.findByText('Đã gửi phản hồi của cửa hàng.'),
  ).toBeInTheDocument()
  expect(reply).toHaveBeenCalledWith(12, 'Cảm ơn bạn.')

  fireEvent.click(await screen.findByRole('button', { name: 'Gỡ đánh giá' }))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Xác nhận gỡ',
    }),
  )
  expect(await screen.findByText('Chưa có đánh giá.')).toBeInTheDocument()
  expect(remove).toHaveBeenCalledWith(12)
})
