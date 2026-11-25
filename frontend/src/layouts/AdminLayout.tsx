import {
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  LogOut,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProductChat } from '../context/useProductChat'
import { ProfileAvatar } from '../components/ReviewDetails'

const adminNavigation = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Sản phẩm', href: '/admin/products', icon: Package },
  { label: 'Kho hàng', href: '/admin/inventory', icon: Warehouse },
  { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Voucher', href: '/admin/vouchers', icon: Package },
  { label: 'Đánh giá', href: '/admin/reviews', icon: MessageSquare },
  { label: 'Tin nhắn', href: '/admin/messages', icon: MessagesSquare },
  { label: 'Cài đặt', href: '/admin/settings', icon: Warehouse },
]

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const chat = useProductChat(
    user?.role === 'ADMIN' ? user.id : undefined,
    true,
  )
  const unread = chat.snapshot.inbox.reduce((sum, row) => sum + row.unread, 0)
  if (user?.role !== 'ADMIN') return <Navigate to="/admin/login" replace />
  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <button
          className="admin-sidebar-close"
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Đóng menu"
        >
          <X size={20} />
        </button>
        <div className="brand admin-brand">
          <span>QUANGHUY</span>
          <strong>SPORT</strong>
        </div>
        <nav aria-label="Admin navigation">
          {adminNavigation.map(({ label, href, icon: Icon }) => (
            <NavLink key={href} to={href} end={href === '/admin'}>
              <Icon size={18} />
              <span>{label}</span>
              {href === '/admin/messages' && unread > 0 && (
                <span
                  className="chat-badge"
                  aria-label={`${unread} tin nhắn chưa đọc`}
                >
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <NavLink className="admin-logout" to="/admin/login" onClick={logout}>
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </NavLink>
      </aside>
      {menuOpen && (
        <button
          className="admin-mobile-backdrop"
          type="button"
          aria-label="Đóng menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Mở menu quản trị"
          >
            <Menu size={20} />
          </button>
          <div className="admin-topbar-actions">
            <Link className="admin-store-link" to="/">
              <ExternalLink size={16} />
              Cửa hàng
            </Link>
            <div className="admin-profile">
              <ProfileAvatar name={user.name} url={user.avatarUrl} />
              <div>
                <strong>{user.name}</strong>
                <small>Quản trị viên</small>
              </div>
            </div>
          </div>
        </header>
        <Outlet context={chat} />
      </main>
    </div>
  )
}
