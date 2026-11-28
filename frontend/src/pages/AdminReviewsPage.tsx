import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import {
  ReviewAuthor,
  ReviewProduct,
  ReviewReplies,
  type ProductReview,
} from '../components/ReviewDetails'
import { mockApi } from '../services/mockApi'

type AdminReview = ProductReview & {
  customer_email: string
  product_slug: string | null
  sku: string
  order_number: string
}

export function AdminReviewsPage() {
  const [data, setData] = useState<{
    results: AdminReview[]
    next: string | null
  }>()
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [replyId, setReplyId] = useState<number>()
  const [reply, setReply] = useState('')
  const [pendingRemoval, setPendingRemoval] = useState<AdminReview>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    mockApi
      .getAdminReviews(page)
      .then((response) => {
        if (active) setData(response)
      })
      .catch(() => {
        if (active) setLoadError('Không thể tải danh sách đánh giá.')
      })
    return () => {
      active = false
    }
  }, [page, revision])

  function reload(nextPage = page) {
    setData(undefined)
    setLoadError('')
    setPage(nextPage)
    setRevision((value) => value + 1)
  }

  async function sendReply(event: FormEvent, reviewId: number) {
    event.preventDefault()
    if (busy || !reply.trim()) return
    setBusy(true)
    setActionError('')
    setNotice('')
    try {
      await mockApi.adminReplyToReview(reviewId, reply.trim())
      setReplyId(undefined)
      setReply('')
      setNotice('Đã gửi phản hồi của cửa hàng.')
      reload()
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Không thể gửi phản hồi.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function removeReview() {
    if (!pendingRemoval || busy) return
    setBusy(true)
    setActionError('')
    setNotice('')
    try {
      await mockApi.removeAdminReview(pendingRemoval.id)
      setPendingRemoval(undefined)
      setReplyId(undefined)
      setReply('')
      setNotice('Đã gỡ đánh giá khỏi trang sản phẩm.')
      reload(data?.results.length === 1 && page > 1 ? page - 1 : page)
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Không thể gỡ đánh giá.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page admin-review-page">
      <header className="admin-page-header">
        <h1>Quản lý đánh giá</h1>
      </header>
      {notice && <p role="status">{notice}</p>}
      {actionError && !pendingRemoval && (
        <p className="form-error" role="alert">
          {actionError}
        </p>
      )}
      {loadError ? (
        <div>
          <p role="alert">{loadError}</p>
          <Button type="button" variant="secondary" onClick={() => reload()}>
            Tải lại
          </Button>
        </div>
      ) : !data ? (
        <p role="status">Đang tải đánh giá…</p>
      ) : data.results.length === 0 ? (
        <p>Chưa có đánh giá.</p>
      ) : (
        data.results.map((review) => (
          <article className="admin-panel admin-review" key={review.id}>
            <header className="admin-review-header">
              <ReviewProduct review={review} />
              <div className="admin-review-customer">
                <ReviewAuthor
                  name={review.author}
                  avatarUrl={review.avatar_url}
                />
                <p>{review.customer_email}</p>
              </div>
              <div className="admin-review-rating">
                <strong className="product-review-stars">
                  {review.rating}/5 sao
                </strong>
                <p>
                  {new Date(review.created_at).toLocaleDateString('vi-VN', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                  })}
                </p>
              </div>
            </header>
            <p className="admin-review-reference">
              <span>SKU {review.sku}</span>
              <span>Đơn {review.order_number}</span>
            </p>
            <p className="admin-review-body">{review.body}</p>
            {review.replies.length > 0 && (
              <section className="admin-review-replies">
                <h2>Phản hồi ({review.replies.length})</h2>
                <ReviewReplies replies={review.replies} />
              </section>
            )}
            {replyId === review.id && (
              <form
                className="product-review-form"
                onSubmit={(event) => void sendReply(event, review.id)}
              >
                <label>
                  Phản hồi của cửa hàng
                  <textarea
                    required
                    maxLength={2000}
                    rows={3}
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                  />
                </label>
                <Button type="submit" disabled={busy || !reply.trim()}>
                  Gửi phản hồi
                </Button>
              </form>
            )}
            <div className="hero-actions admin-review-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setActionError('')
                  setReplyId(replyId === review.id ? undefined : review.id)
                  setReply('')
                }}
              >
                {replyId === review.id ? 'Hủy phản hồi' : 'Phản hồi'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setActionError('')
                  setPendingRemoval(review)
                }}
              >
                Gỡ đánh giá
              </Button>
              {review.product_slug && (
                <Link
                  className="text-link"
                  to={`/products/${review.product_slug}#reviews`}
                >
                  Xem sản phẩm
                </Link>
              )}
            </div>
          </article>
        ))
      )}
      {data && (page > 1 || data.next) && (
        <nav className="hero-actions" aria-label="Trang đánh giá">
          <Button
            type="button"
            variant="secondary"
            disabled={busy || page === 1}
            onClick={() => reload(page - 1)}
          >
            Trang trước
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || !data.next}
            onClick={() => reload(page + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
      <Modal
        open={!!pendingRemoval}
        title="Gỡ đánh giá"
        onClose={() => {
          if (!busy) setPendingRemoval(undefined)
        }}
      >
        <p>
          Gỡ đánh giá của {pendingRemoval?.author} về{' '}
          {pendingRemoval?.product_name} và các phản hồi khỏi trang sản phẩm?
        </p>
        {actionError && (
          <p className="form-error" role="alert">
            {actionError}
          </p>
        )}
        <div className="hero-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => setPendingRemoval(undefined)}
          >
            Hủy
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void removeReview()}
          >
            Xác nhận gỡ
          </Button>
        </div>
      </Modal>
    </div>
  )
}
