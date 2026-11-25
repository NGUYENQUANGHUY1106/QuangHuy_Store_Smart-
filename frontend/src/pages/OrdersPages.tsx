import { Check, PackageCheck, Truck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mockApi, productImageUrl } from '../services/mockApi'
import { formatVnd } from '../utils/format'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'

type OrderLine = {
  id?: string
  productSlug?: string | null
  reviewed?: boolean
  sku: string
  name: string
  color: string
  size: string
  image: string
  lineSubtotal: number
  quantity: number
}

function OrderReviewLink({ item }: { item: OrderLine }) {
  if (!item.productSlug) return null
  const selection =
    !item.reviewed && item.id
      ? `?reviewItem=${encodeURIComponent(item.id)}`
      : ''
  return (
    <Link
      className="text-link"
      to={`/products/${item.productSlug}${selection}#reviews`}
    >
      {item.reviewed ? 'Xem đánh giá' : 'Đánh giá sản phẩm'}
    </Link>
  )
}
type OrderSummary = {
  id: string
  status: string
  statusLabel: string
  createdAt: string
  total: number
  items: OrderLine[]
}

export function OrdersPage() {
  const [apiOrders, setApiOrders] = useState<OrderSummary[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    let active = true
    mockApi
      .getOrders(page, status)
      .then((res) => {
        if (active) {
          setApiOrders(res.orders)
          setHasNext(res.hasNext)
        }
      })
      .catch(() => {
        if (active) setLoadError('Không thể tải đơn hàng.')
      })
    return () => {
      active = false
    }
  }, [page, status])

  function showPage(next: number) {
    setApiOrders(null)
    setLoadError('')
    setPage(next)
  }

  return (
    <section className="account-panel orders-panel">
      <div className="panel-heading">
        <h2>Đơn hàng của tôi</h2>
      </div>
      <div className="order-filters">
        {[
          ['all', 'Tất cả'],
          ['pending', 'Chờ xác nhận'],
          ['confirmed', 'Đã xác nhận'],
          ['shipping', 'Đang giao'],
          ['completed', 'Hoàn thành'],
          ['cancelled', 'Đã hủy'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={status === value ? 'active' : ''}
            onClick={() => {
              if (value !== status) {
                setStatus(value)
                showPage(1)
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {loadError ? (
        <p role="alert">{loadError}</p>
      ) : apiOrders === null ? (
        <p role="status">Đang tải đơn hàng…</p>
      ) : apiOrders.length === 0 ? (
        <div className="empty-state compact">
          <h3>Không có đơn hàng</h3>
          <p>Chọn trạng thái khác để xem đơn hàng.</p>
        </div>
      ) : (
        <div className="order-list">
          {apiOrders.map((order) => (
            <article className="order-card" key={order.id}>
              <header>
                <div>
                  <strong>{order.id}</strong>
                  <small>{order.createdAt}</small>
                </div>
                <span className={`order-status status-${order.status}`}>
                  {order.statusLabel}
                </span>
              </header>
              <div className="order-card-items">
                {order.items.map((item) => {
                  const { name, color, size } = item
                  return (
                    <div key={item.sku}>
                      <img src={item.image} alt={name} />
                      <div>
                        <strong>{name}</strong>
                        <small>
                          {color} / {size} × {item.quantity}
                        </small>
                        {order.status === 'completed' && (
                          <OrderReviewLink item={item} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <footer>
                <strong>Tổng: {formatVnd(order.total)}</strong>
                <Link to={`/account/orders/${order.id}`}>
                  <Button size="sm" variant="secondary" type="button">
                    Xem chi tiết
                  </Button>
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}
      {(page > 1 || hasNext) && (
        <div className="hero-actions">
          <Button
            type="button"
            disabled={page <= 1 || !apiOrders}
            onClick={() => showPage(page - 1)}
          >
            Trang trước
          </Button>
          <Button
            type="button"
            disabled={!hasNext || !apiOrders}
            onClick={() => showPage(page + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}
    </section>
  )
}

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [apiOrder, setApiOrder] = useState<any | null>(null)

  const [loadError, setLoadError] = useState('')
  const [cancelError, setCancelError] = useState('')

  useEffect(() => {
    if (!id) return
    let active = true
    setApiOrder(null)
    setLoadError('')
    setCancelError('')
    mockApi
      .getOrderDetail(id)
      .then((data) => {
        if (active) setApiOrder(data)
      })
      .catch((error) => {
        if (active)
          setLoadError(
            error instanceof Error ? error.message : 'Không thể tải đơn hàng.',
          )
      })
    return () => {
      active = false
    }
  }, [id])

  const order = apiOrder
    ? {
        id: apiOrder.number || apiOrder.id,
        orderId: apiOrder.id,
        version: apiOrder.version,
        history: (
          (apiOrder.status_history ?? []) as {
            to_status: string
            created_at: string
          }[]
        )
          .slice()
          .sort(
            (left, right) =>
              Date.parse(left.created_at) - Date.parse(right.created_at),
          ),
        status: apiOrder.status.toLowerCase(),
        statusLabel:
          apiOrder.status === 'PENDING'
            ? 'Chờ xác nhận'
            : apiOrder.status === 'CONFIRMED'
              ? 'Đã xác nhận'
              : apiOrder.status === 'SHIPPING'
                ? 'Đang giao'
                : apiOrder.status === 'COMPLETED'
                  ? 'Hoàn thành'
                  : 'Đã hủy',
        createdAt: apiOrder.created_at?.slice(0, 10) ?? '',
        total: Number(apiOrder.total),
        paymentMethod: apiOrder.payment_method?.toLowerCase() ?? 'cod',
        shippingAddress: apiOrder.address_snapshot
          ? `${apiOrder.address_snapshot.receiver || ''} - ${apiOrder.address_snapshot.phone || ''} - ${apiOrder.address_snapshot.street || ''}`
          : '',
        items: (apiOrder.items || []).map((it: any) => ({
          id: it.id,
          productId: it.variant,
          productSlug: it.product_slug,
          reviewed: it.reviewed,
          name: it.product_name_snapshot,
          image: productImageUrl(it.thumbnail),
          sku: it.sku_snapshot,
          size: it.size_snapshot,
          color: it.color_snapshot,
          quantity: it.qty,
          unitPrice: Number(it.unit_price),
          lineSubtotal: Number(it.line_subtotal),
        })),
      }
    : null

  if (!order)
    return (
      <section className="account-panel">
        <h2>{loadError || 'Đang tải đơn hàng…'}</h2>
        <Button type="button" onClick={() => navigate('/account/orders')}>
          Quay lại
        </Button>
      </section>
    )

  const steps = [
    { key: 'pending', label: 'Đặt hàng', icon: PackageCheck },
    { key: 'confirmed', label: 'Xác nhận', icon: Check },
    { key: 'shipping', label: 'Đang giao', icon: Truck },
    { key: 'delivered', label: 'Hoàn thành', icon: PackageCheck },
  ]
  const stepIndex =
    order.status === 'pending'
      ? 0
      : order.status === 'confirmed'
        ? 1
        : order.status === 'shipping'
          ? 2
          : order.status === 'delivered' || order.status === 'completed'
            ? 3
            : -1

  const handleConfirmCancel = async () => {
    if (cancelling) return
    setCancelling(true)
    setCancelError('')
    try {
      const updated = await mockApi.cancelOrder(
        order.id,
        'Khách hàng hủy đơn',
        order.version,
      )
      setApiOrder({ ...apiOrder, ...updated })
      setCancelOpen(false)
    } catch (error) {
      setCancelError(
        error instanceof Error ? error.message : 'Không thể hủy đơn.',
      )
    } finally {
      setCancelling(false)
    }
  }

  return (
    <section className="account-panel order-detail">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Chi tiết đơn hàng</p>
          <h2>{order.id}</h2>
        </div>
        <span className={`order-status status-${order.status}`}>
          {order.statusLabel}
        </span>
      </div>
      {order.status !== 'cancelled' ? (
        <div className="order-timeline">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                className={index <= stepIndex ? 'active' : ''}
                key={step.key}
              >
                <span>
                  <Icon size={18} />
                </span>
                <strong>{step.label}</strong>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="cancelled-banner">
          <X size={20} />
          Đơn hàng đã được hủy
        </div>
      )}
      {order.history.length > 0 && (
        <section aria-label="Lịch sử đơn hàng">
          <h3>Lịch sử đơn hàng</h3>
          <ol>
            {order.history.map((event) => (
              <li key={`${event.created_at}-${event.to_status}`}>
                {steps.find(
                  (step) =>
                    step.key ===
                    (event.to_status === 'COMPLETED'
                      ? 'delivered'
                      : event.to_status.toLowerCase()),
                )?.label ??
                  (event.to_status === 'CANCELLED'
                    ? 'Đã hủy'
                    : event.to_status)}
                {' · '}
                <time dateTime={event.created_at}>
                  {new Date(event.created_at).toLocaleString('vi-VN', {
                    timeZone: 'Asia/Saigon',
                  })}
                </time>
              </li>
            ))}
          </ol>
        </section>
      )}
      <div className="order-detail-items">
        {order.items.map((item: OrderLine) => {
          const { name, color, size, lineSubtotal: price } = item
          return (
            <article key={item.sku}>
              <img src={item.image} alt={name} />
              <div>
                <strong>{name}</strong>
                <small>
                  {color} / {size} × {item.quantity}
                </small>
                {order.status === 'completed' && (
                  <OrderReviewLink item={item} />
                )}
              </div>
              <strong>{formatVnd(price)}</strong>
            </article>
          )
        })}
      </div>
      <dl className="order-detail-summary">
        <div>
          <dt>Phương thức thanh toán</dt>
          <dd>
            {order.paymentMethod === 'cod'
              ? 'COD (Thanh toán khi nhận hàng)'
              : order.paymentMethod === 'bank_transfer' ||
                  order.paymentMethod === 'bank'
                ? 'Chuyển khoản'
                : 'VNPay Sandbox'}
          </dd>
        </div>
        <div>
          <dt>Địa chỉ giao hàng</dt>
          <dd>{order.shippingAddress ?? 'Địa chỉ mẫu'}</dd>
        </div>
        <div className="summary-total">
          <dt>Tổng cộng</dt>
          <dd>{formatVnd(order.total)}</dd>
        </div>
      </dl>
      <div className="order-actions">
        {order.status === 'pending' && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => setCancelOpen(true)}
          >
            Hủy đơn
          </Button>
        )}
        {(order.status === 'delivered' || order.status === 'completed') && (
          <>
            <Button type="button" onClick={() => navigate('/search')}>
              Mua lại
            </Button>
          </>
        )}
      </div>
      <Modal
        open={cancelOpen}
        title="Xác nhận hủy đơn"
        onClose={() => setCancelOpen(false)}
      >
        <p>Bạn có chắc muốn hủy đơn {order.id}?</p>
        <p>Hệ thống sẽ hoàn lại số lượng đã trừ vào kho.</p>
        {cancelError && <p role="alert">{cancelError}</p>}
        <div className="modal-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={() => setCancelOpen(false)}
          >
            Không
          </Button>
          <Button
            type="button"
            disabled={cancelling}
            onClick={handleConfirmCancel}
          >
            {cancelling ? 'Đang hủy...' : 'Hủy đơn'}
          </Button>
        </div>
      </Modal>
    </section>
  )
}
