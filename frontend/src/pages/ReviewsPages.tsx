import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'

export function NewReviewPage() {
  const [params] = useSearchParams()
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSent(true)
  }
  return (
    <div className="info-page review-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Viết đánh giá' }]}
      />
      <header className="info-hero">
        <p className="eyebrow">Trải nghiệm sản phẩm</p>
        <h1>Viết đánh giá</h1>
      </header>
      {sent ? (
        <div className="auth-success">
          <strong>Đã ghi nhận đánh giá mẫu</strong>
          <p>Chức năng backend/chính sách review chưa được kích hoạt.</p>
          <Link to="/account/reviews">Xem lịch sử đánh giá</Link>
        </div>
      ) : (
        <form className="support-form" onSubmit={submit}>
          <p>Mã đơn: {params.get('order') ?? 'Chưa chọn đơn'}</p>
          <fieldset className="rating-picker">
            <legend>Điểm đánh giá</legend>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                className={value <= rating ? 'active' : ''}
                key={value}
                onClick={() => setRating(value)}
              >
                ★
              </button>
            ))}
          </fieldset>
          <label>
            Nội dung
            <textarea
              required
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </label>
          <Button type="submit">Gửi đánh giá</Button>
        </form>
      )}
    </div>
  )
}

export function ReviewHistoryPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Lịch sử đánh giá' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Nhận xét của tôi</p>
        <h1>Lịch sử đánh giá</h1>
      </header>
      <section className="empty-state compact">
        <h2>Chưa có đánh giá</h2>
        <p>Đánh giá sẽ hiển thị sau khi đơn hàng hoàn thành.</p>
      </section>
    </div>
  )
}
