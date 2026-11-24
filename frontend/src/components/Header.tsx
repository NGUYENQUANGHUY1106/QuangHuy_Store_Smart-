import {
  ChevronDown,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Button } from './Button'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { mockApi } from '../services/mockApi'

const navigation = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Giày bóng đá', href: '/category/giay-bong-da' },
  { label: 'Quần áo', href: '/category/quan-ao-the-thao' },
  { label: 'Thương hiệu', href: '/brands' },
  { label: 'Phụ kiện', href: '/category/phu-kien' },
]

export function Header() {
  const { itemCount } = useCart()
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{
    query: string
    products: { id: string; slug: string; name: string }[]
  }>()
  const navigate = useNavigate()
  useEffect(() => {
    if (!searchOpen || query.trim().length < 2) return
    let active = true
    const timer = window.setTimeout(() => {
      mockApi
        .getSearchSuggestions(query.trim())
        .then((data) => {
          if (active && Array.isArray(data?.products))
            setSuggestions({ query, products: data.products })
        })
        .catch(() => {
          if (active) setSuggestions(undefined)
        })
    }, 200)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, searchOpen])

  return (
    <header className="site-header">
      <div className="announcement">
        Miễn phí vận chuyển cho đơn từ 500.000đ
      </div>
      <div className="header-main">
        <Link className="brand" to="/" aria-label="QuangHuy Sport - Trang chủ">
          <span>QUANGHUY</span>
          <strong>SPORT</strong>
        </Link>

        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {navigation.map((item) => (
            <NavLink key={item.href} to={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Tìm kiếm"
            onClick={() => setSearchOpen((value) => !value)}
          >
            <Search size={21} />
          </button>
          {user ? (
            <div className="header-account">
              <button
                type="button"
                className="account-trigger"
                onClick={() => setAccountMenuOpen((open) => !open)}
                aria-expanded={accountMenuOpen}
              >
                <span className="user-avatar">{user.name.charAt(0)}</span>
                <span className="account-name">{user.name}</span>
                <ChevronDown size={15} />
              </button>
              {accountMenuOpen && (
                <div className="account-dropdown">
                  <Link to="/account" onClick={() => setAccountMenuOpen(false)}>
                    Tài khoản của tôi
                  </Link>
                  <Link
                    to="/account/orders"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    Đơn hàng
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setAccountMenuOpen(false)
                    }}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="icon-button" to="/login" aria-label="Đăng nhập">
              <UserRound size={21} />
            </Link>
          )}
          <Link
            className="icon-button cart-button"
            to="/cart"
            aria-label={`Giỏ hàng, ${itemCount} sản phẩm`}
          >
            <ShoppingBag size={21} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>
          <button
            className="icon-button menu-button"
            type="button"
            aria-label="Mở menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={23} />
          </button>
        </div>
      </div>

      {searchOpen && (
        <form
          className="header-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            navigate(`/search?q=${encodeURIComponent(query.trim())}`)
            setSearchOpen(false)
          }}
        >
          <Search size={20} />
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            maxLength={100}
            type="search"
            placeholder="Tìm giày, áo, phụ kiện..."
            aria-label="Tìm kiếm sản phẩm"
          />
          <Button size="sm" type="submit">
            Tìm
          </Button>
        </form>
      )}
      {searchOpen &&
        suggestions?.query === query &&
        suggestions.products.length > 0 && (
          <ul className="header-search" aria-label="Gợi ý sản phẩm">
            {suggestions.products.map((product) => (
              <li key={product.id}>
                <Link
                  to={`/products/${product.slug}`}
                  onClick={() => setSearchOpen(false)}
                >
                  {product.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

      {drawerOpen && (
        <div
          className="drawer-backdrop"
          role="presentation"
          onMouseDown={() => setDrawerOpen(false)}
        >
          <aside
            className="mobile-drawer"
            aria-label="Menu di động"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <strong>MENU</strong>
              <button
                className="icon-button"
                type="button"
                aria-label="Đóng menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={21} />
              </button>
            </header>
            <nav>
              {navigation.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              {user ? (
                <>
                  <NavLink to="/account" onClick={() => setDrawerOpen(false)}>
                    Tài khoản của tôi
                  </NavLink>
                  <NavLink
                    to="/account/orders"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Đơn hàng
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      setDrawerOpen(false)
                    }}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <NavLink to="/login" onClick={() => setDrawerOpen(false)}>
                  Đăng nhập
                </NavLink>
              )}
            </nav>
          </aside>
        </div>
      )}
    </header>
  )
}
