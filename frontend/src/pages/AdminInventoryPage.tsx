import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { mockApi } from '../services/mockApi'

type Balance = {
  variant_id: string
  sku: string
  product_name: string
  stock_qty: number
}
type Movement = {
  id: string
  sku: string
  delta: number
  before_qty: number
  after_qty: number
  reason: string
  actor_id: string | null
}

export function AdminInventoryPage({ history }: { history: boolean }) {
  const [rows, setRows] = useState<Balance[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [variant, setVariant] = useState('')
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const intent = useRef({ payload: '', key: '' })

  useEffect(() => {
    let active = true
    const request = history
      ? mockApi.getInventoryMovements()
      : mockApi.getInventoryBalances()
    request
      .then((data) => {
        if (!active) return
        if (!Array.isArray(data?.results))
          throw new Error('Dữ liệu kho không hợp lệ.')
        if (history) setMovements(data.results)
        else setRows(data.results)
      })
      .catch(() => {
        if (active) setError('Không thể tải dữ liệu kho.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [history])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setStatus('')
    setError('')
    if (
      !Number.isSafeInteger(Number(delta)) ||
      Number(delta) === 0 ||
      !reason.trim()
    ) {
      setError('Nhập số nguyên khác 0 và lý do điều chỉnh.')
      return
    }
    const payload = {
      variant_id: variant,
      delta: Number(delta),
      reason: reason.trim(),
    }
    const serialized = JSON.stringify(payload)
    if (intent.current.payload !== serialized) {
      intent.current = { payload: serialized, key: crypto.randomUUID() }
    }
    setBusy(true)
    try {
      await mockApi.adjustInventory({
        ...payload,
        operation_key: intent.current.key,
      })
      intent.current = { payload: '', key: '' }
      setStatus('Đã ghi nhận điều chỉnh kho.')
      setDelta('')
      setReason('')
      const data = await mockApi.getInventoryBalances()
      if (Array.isArray(data?.results)) setRows(data.results)
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Không thể điều chỉnh kho.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>{history ? 'Lịch sử kho' : 'Điều chỉnh kho'}</h1>
        <Link to={history ? '/admin/inventory' : '/admin/inventory/history'}>
          {history ? 'Điều chỉnh kho' : 'Lịch sử kho'}
        </Link>
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {status && <p role="status">{status}</p>}
      {loading ? (
        <p role="status">Đang tải dữ liệu kho…</p>
      ) : history ? (
        <section className="admin-panel admin-table-wrap">
          {movements.length === 0 ? (
            <p>Chưa có biến động kho.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Thay đổi</th>
                  <th>Trước</th>
                  <th>Sau</th>
                  <th>Lý do</th>
                  <th>Người thao tác</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((row) => (
                  <tr key={row.id}>
                    <td>{row.sku}</td>
                    <td>{row.delta}</td>
                    <td>{row.before_qty}</td>
                    <td>{row.after_qty}</td>
                    <td>{row.reason}</td>
                    <td>{row.actor_id ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : (
        <form className="admin-panel admin-form-grid" onSubmit={submit}>
          <label>
            SKU
            <select
              required
              value={variant}
              onChange={(event) => setVariant(event.target.value)}
            >
              <option value="">Chọn SKU</option>
              {rows.map((row) => (
                <option key={row.variant_id} value={row.variant_id}>
                  {row.sku} · {row.product_name} · Tồn {row.stock_qty}
                </option>
              ))}
            </select>
          </label>
          <label>
            Số lượng điều chỉnh
            <input
              type="number"
              required
              step="1"
              value={delta}
              onChange={(event) => setDelta(event.target.value)}
            />
          </label>
          <label>
            Lý do
            <input
              required
              maxLength={255}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy || rows.length === 0}>
            {busy ? 'Đang lưu…' : 'Ghi biến động kho'}
          </Button>
        </form>
      )}
    </div>
  )
}
