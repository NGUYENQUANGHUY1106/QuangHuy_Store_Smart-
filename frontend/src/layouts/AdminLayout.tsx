import {
  LayoutDashboard,
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

const adminNavigation = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Sản phẩm', href: '/admin/products', icon: Package },
  { label: 'Kho hàng', href: '/admin/inventory', icon: Warehouse },
  { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Người dùng', href: '/admin/users', icon: Users },
  { label: 'Voucher', href: '/admin/vouchers', icon: Package },
  { label: 'Cài đặt', href: '/admin/settings', icon: Warehouse },
]

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
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
              <span>A</span>
              <div>
                <strong>Admin</strong>
                <small>Quản trị viên</small>
              </div>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
