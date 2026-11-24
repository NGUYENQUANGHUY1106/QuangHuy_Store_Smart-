import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'

export function PaymentSandboxPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Thanh toán sandbox' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">P2 · Chưa kích hoạt</p>
        <h1>Thanh toán sandbox</h1>
      </header>
      <section className="empty-state compact">
        <h2>Chưa có cổng thanh toán thật</h2>
        <p>Trang này mô tả luồng sandbox; COD vẫn là phương thức demo P0.</p>
        <Link to="/checkout">
          <Button>Quay lại thanh toán</Button>
        </Link>
      </section>
    </div>
  )
}

export function AiTryOnIntroPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'AI Try-On' }]}
      />
      <header className="info-hero ai-hero">
        <p className="eyebrow">AI Try-On · Draft</p>
        <h1>Trải nghiệm thử đồ AI</h1>
      </header>
      <section className="tryon-grid">
        <article>
          <h2>Chính sách minh bạch</h2>
          <p>
            Kết quả chỉ mang tính tham khảo, chưa xác nhận kích thước vừa
            chân/người.
          </p>
        </article>
        <article>
          <h2>Ảnh cá nhân</h2>
          <p>
            Không tải ảnh thật nếu chưa chấp thuận consent và quy tắc lưu trữ.
          </p>
        </article>
        <article>
          <h2>Trạng thái thử nghiệm</h2>
          <p>Chưa có model hoặc inference được xác nhận cho tính năng này.</p>
        </article>
      </section>
      <div className="tryon-actions">
        <Link to="/ai-try-on/privacy">
          <Button variant="secondary">Xem chính sách</Button>
        </Link>
        <Link to="/search">
          <Button>Chọn sản phẩm</Button>
        </Link>
      </div>
    </div>
  )
}

export function AiTryOnUploadPage() {
  const [consent, setConsent] = useState(false)
  const [fileName, setFileName] = useState('')
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'AI Try-On', href: '/ai-try-on' },
          { label: 'Tải ảnh' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Bước 1 / 3</p>
        <h1>Tải ảnh thử đồ</h1>
      </header>
      <form className="tryon-upload">
        <label className="upload-box">
          Chọn ảnh
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? '')
            }
          />
        </label>
        {fileName && <p>Đã chọn: {fileName}</p>}
        <label className="consent-row">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          Tôi đã đọc và đồng ý chính sách xử lý ảnh.
        </label>
        <Button type="button" disabled={!consent || !fileName}>
          Tiếp tục mô phỏng
        </Button>
      </form>
    </div>
  )
}

export function AiTryOnStatusPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'AI Try-On', href: '/ai-try-on' },
          { label: 'Trạng thái' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Mô phỏng job</p>
        <h1>Đang xử lý ảnh</h1>
      </header>
      <section className="empty-state compact">
        <div className="ai-progress">
          <span />
        </div>
        <h2>Chưa có inference thật</h2>
        <p>Worker/model chưa được kích hoạt theo quyết định mở.</p>
        <Link to="/ai-try-on/result">
          <Button variant="secondary">Xem trạng thái kết quả</Button>
        </Link>
      </section>
    </div>
  )
}

export function AiTryOnResultPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'AI Try-On', href: '/ai-try-on' },
          { label: 'Kết quả' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Không có kết quả model</p>
        <h1>Kết quả thử đồ</h1>
      </header>
      <section className="empty-state compact">
        <h2>AI chưa khả dụng</h2>
        <p>
          Màn hình này không hiển thị ảnh tạo ra hoặc cam kết độ chính xác chưa
          có bằng chứng.
        </p>
      </section>
    </div>
  )
}

export function AiPrivacyPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'AI Try-On', href: '/ai-try-on' },
          { label: 'Chính sách ảnh' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Consent · Retention · Xóa dữ liệu</p>
        <h1>Chính sách ảnh & chấp thuận AI</h1>
      </header>
      <article className="policy-content">
        <h2>Nguyên tắc</h2>
        <ul>
          <li>Chỉ thu thập ảnh sau khi người dùng đồng ý rõ mục đích.</li>
          <li>Không dùng ảnh để huấn luyện nếu chưa được phê duyệt.</li>
          <li>
            TTL và cách xóa vật lý cần được quyết định trước khi nhận ảnh thật.
          </li>
          <li>Kết quả không khẳng định độ vừa size hoặc độ chân thực.</li>
        </ul>
      </article>
    </div>
  )
}
