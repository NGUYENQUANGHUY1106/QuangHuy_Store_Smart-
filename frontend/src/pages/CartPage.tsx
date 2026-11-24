import { Minus, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mockApi } from '../services/mockApi'
import { useCart } from '../context/CartContext'
import { formatVnd } from '../utils/format'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'

export function CartPage() {
  const { items, updateQuantity, removeItem, busy, error, getItemDetails } =
    useCart()
  const navigate = useNavigate()
  const [voucherCode, setVoucherCode] = useState('')
  const [voucher, setVoucher] = useState<{
    code: string
    discount: number
    basket: string
  }>()
  const [voucherMessage, setVoucherMessage] = useState('')
  const [applying, setApplying] = useState(false)

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const details = getItemDetails(item)
        return sum + (details?.product.salePrice ?? 0) * item.quantity
      }, 0),
    [items, getItemDetails],
  )

  // DEC-009: Miễn phí ship từ 500.000đ, tiêu chuẩn 30.000đ
  const shipping = subtotal >= 500000 ? 0 : 30000

  const basket = JSON.stringify(
    items.map((item) => [item.sku, item.quantity, item.product.salePrice]),
  )
  const activeVoucher = voucher?.basket === basket ? voucher : undefined
  const discountAmount = activeVoucher?.discount ?? 0

  const applyVoucher = async () => {
    if (applying || busy) return
    const code = voucherCode.trim().toUpperCase()
    if (!code) {
      setVoucherMessage('Vui lòng nhập mã voucher.')
      return
    }
    setApplying(true)
    setVoucherMessage('')
    try {
      const res = await mockApi.validateVoucher(code)
      const discount = Number(res?.discount)
      if (res?.eligible && Number.isFinite(discount) && discount >= 0) {
        setVoucher({ code, discount, basket })
      } else {
        setVoucher(undefined)
        setVoucherMessage(res?.error?.message || 'Mã voucher không hợp lệ.')
      }
    } catch (err) {
      setVoucher(undefined)
      setVoucherMessage(
        err instanceof Error
          ? err.message
          : 'Voucher không hợp lệ hoặc đã hết hạn.',
      )
    } finally {
      setApplying(false)
    }
  }

  if (busy && !items.length) return <p role="status">Đang tải giỏ hàng…</p>
  if (error && !items.length) return <p role="alert">{error}</p>

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <Breadcrumb
          items={[{ label: 'Trang chủ', href: '/' }, { label: 'Giỏ hàng' }]}
        />
        <section className="empty-state cart-empty">
          <h1>Giỏ hàng trống</h1>
          <p>Hãy chọn thêm sản phẩm thể thao yêu thích.</p>
          <Link to="/search">
            <Button>Tiếp tục mua sắm</Button>
          </Link>
        </section>
      </div>
    )
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + shipping)

  return (
    <div className="cart-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Giỏ hàng' }]}
      />
      <h1>Giỏ hàng</h1>
      {error && <p role="alert">{error}</p>}
      <div className="cart-layout">
        <section className="cart-items">
          {items.map((item) => {
            const details = getItemDetails(item)
            if (!details) return null
            const { product, variant } = details
            return (
              <article className="cart-item" key={item.sku}>
                <img src={product.image} alt={product.name} />
                <div className="cart-item-info">
                  <p className="product-card-brand">{product.brand}</p>
                  <h2>{product.name}</h2>
                  <p>
                    Màu: {variant.color} · Size: {variant.size}
                  </p>
                  {item.available ? (
                    <strong>{formatVnd(product.salePrice)}</strong>
                  ) : (
                    <p>Sản phẩm không còn đủ tồn kho hoặc đã ngừng bán.</p>
                  )}
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button
                      type="button"
                      disabled={busy || item.quantity <= 1}
                      onClick={() =>
                        void updateQuantity(item.sku, item.quantity - 1).catch(
                          () => {},
                        )
                      }
                      aria-label="Giảm số lượng"
                    >
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      disabled={busy || item.quantity >= variant.stock}
                      onClick={() =>
                        void updateQuantity(item.sku, item.quantity + 1).catch(
                          () => {},
                        )
                      }
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    className="remove-button"
                    type="button"
                    disabled={busy}
                    onClick={() => void removeItem(item.sku).catch(() => {})}
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </div>
              </article>
            )
          })}
        </section>

        <aside className="order-summary">
          <h2>Tóm tắt đơn hàng</h2>
          <form
            className="voucher-entry"
            onSubmit={(event) => {
              event.preventDefault()
              void applyVoucher()
            }}
          >
            <label htmlFor="cart-voucher">Mã giảm giá</label>
            <div className="voucher-form">
              <input
                id="cart-voucher"
                value={voucherCode}
                onChange={(event) => setVoucherCode(event.target.value)}
                placeholder="Nhập mã voucher"
              />
              <Button type="submit" size="sm" disabled={applying || busy}>
                {applying ? 'Đang kiểm tra…' : 'Áp dụng'}
              </Button>
            </div>
            {activeVoucher && (
              <div className="voucher-applied">
                <span role="status">
                  Đã áp dụng <strong>{activeVoucher.code}</strong>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setVoucher(undefined)
                    setVoucherCode('')
                    setVoucherMessage('')
                  }}
                >
                  Bỏ mã
                </Button>
              </div>
            )}
            {(voucherMessage || (voucher && !activeVoucher)) && (
              <p className="variant-message" role="status">
                {voucherMessage || 'Giỏ hàng đã thay đổi. Hãy áp dụng lại mã.'}
              </p>
            )}
          </form>
          <dl>
            <div>
              <dt>Tạm tính</dt>
              <dd>{formatVnd(subtotal)}</dd>
            </div>
            <div>
              <dt>Giảm giá</dt>
              <dd>
                {discountAmount > 0 ? `-${formatVnd(discountAmount)}` : '0 ₫'}
              </dd>
            </div>
            <div>
              <dt>Vận chuyển</dt>
              <dd>{shipping === 0 ? 'Miễn phí' : formatVnd(shipping)}</dd>
            </div>
            <div className="summary-total">
              <dt>Tổng cộng</dt>
              <dd>{formatVnd(finalTotal)}</dd>
            </div>
          </dl>
          <Button
            size="lg"
            type="button"
            disabled={busy || items.some((item) => !item.available)}
            onClick={() =>
              navigate('/checkout', {
                state: { voucherCode: activeVoucher?.code ?? '' },
              })
            }
          >
            Tiến hành thanh toán
          </Button>
          <Link className="text-link continue-link" to="/search">
            Tiếp tục mua sắm
          </Link>
        </aside>
      </div>
    </div>
  )
}
