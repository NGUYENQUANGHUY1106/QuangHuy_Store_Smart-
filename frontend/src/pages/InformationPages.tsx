import { ChevronDown, Mail, MapPin, Phone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { brands, products } from '../services/mockApi'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'
import { ProductCard, type Product } from '../components/ProductCard'

export function BrandsPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thương hiệu' }]}
      />
      <header className="info-hero">
        <p className="eyebrow">Brand partner</p>
        <h1>Thương hiệu thể thao</h1>
      </header>
      <div className="brand-grid">
        {brands.map((brand) => (
          <Link key={brand.id} to={`/search?brand=${brand.slug}`}>
            <strong>{brand.name}</strong>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function SupportPage() {
  const [sent, setSent] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    setSent(true)
  }
  return (
    <div className="info-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Liên hệ hỗ trợ' }]}
      />
      <header className="info-hero">
        <p className="eyebrow">Chúng tôi luôn sẵn sàng</p>
        <h1>Liên hệ & hỗ trợ</h1>
      </header>
      <div className="support-layout">
        <section className="support-info">
          <div>
            <Phone size={20} />
            <p>
              <strong>Hotline</strong>
              <span>0900 000 000</span>
            </p>
          </div>
          <div>
            <Mail size={20} />
            <p>
              <strong>Email</strong>
              <span>support@quanghuysport.local</span>
            </p>
          </div>
          <div>
            <MapPin size={20} />
            <p>
              <strong>Showroom mẫu</strong>
              <span>TP. Hồ Chí Minh</span>
            </p>
          </div>
        </section>
        <form className="support-form" onSubmit={submit}>
          {sent ? (
            <div className="auth-success">
              <strong>Đã ghi nhận yêu cầu</strong>
              <p>Đây là biểu mẫu mô phỏng, chưa gửi dữ liệu thật.</p>
            </div>
          ) : (
            <>
              <label>
                Họ tên
                <input required />
              </label>
              <label>
                Email
                <input required type="email" />
              </label>
              <label>
                Nội dung
                <textarea required rows={5} />
              </label>
              <Button type="submit">Gửi liên hệ</Button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export function FaqPage() {
  const items = [
    [
      'Làm sao để chọn size giày?',
      'Đo chiều dài bàn chân và tham khảo bảng quy đổi EU trong trang chi tiết sản phẩm.',
    ],
    [
      'Đơn hàng COD là gì?',
      'COD là thanh toán khi nhận hàng trong giao diện demo; chưa xử lý thanh toán thật.',
    ],
    [
      'Có thể đổi size không?',
      'Quy trình đổi size cần được cửa hàng xác nhận theo chính sách đang chờ duyệt.',
    ],
    [
      'Thời gian giao hàng?',
      'Giao tiêu chuẩn 3–5 ngày hoặc hỏa tốc 1–2 ngày trong mô phỏng.',
    ],
  ]
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="info-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'FAQ' }]}
      />
      <header className="info-hero">
        <p className="eyebrow">Trung tâm trợ giúp</p>
        <h1>Câu hỏi thường gặp</h1>
      </header>
      <div className="faq-list">
        {items.map(([question, answer], index) => (
          <article key={question} className={open === index ? 'open' : ''}>
            <button
              type="button"
              onClick={() => setOpen(open === index ? null : index)}
            >
              <strong>{question}</strong>
              <ChevronDown size={18} />
            </button>
            {open === index && <p>{answer}</p>}
          </article>
        ))}
      </div>
    </div>
  )
}

export function SizeGuidePage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Bảng size' }]}
      />
      <header className="info-hero">
        <p className="eyebrow">Hướng dẫn</p>
        <h1>Bảng quy đổi size</h1>
      </header>
      <p>Chưa có hướng dẫn size</p>
    </div>
  )
}

export function WishlistPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Danh sách yêu thích' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Sản phẩm đã lưu</p>
        <h1>Yêu thích</h1>
      </header>
      <div className="product-grid catalog-grid">
        {(products as Product[]).slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

export function VouchersPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Voucher của tôi' },
        ]}
      />
      <header className="info-hero">
        <p className="eyebrow">Ưu đãi thành viên</p>
        <h1>Voucher của tôi</h1>
      </header>
      <section className="account-panel">
        <h2>Áp dụng mã giảm giá</h2>
        <p>
          Nhập mã bạn đã nhận vào ô Mã giảm giá trong giỏ hàng. Bạn sẽ thấy số
          tiền được giảm trước khi thanh toán.
        </p>
        <Link className="text-link" to="/cart">
          Mở giỏ hàng
        </Link>
      </section>
    </div>
  )
}

export function NotificationsPage() {
  return (
    <div className="info-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thông báo' }]}
      />
      <header className="info-hero">
        <p className="eyebrow">Cập nhật mới</p>
        <h1>Lịch sử thông báo</h1>
      </header>
      <div className="notification-list">
        <article>
          <strong>Flash sale mùa giải</strong>
          <p>Nhiều mẫu giày đang có mức giảm đặc biệt.</p>
        </article>
        <article>
          <strong>Đơn hàng của bạn</strong>
          <p>Theo dõi trạng thái vận chuyển tại khu vực tài khoản.</p>
        </article>
      </div>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <section className="order-success-page not-found-page">
      <p className="eyebrow">Lỗi 404</p>
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn không tồn tại hoặc đã được cập nhật.</p>
      <Link to="/">
        <Button>Về trang chủ</Button>
      </Link>
    </section>
  )
}

export function SystemStatePage({ code }: { code: string }) {
  const content: Record<
    string,
    { eyebrow: string; title: string; text: string }
  > = {
    S02: {
      eyebrow: '403',
      title: 'Bạn không có quyền truy cập',
      text: 'Tài khoản này không có quyền xem nội dung quản trị.',
    },
    S03: {
      eyebrow: '503',
      title: 'Hệ thống đang gián đoạn',
      text: 'Vui lòng thử lại sau. Giao diện demo vẫn hoạt động.',
    },
    S04: {
      eyebrow: 'Offline',
      title: 'Bạn đang ngoại tuyến',
      text: 'Kiểm tra kết nối internet và tải lại trang.',
    },
    S05: {
      eyebrow: 'Thông báo',
      title: 'Xác nhận hành động',
      text: 'Tất cả thay đổi quan trọng cần được xác nhận trước khi thực hiện.',
    },
  }
  const item = content[code] ?? content.S03
  return (
    <section className="order-success-page not-found-page">
      <p className="eyebrow">{item.eyebrow}</p>
      <h1>{item.title}</h1>
      <p>{item.text}</p>
      <Link to="/">
        <Button>Về trang chủ</Button>
      </Link>
    </section>
  )
}
