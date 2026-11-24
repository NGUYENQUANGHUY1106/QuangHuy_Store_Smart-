import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { mockApi } from '../services/mockApi'
import { formatVnd } from '../utils/format'

export function OrderSuccessPage() {
  const [params] = useSearchParams()
  const id = params.get('order')
  const [result, setResult] = useState<{
    id: string
    number?: string
    total?: number
  }>()

  useEffect(() => {
    if (!id) return
    let active = true
    mockApi
      .getOrderDetail(id)
      .then((order) => {
        if (!active) return
        const total = Number(order?.total)
        setResult(
          typeof order?.number === 'string' && Number.isFinite(total)
            ? { id, number: order.number, total }
            : { id },
        )
      })
      .catch(() => {
        if (active) setResult({ id })
      })
    return () => {
      active = false
    }
  }, [id])

  if (!id || (result?.id === id && !result.number)) {
    return (
      <section className="order-success-page">
        <p role="alert">Không thể xác nhận đơn hàng.</p>
        <Link to="/account/orders">Xem đơn hàng của tôi</Link>
      </section>
    )
  }
  if (result?.id !== id) return <p role="status">Đang xác nhận đơn hàng…</p>

  return (
    <section className="order-success-page">
      <div className="success-icon">
        <Check size={42} />
      </div>
      <p className="eyebrow">Đặt hàng thành công</p>
      <h1>Cảm ơn bạn đã mua sắm</h1>
      <p>
        Mã đơn hàng: <strong data-testid="order-number">{result.number}</strong>
      </p>
      <p>Tổng đơn hàng {formatVnd(result.total ?? 0)}</p>
      <div className="hero-actions">
        <Link to="/account/orders">
          <Button>Xem đơn hàng</Button>
        </Link>
        <Link to="/search">
          <Button variant="secondary">Tiếp tục mua sắm</Button>
        </Link>
      </div>
    </section>
  )
}
