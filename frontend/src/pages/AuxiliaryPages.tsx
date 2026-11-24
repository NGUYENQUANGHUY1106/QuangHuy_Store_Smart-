import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'

export function VerifyEmailPage() {
  const [verified, setVerified] = useState(false)
  return (
    <div className="compact-auth-page">
      <section className="auth-form">
        <p className="eyebrow">Xác minh email</p>
        <h2>
          {verified ? 'Email đã được xác minh' : 'Xác nhận địa chỉ email'}
        </h2>
        <p>
          {verified
            ? 'Tài khoản mô phỏng đã sẵn sàng sử dụng.'
            : 'Nhấn nút dưới để mô phỏng xác minh liên kết email.'}
        </p>
        <Button type="button" onClick={() => setVerified(true)}>
          {verified ? 'Tiếp tục' : 'Xác minh email'}
        </Button>
        {verified && (
          <Link className="auth-link" to="/login">
            Đăng nhập
          </Link>
        )}
      </section>
    </div>
  )
}

export function TrackOrderPage() {
  const [code, setCode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
  }
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Tra cứu đơn hàng' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Kiểm tra trạng thái</p>
        <h1>Tra cứu đơn hàng</h1>
      </header>
      <form className="support-form" onSubmit={submit}>
        <label>
          Mã đơn hàng
          <input
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="QHS-260001"
          />
        </label>
        <Button type="submit">Tra cứu</Button>
        {submitted && (
          <p className="variant-message">
            Đơn <strong>{code}</strong> đang ở trạng thái mô phỏng. Đăng nhập để
            xem chi tiết.
          </p>
        )}
      </form>
    </div>
  )
}

export function ArticlesPage() {
  const articles = [
    {
      slug: 'chon-giang-theo-mat-san',
      title: 'Cách chọn giày theo mặt sân',
      excerpt: 'FG, TF và IC — ba lựa chọn phù hợp với từng điều kiện thi đấu.',
    },
    {
      slug: 'luu-y-size-giay',
      title: 'Size giày bền đẹp khi thi đấu',
      excerpt:
        'Đo bàn chân và chọn size chuẩn giúp nâng cao cảm giác kiểm soát bóng.',
    },
    {
      slug: 'phoi-trang-phuc-bong-da',
      title: 'Góc nhìn bóng đá phong cách',
      excerpt: 'Phối trang phục tập luyện năng động cho mọi buổi ra sân.',
    },
  ]
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Cẩm nang thể thao' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Blog & Cẩm nang</p>
        <h1>Kiến thức thể thao</h1>
      </header>
      <div className="blog-grid">
        {articles.map((article, index) => (
          <Link key={article.slug} to={`/articles/${article.slug}`}>
            <article>
              <span>0{index + 1}</span>
              <h3>{article.title}</h3>
              <p>{article.excerpt}</p>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function ArticleDetailPage() {
  const { slug } = useParams()
  const titles: Record<string, string> = {
    'chon-giang-theo-mat-san': 'Cách chọn giày theo mặt sân',
    'luu-y-size-giay': 'Size giày bền đẹp khi thi đấu',
    'phoi-trang-phuc-bong-da': 'Góc nhìn bóng đá phong cách',
  }
  return (
    <article className="article-detail">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Cẩm nang', href: '/articles' },
          { label: titles[slug ?? ''] ?? 'Bài viết' },
        ]}
      />
      <p className="eyebrow">Cẩm nang thể thao</p>
      <h1>{titles[slug ?? ''] ?? 'Bài viết thể thao'}</h1>
      <p>
        Mỗi bộ môn và mặt sân đều có yêu cầu riêng. Hãy ưu tiên độ bám, cảm giác
        chạm bóng và độ ổn định thay vì chọn theo hình thức duy nhất.
      </p>
      <h2>Điểm cần lưu ý</h2>
      <ul>
        <li>Đo size theo chiều dài bàn chân.</li>
        <li>Kiểm tra đế giày với loại mặt sân.</li>
        <li>Thử vận động nhẹ trước khi thi đấu chính thức.</li>
      </ul>
      <Link className="text-link" to="/search">
        Xem sản phẩm phù hợp
      </Link>
    </article>
  )
}
