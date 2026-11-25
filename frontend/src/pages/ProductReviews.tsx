import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import {
  ReviewAuthor,
  ReviewProduct,
  ReviewReplies,
  type ProductReview,
} from '../components/ReviewDetails'
import { useAuth } from '../context/AuthContext'
import { mockApi } from '../services/mockApi'

type ReviewPage = {
  results: ProductReview[]
  eligible_order_item_id: string | null
  next: string | null
}

export function ProductReviews({ slug }: { slug: string }) {
  const { user } = useAuth()
  const { hash, search } = useLocation()
  const orderItem = new URLSearchParams(search).get('reviewItem')
  const heading = useRef<HTMLHeadingElement>(null)
  const [data, setData] = useState<ReviewPage>()
  const [page, setPage] = useState(1)
  const [revision, setRevision] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState('')
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [replyId, setReplyId] = useState<number>()
  const [replyText, setReplyText] = useState('')
  const [busy, setBusy] = useState(false)
  const userId = user?.id

  useEffect(() => {
    if (hash === '#reviews') {
      heading.current?.focus({ preventScroll: true })
      heading.current?.scrollIntoView()
    }
  }, [hash])

  useEffect(() => {
    let active = true
    mockApi
      .getProductReviews(slug, page, orderItem)
      .then((result: ReviewPage) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setLoadError('Không thể tải đánh giá. Vui lòng thử lại.')
      })
    return () => {
      active = false
    }
  }, [slug, userId, page, revision, orderItem])

  const submit = async (event: FormEvent, parentId?: number) => {
    event.preventDefault()
    if (busy) return
    const text = (parentId === undefined ? reviewText : replyText).trim()
    const orderItem = data?.eligible_order_item_id
    if (!text || (parentId === undefined && (!rating || !orderItem))) {
      setSubmitError('Vui lòng nhập nội dung và chọn số sao nếu đang đánh giá.')
      return
    }
    setBusy(true)
    setSubmitError('')
    setNotice('')
    try {
      if (parentId !== undefined) {
        await mockApi.replyToReview(parentId, text)
        setReplyId(undefined)
        setReplyText('')
        setNotice('Đã gửi phản hồi.')
      } else {
        await mockApi.createReview(orderItem, rating, text)
        setReviewText('')
        setRating(0)
        setPage(1)
        setNotice('Đã gửi đánh giá.')
      }
      setData(undefined)
      setLoadError('')
      setRevision((value) => value + 1)
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Không thể gửi nội dung.',
      )
    } finally {
      setBusy(false)
    }
  }

  const loadPage = (nextPage: number) => {
    setLoadError('')
    setData(undefined)
    setReplyId(undefined)
    setReplyText('')
    setPage(nextPage)
    setRevision((value) => value + 1)
  }

  return (
    <section
      className="product-tabs product-reviews"
      id="reviews"
      aria-labelledby="review-heading"
    >
      <h2 id="review-heading" ref={heading} tabIndex={-1}>
        Đánh giá sản phẩm
      </h2>
      {notice && <p role="status">{notice}</p>}
      {submitError && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}
      {loadError ? (
        <>
          <p role="alert">{loadError}</p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => loadPage(page)}
          >
            Tải lại
          </Button>
        </>
      ) : !data ? (
        <p role="status">Đang tải đánh giá…</p>
      ) : (
        <>
          {!!user && data.eligible_order_item_id ? (
            <form
              className="product-review-form"
              onSubmit={(event) => void submit(event)}
            >
              <fieldset>
                <legend>Chấm điểm</legend>
                <div className="review-rating-options">
                  {[1, 2, 3, 4, 5].map((stars) => (
                    <label key={stars}>
                      <input
                        type="radio"
                        name="review-rating"
                        required
                        checked={rating === stars}
                        onChange={() => setRating(stars)}
                      />
                      {stars} sao
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                Nhận xét của bạn
                <textarea
                  required
                  maxLength={2000}
                  rows={3}
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                />
              </label>
              <Button type="submit" disabled={busy}>
                Gửi đánh giá
              </Button>
            </form>
          ) : (
            <p>
              Chỉ khách hàng có sản phẩm trong đơn đã hoàn thành mới có thể chấm
              sao.
            </p>
          )}
          {data.results.length === 0 && <p>Chưa có đánh giá.</p>}
          {data.results.map((review) => (
            <article key={review.id} className="product-review">
              <div className="product-review-meta">
                <ReviewAuthor
                  name={review.author}
                  avatarUrl={review.avatar_url}
                />
                <span>Đã mua hàng</span>
                <span
                  className="product-review-stars"
                  aria-label={`${review.rating} trên 5 sao`}
                >
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </span>
              </div>
              <ReviewProduct review={review} />
              <p>{review.body}</p>
              <ReviewReplies replies={review.replies} />
              {user ? (
                replyId === review.id ? (
                  <form
                    className="product-review-form"
                    onSubmit={(event) => void submit(event, review.id)}
                  >
                    <label>
                      Nội dung phản hồi
                      <textarea
                        required
                        maxLength={2000}
                        rows={3}
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                      />
                    </label>
                    <div className="hero-actions">
                      <Button type="submit" disabled={busy}>
                        Gửi phản hồi
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          setReplyId(undefined)
                          setReplyText('')
                          setSubmitError('')
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      setReplyId(review.id)
                      setReplyText('')
                      setSubmitError('')
                    }}
                  >
                    Phản hồi
                  </Button>
                )
              ) : (
                <Link
                  className="text-link"
                  to="/login"
                  state={{ returnTo: `/products/${slug}#reviews` }}
                >
                  Đăng nhập để phản hồi
                </Link>
              )}
            </article>
          ))}
          {(page > 1 || data.next) && (
            <nav className="hero-actions" aria-label="Trang đánh giá">
              <Button
                type="button"
                variant="secondary"
                disabled={page === 1 || busy}
                onClick={() => loadPage(page - 1)}
              >
                Trang trước
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!data.next || busy}
                onClick={() => loadPage(page + 1)}
              >
                Trang sau
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
