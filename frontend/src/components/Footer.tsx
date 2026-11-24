import { Camera, Mail, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="brand footer-brand">
            <span>QUANGHUY</span>
            <strong>SPORT</strong>
          </div>
          <p>Đồ thể thao và giày bóng đá cho mọi sân chơi.</p>
          <div className="social-links">
            <a href="#facebook" aria-label="Facebook">
              <MessageCircle size={18} />
            </a>
            <a href="#instagram" aria-label="Instagram">
              <Camera size={18} />
            </a>
            <a href="mailto:hello@quanghuysport.local" aria-label="Email">
              <Mail size={18} />
            </a>
          </div>
        </div>
        <div>
          <h3>Mua sắm</h3>
          <Link to="/category/giay-bong-da">Giày bóng đá</Link>
          <Link to="/category/quan-ao-the-thao">Quần áo thể thao</Link>
          <Link to="/brands">Thương hiệu</Link>
        </div>
        <div>
          <h3>Hỗ trợ</h3>
          <Link to="/faq">FAQ</Link>
          <Link to="/support">Liên hệ</Link>
          <Link to="/size-guide">Bảng size</Link>
          <Link to="/track-order">Tra cứu đơn hàng</Link>
          <Link to="/articles">Cẩm nang thể thao</Link>
        </div>
        <div>
          <h3>Tài khoản</h3>
          <Link to="/account">Tài khoản</Link>
          <Link to="/account/orders">Đơn hàng</Link>
          <Link to="/wishlist">Yêu thích</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 QUANGHUY_SPORT</span>
        <span>Dữ liệu mẫu cho giao diện — chưa là chính sách giao dịch</span>
      </div>
    </footer>
  )
}
