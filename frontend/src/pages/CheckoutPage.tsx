import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { formatVnd } from '../utils/format'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'
import { mockApi } from '../services/mockApi'

export function CheckoutPage() {
  const { items, clearCart, busy, error: cartError, getItemDetails } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const passedVoucher =
    typeof location.state?.voucherCode === 'string'
      ? location.state.voucherCode
      : ''
  const [pricing, setPricing] = useState<{
    subtotal: number
    discount: number
    shipping: number
    total: number
    token: string
  }>()
  const [quoteError, setQuoteError] = useState('')
  const [refreshQuote, setRefreshQuote] = useState(0)
  const userId = user?.id

  useEffect(() => {
    if (!userId || items.length === 0) return
    let active = true
    setPricing(undefined)
    setQuoteError('')
    mockApi
      .quoteCheckout(passedVoucher)
      .then((response) => {
        if (!active) return
        const { subtotal, discount, shipping, total, quote_token } = response
        const amounts = [subtotal, discount, shipping, total].map(Number)
        if (
          typeof quote_token !== 'string' ||
          !amounts.every((amount) => Number.isFinite(amount) && amount >= 0)
        ) {
          throw new Error('Báo giá không hợp lệ.')
        }
        setPricing({
          subtotal: amounts[0],
          discount: amounts[1],
          shipping: amounts[2],
          total: amounts[3],
          token: quote_token,
        })
      })
      .catch((failure) => {
        if (active)
          setQuoteError(
            failure instanceof Error
              ? failure.message
              : 'Không thể tải báo giá.',
          )
      })
    return () => {
      active = false
    }
  }, [userId, items, passedVoucher, refreshQuote])

  const [payment, setPayment] = useState<
    'COD' | 'BANK_TRANSFER' | 'VNPAY_SANDBOX'
  >('COD')
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [nameInput, setName] = useState<string | null>(null)
  const [phoneInput, setPhone] = useState<string | null>(null)
  const [emailInput, setEmail] = useState<string | null>(null)
  const [addressInput, setAddress] = useState<string | null>(null)
  const [city, setCity] = useState('TP. Hồ Chí Minh')
  const [district, setDistrict] = useState('Quận 1')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const intent = useRef({ body: '', key: '' })
  const inFlight = useRef(false)

  const savedAddress =
    user?.addresses.find((entry) => entry.id === selectedAddressId) ??
    user?.addresses.find((entry) => entry.isDefault) ??
    user?.addresses[0]
  const name = nameInput ?? savedAddress?.receiver ?? user?.name ?? ''
  const phone = phoneInput ?? savedAddress?.phone ?? user?.phone ?? ''
  const email = emailInput ?? user?.email ?? ''
  const address = addressInput ?? savedAddress?.address ?? ''

  const handleSelectAddress = (addrId: string) => {
    setSelectedAddressId(addrId)
    setName(null)
    setPhone(null)
    setAddress(null)
  }

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inFlight.current || !pricing) return
    inFlight.current = true
    setSubmitting(true)
    setErrorMessage('')

    const addressSnapshot = {
      receiver: name,
      phone,
      email,
      street: address,
      area: { city, district },
    }

    const payload = {
      payment_method: payment,
      quote_token: pricing.token,
      address_snapshot: addressSnapshot,
      ...(passedVoucher ? { voucher_code: passedVoucher } : {}),
    }

    try {
      const body = JSON.stringify(payload)
      if (intent.current.body !== body)
        intent.current = { body, key: crypto.randomUUID() }
      const res = await mockApi.checkout(payload, intent.current.key)
      if (typeof res?.id === 'string' && typeof res.number === 'string') {
        clearCart()
        navigate(`/order-success?order=${encodeURIComponent(res.id)}`)
        return
      }
      setErrorMessage(res?.error?.message || 'Không thể tạo đơn hàng.')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Lỗi trong quá trình thanh toán.'
      setErrorMessage(msg)
    } finally {
      inFlight.current = false
      setSubmitting(false)
    }
  }

  if (!user && items.length > 0) {
    return (
      <section className="empty-state">
        <h1>Đăng nhập để thanh toán</h1>
        <Link to="/login">Đăng nhập</Link>
      </section>
    )
  }
  if (busy && !items.length) return <p role="status">Đang tải giỏ hàng…</p>
  if (cartError && !items.length) return <p role="alert">{cartError}</p>

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <Breadcrumb
          items={[{ label: 'Trang chủ', href: '/' }, { label: 'Thanh toán' }]}
        />
        <section className="empty-state">
          <h1>Không có sản phẩm để thanh toán</h1>
          <Button type="button" onClick={() => navigate('/search')}>
            Chọn sản phẩm
          </Button>
        </section>
      </div>
    )
  }

  return (
    <div className="checkout-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: 'Giỏ hàng', href: '/cart' },
          { label: 'Thanh toán' },
        ]}
      />
      <h1>Thanh toán</h1>
      <form className="checkout-layout" onSubmit={submitOrder}>
        <div className="checkout-form">
          {errorMessage && (
            <div
              className="form-error full-field"
              role="alert"
              style={{ marginBottom: '1rem' }}
            >
              <strong>Lỗi thanh toán:</strong> {errorMessage}
            </div>
          )}

          {user && user.addresses.length > 0 && (
            <section className="checkout-section">
              <h2>Chọn từ sổ địa chỉ đã lưu</h2>
              <div
                className="saved-address-options"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                {user.addresses.map((addr) => (
                  <label
                    key={addr.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="saved_address"
                      checked={savedAddress?.id === addr.id}
                      onChange={() => handleSelectAddress(addr.id)}
                    />
                    <span>
                      <strong>{addr.receiver}</strong> ({addr.phone}) -{' '}
                      {addr.address} {addr.isDefault ? '(Mặc định)' : ''}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="checkout-section">
            <h2>Thông tin người nhận</h2>
            <div className="form-grid">
              <label>
                Họ và tên
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </label>
              <label>
                Số điện thoại
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  placeholder="0900000000"
                />
              </label>
              <label className="full-field">
                Email
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="email@example.com"
                />
              </label>
              <label className="full-field">
                Địa chỉ nhận hàng
                <input
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, tên đường"
                />
              </label>
              <label>
                Tỉnh / Thành phố
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="TP. Hồ Chí Minh"
                />
              </label>
              <label>
                Quận / Huyện
                <input
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Quận 1"
                />
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <h2>Phương thức vận chuyển</h2>
            <div className="option-list">
              <label>
                <input type="radio" name="shipping" checked readOnly />
                <span>
                  <strong>Giao hàng tiêu chuẩn toàn quốc</strong>
                  <small>
                    {pricing &&
                      (pricing.shipping === 0
                        ? 'Miễn phí'
                        : formatVnd(pricing.shipping))}
                  </small>
                </span>
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <h2>Phương thức thanh toán</h2>
            <div className="option-list">
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === 'COD'}
                  onChange={() => setPayment('COD')}
                />
                <span>
                  <strong>Thanh toán khi nhận hàng (COD)</strong>
                  <small>Thanh toán bằng tiền mặt khi giao hàng tận nơi</small>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === 'BANK_TRANSFER'}
                  onChange={() => setPayment('BANK_TRANSFER')}
                />
                <span>
                  <strong>Chuyển khoản ngân hàng</strong>
                  <small>Xác nhận mô phỏng, không thực hiện chuyển khoản</small>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  checked={payment === 'VNPAY_SANDBOX'}
                  onChange={() => setPayment('VNPAY_SANDBOX')}
                />
                <span>
                  <strong>VNPay Sandbox</strong>
                  <small>Cổng thanh toán VNPay Sandbox (mô phỏng)</small>
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="order-summary checkout-summary">
          <h2>Đơn hàng</h2>
          {items.map((item) => {
            const details = getItemDetails(item)
            if (!details) return null
            return (
              <div className="checkout-item" key={item.sku}>
                <img src={details.product.image} alt={details.product.name} />
                <div>
                  <strong>{details.product.name}</strong>
                  <small>
                    {details.variant.color} / {details.variant.size} ×{' '}
                    {item.quantity}
                  </small>
                </div>
              </div>
            )
          })}
          {quoteError ? (
            <p role="alert">{quoteError}</p>
          ) : !pricing ? (
            <p role="status">Đang tải báo giá…</p>
          ) : (
            <dl>
              <div>
                <dt>Tạm tính</dt>
                <dd>{formatVnd(pricing.subtotal)}</dd>
              </div>
              {pricing.discount > 0 && (
                <div>
                  <dt>Giảm giá{passedVoucher ? ` · ${passedVoucher}` : ''}</dt>
                  <dd>-{formatVnd(pricing.discount)}</dd>
                </div>
              )}
              <div>
                <dt>Vận chuyển</dt>
                <dd>
                  {pricing.shipping === 0
                    ? 'Miễn phí'
                    : formatVnd(pricing.shipping)}
                </dd>
              </div>
              <div className="summary-total">
                <dt>Tổng cộng</dt>
                <dd>{formatVnd(pricing.total)}</dd>
              </div>
            </dl>
          )}
          {(quoteError || errorMessage) && (
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => {
                setErrorMessage('')
                setRefreshQuote(refreshQuote + 1)
              }}
            >
              Tải lại báo giá
            </Button>
          )}

          <Button
            size="lg"
            type="submit"
            disabled={submitting || !pricing || busy}
          >
            {submitting ? 'Đang tạo đơn hàng...' : 'Đặt hàng ngay'}
          </Button>
        </aside>
      </form>
    </div>
  )
}
