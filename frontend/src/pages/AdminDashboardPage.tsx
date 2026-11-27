import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  Boxes,
  CircleCheck,
  Clock3,
  Package,
  Receipt,
  Truck,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { mockApi } from '../services/mockApi'
import { formatVnd } from '../utils/format'
import './adminDashboard.css'

const statuses = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
} as const
type OrderStatus = keyof typeof statuses
type Daily = {
  date: string
  revenue_delivered: string
  orders_created: number
  orders_completed: number
}
type Metrics = {
  date: string
  start_date: string
  revenue_delivered: string
  cod_collected: string | null
  series: Daily[]
  orders: Record<OrderStatus | 'total', number>
  inventory: {
    low_stock_count: number
    out_of_stock_count: number
    watch: {
      variant__sku: string
      variant__product__name: string
      variant__color: string
      variant__size: string
      stock_qty: number
    }[]
  }
  catalog: {
    published: number
    draft: number
    archived: number
    active_customers: number
  }
  top_skus: {
    sku_snapshot: string
    name: string
    color: string
    size: string
    quantity: number
  }[]
  recent_orders: {
    id: string
    number: string
    created_at: string
    status: Uppercase<OrderStatus>
    total: string
  }[]
}

const count = new Intl.NumberFormat('vi-VN')
const orderTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: 'Asia/Ho_Chi_Minh',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const dayLabel = (day: string) => day.split('-').slice(1).reverse().join('/')
const money = (amount: string) => formatVnd(Number(amount))

function DashboardChart({ data }: { data: Daily[] }) {
  const [measure, setMeasure] = useState<'value' | 'orders'>('value')
  const [selected, setSelected] = useState<string>()
  const active = data.find((row) => row.date === selected) ?? data.at(-1)
  const valueMode = measure === 'value'
  const peak = Math.max(
    1,
    ...data.map((row) =>
      valueMode
        ? Number(row.revenue_delivered)
        : Math.max(row.orders_created, row.orders_completed),
    ),
  )

  return (
    <section
      className="admin-panel dashboard-chart"
      aria-labelledby="dashboard-chart-title"
    >
      <div className="dashboard-section-heading">
        <h2 id="dashboard-chart-title">Xu hướng theo ngày</h2>
        <div
          className="dashboard-segment"
          role="group"
          aria-label="Chỉ số biểu đồ"
        >
          <button
            type="button"
            aria-pressed={valueMode}
            onClick={() => setMeasure('value')}
          >
            Giá trị hàng
          </button>
          <button
            type="button"
            aria-pressed={!valueMode}
            onClick={() => setMeasure('orders')}
          >
            Đơn hàng
          </button>
        </div>
      </div>
      <p className="dashboard-muted">Ngày theo giờ Việt Nam</p>
      <div className="dashboard-chart-scroll">
        <div
          className="dashboard-bars"
          style={{
            gridTemplateColumns: `repeat(${data.length}, minmax(2.1rem, 1fr))`,
          }}
          role="group"
          aria-label={
            valueMode
              ? 'Giá trị hàng đã giao sau giảm theo ngày'
              : 'Số đơn tạo và hoàn thành theo ngày'
          }
        >
          {data.map((row, index) => {
            const amounts = valueMode
              ? [Number(row.revenue_delivered)]
              : [row.orders_created, row.orders_completed]
            const description = valueMode
              ? money(row.revenue_delivered)
              : `${row.orders_created} đơn mới, ${row.orders_completed} hoàn thành`
            return (
              <button
                key={`${measure}-${row.date}`}
                type="button"
                className="dashboard-bar-button"
                aria-label={`${dayLabel(row.date)}, ${description}`}
                aria-pressed={active?.date === row.date}
                onFocus={() => setSelected(row.date)}
                onClick={() => setSelected(row.date)}
              >
                <span className="dashboard-bar-slot" aria-hidden="true">
                  {amounts.map((amount, bar) => (
                    <span
                      key={bar}
                      className={`dashboard-bar dashboard-bar-${bar}`}
                      style={{
                        height: amount
                          ? `${Math.max(2, (amount / peak) * 100)}%`
                          : '2px',
                        animationDelay: `${Math.min(index, 10) * 18}ms`,
                      }}
                    />
                  ))}
                </span>
                <span aria-hidden="true">{dayLabel(row.date)}</span>
              </button>
            )
          })}
        </div>
      </div>
      {active && (
        <div className="dashboard-chart-readout" aria-live="polite">
          <strong>{dayLabel(active.date)}</strong>
          {valueMode ? (
            <span>
              Giá trị hàng đã giao sau giảm{' '}
              <b>{money(active.revenue_delivered)}</b>
            </span>
          ) : (
            <>
              <span>
                <i className="dashboard-dot" /> Đơn mới{' '}
                <b>{count.format(active.orders_created)}</b>
              </span>
              <span>
                <i className="dashboard-dot dashboard-dot-completed" /> Hoàn
                thành <b>{count.format(active.orders_completed)}</b>
              </span>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export function AdminDashboardPage() {
  const [date, setDate] = useState('')
  const [days, setDays] = useState(7)
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState<{ key: string; data: Metrics }>()
  const [failedKey, setFailedKey] = useState('')
  const key = `${date}/${days}/${retry}`
  const metrics = result?.key === key ? result.data : undefined

  useEffect(() => {
    let active = true
    mockApi
      .getDashboardMetrics(date, days)
      .then((data: Metrics) => {
        if (active) setResult({ key, data })
      })
      .catch(() => {
        if (active) setFailedKey(key)
      })
    return () => {
      active = false
    }
  }, [date, days, key])

  const created =
    metrics?.series.reduce((sum, row) => sum + row.orders_created, 0) ?? 0
  const completed =
    metrics?.series.reduce((sum, row) => sum + row.orders_completed, 0) ?? 0

  return (
    <div className="admin-page dashboard-page">
      <header className="admin-page-header dashboard-heading">
        <div>
          <h1>Tổng quan cửa hàng</h1>
          <p className="dashboard-muted">Đơn hàng, danh mục và tồn kho</p>
        </div>
        <div className="dashboard-controls">
          <label>
            Khoảng báo cáo
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              <option value={1}>1 ngày</option>
              <option value={7}>7 ngày</option>
              <option value={14}>14 ngày</option>
              <option value={30}>30 ngày</option>
            </select>
          </label>
          <label>
            Ngày kết thúc
            <input
              type="date"
              value={date || result?.data.date || ''}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>
      </header>
      {failedKey === key ? (
        <div className="admin-panel">
          <p role="alert">Không thể tải báo cáo.</p>
          <button
            type="button"
            className="button button-secondary button-sm"
            onClick={() => setRetry(retry + 1)}
          >
            Tải lại
          </button>
        </div>
      ) : !metrics ? (
        <div className="admin-panel dashboard-loading" role="status">
          Đang tải báo cáo…
        </div>
      ) : (
        <div className="dashboard-content">
          <p className="dashboard-period">
            {metrics.start_date === metrics.date
              ? dayLabel(metrics.date)
              : `${dayLabel(metrics.start_date)} – ${dayLabel(metrics.date)}`}{' '}
            · Giờ Việt Nam
          </p>
          <div className="dashboard-kpis">
            <article className="admin-panel dashboard-kpi dashboard-kpi-primary">
              <Receipt aria-hidden="true" />
              <p>Giá trị hàng đã giao sau giảm</p>
              <strong>{money(metrics.revenue_delivered)}</strong>
              <small>
                COD đã thu ·{' '}
                {metrics.cod_collected === null
                  ? 'Chưa theo dõi'
                  : money(metrics.cod_collected)}
              </small>
            </article>
            <article className="admin-panel dashboard-kpi">
              <Package aria-hidden="true" />
              <p>Đơn mới trong kỳ</p>
              <strong>{count.format(created)}</strong>
              <Link to="/admin/orders">
                Xem đơn hàng <ArrowUpRight size={14} />
              </Link>
            </article>
            <article className="admin-panel dashboard-kpi">
              <CircleCheck aria-hidden="true" />
              <p>Hoàn thành trong kỳ</p>
              <strong>{count.format(completed)}</strong>
              <small>Tính theo ngày hoàn tất</small>
            </article>
            <article className="admin-panel dashboard-kpi">
              <Clock3 aria-hidden="true" />
              <p>Đơn đang chờ xác nhận</p>
              <strong>{count.format(metrics.orders.pending)}</strong>
              <small>Trạng thái hiện tại</small>
            </article>
          </div>
          <div className="dashboard-layout">
            <DashboardChart data={metrics.series} />
            <section className="admin-panel dashboard-status">
              <div className="dashboard-section-heading">
                <h2>Trạng thái đơn hàng</h2>
                <Truck size={20} aria-hidden="true" />
              </div>
              <p className="dashboard-muted">
                {count.format(metrics.orders.total)} đơn · toàn bộ cửa hàng
              </p>
              <dl>
                {(Object.keys(statuses) as OrderStatus[]).map((status) => (
                  <div key={status}>
                    <dt>{statuses[status]}</dt>
                    <dd>{count.format(metrics.orders[status])}</dd>
                    <span aria-hidden="true" className="dashboard-meter">
                      <span
                        data-status={status}
                        style={{
                          width: `${(metrics.orders[status] / Math.max(1, metrics.orders.total)) * 100}%`,
                        }}
                      />
                    </span>
                  </div>
                ))}
              </dl>
            </section>
          </div>
          <div className="dashboard-layout">
            <section className="admin-panel dashboard-list">
              <div className="dashboard-section-heading">
                <h2>Đơn hàng mới nhất trong kỳ</h2>
                <Link to="/admin/orders">
                  Tất cả đơn <ArrowUpRight size={15} />
                </Link>
              </div>
              {metrics.recent_orders.length ? (
                <ul>
                  {metrics.recent_orders.map((order) => (
                    <li key={order.id}>
                      <div>
                        <Link to={`/admin/orders/${order.id}`}>
                          {order.number}
                        </Link>
                        <small>
                          {orderTime.format(new Date(order.created_at))} ·{' '}
                          {statuses[
                            order.status.toLowerCase() as OrderStatus
                          ] ?? order.status}
                        </small>
                      </div>
                      <strong>{money(order.total)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dashboard-muted">Chưa có đơn mới trong kỳ này.</p>
              )}
            </section>
            <section className="admin-panel dashboard-list">
              <div className="dashboard-section-heading">
                <h2>Top SKU đã giao</h2>
              </div>
              {metrics.top_skus.length ? (
                <ol>
                  {metrics.top_skus.map((row) => (
                    <li key={row.sku_snapshot}>
                      <div>
                        <strong>{row.name}</strong>
                        <small>
                          {row.color} · Size {row.size} · {row.sku_snapshot}
                        </small>
                      </div>
                      <strong>{count.format(row.quantity)} món</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="dashboard-muted">
                  Chưa có SKU đã giao trong kỳ này.
                </p>
              )}
            </section>
          </div>
          <div className="dashboard-layout">
            <section className="admin-panel dashboard-list">
              <div className="dashboard-section-heading">
                <h2>Cảnh báo tồn kho</h2>
                <Link to="/admin/inventory">
                  Mở kho <ArrowUpRight size={15} />
                </Link>
              </div>
              <p className="dashboard-muted">
                {count.format(metrics.inventory.out_of_stock_count)} SKU hết
                hàng · {count.format(metrics.inventory.low_stock_count)} SKU còn
                1–5 sản phẩm
              </p>
              {metrics.inventory.watch.length ? (
                <ul>
                  {metrics.inventory.watch.map((row) => (
                    <li key={row.variant__sku}>
                      <div>
                        <strong>{row.variant__product__name}</strong>
                        <small>
                          {row.variant__color} · Size {row.variant__size} ·{' '}
                          {row.variant__sku}
                        </small>
                      </div>
                      <strong
                        className={row.stock_qty ? '' : 'dashboard-stock-empty'}
                      >
                        {row.stock_qty ? `Còn ${row.stock_qty}` : 'Hết hàng'}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="dashboard-muted">Chưa có SKU cần chú ý.</p>
              )}
            </section>
            <section className="admin-panel dashboard-list dashboard-catalog">
              <div className="dashboard-section-heading">
                <h2>Danh mục và khách hàng</h2>
                <Boxes size={20} aria-hidden="true" />
              </div>
              <ul>
                <li>
                  <Link to="/admin/products">Sản phẩm đang bán</Link>
                  <strong>{count.format(metrics.catalog.published)}</strong>
                </li>
                <li>
                  <span>Bản nháp</span>
                  <strong>{count.format(metrics.catalog.draft)}</strong>
                </li>
                <li>
                  <span>Đã ngừng bán</span>
                  <strong>{count.format(metrics.catalog.archived)}</strong>
                </li>
                <li>
                  <Link to="/admin/users">
                    <Users size={16} /> Khách hàng đang hoạt động
                  </Link>
                  <strong>
                    {count.format(metrics.catalog.active_customers)}
                  </strong>
                </li>
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
