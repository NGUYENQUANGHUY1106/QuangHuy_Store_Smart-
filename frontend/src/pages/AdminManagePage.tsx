import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../components/Button'
import { formatVnd } from '../utils/format'
import { mockApi } from '../services/mockApi'

type Row = { id: string | number; is_active: boolean; role?: string } & Record<
  string,
  unknown
>
type Field = [string, string, string]
const userFields: Field[] = [
  ['email', 'Email', 'email'],
  ['password', 'Mật khẩu', 'password'],
  ['first_name', 'Tên', 'text'],
  ['last_name', 'Họ', 'text'],
]
const voucherFields: Field[] = [
  ['code', 'Mã voucher', 'text'],
  ['name', 'Tên voucher', 'text'],
  ['discount_type', 'Loại giảm giá', 'select'],
  ['value', 'Giá trị giảm', 'number'],
  ['max_discount', 'Mức giảm tối đa (₫)', 'number'],
  ['min_order_value', 'Giá trị đơn tối thiểu (₫)', 'number'],
  ['usage_limit', 'Giới hạn lượt dùng', 'number'],
  ['start_date', 'Bắt đầu', 'datetime-local'],
  ['end_date', 'Kết thúc', 'datetime-local'],
]

export function AdminManagePage({
  resource,
}: {
  resource: 'users' | 'vouchers'
}) {
  const users = resource === 'users'
  const [rows, setRows] = useState<Row[]>()
  const [selected, setSelected] = useState<Row>()
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(false)
  const [discountType, setDiscountType] = useState('FIXED')
  const editorHeading = useRef<HTMLHeadingElement>(null)
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [revision, reload] = useState(0)

  useEffect(() => {
    let active = true
    mockApi
      .getAdminCatalog(resource, page)
      .then((data) => {
        if (active) {
          setRows(data.results)
          setHasNext(Boolean(data.next))
        }
      })
      .catch(() => {
        if (active) setLoadError('Không thể tải danh sách.')
      })
    return () => {
      active = false
    }
  }, [resource, page, revision])

  useEffect(() => {
    if (editing) editorHeading.current?.focus()
  }, [editing, selected])

  function openEditor(row?: Row) {
    setSelected(row)
    setDiscountType(String(row?.discount_type ?? 'FIXED'))
    setError('')
    setNotice('')
    setEditing(true)
  }

  function changePage(next: number) {
    setRows(undefined)
    setLoadError('')
    setPage(next)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const data: Record<string, string | boolean | null> = {}
    const form = new FormData(event.currentTarget)
    for (const [name, , type] of users ? userFields : voucherFields) {
      const value = form.get(name)
      if (typeof value !== 'string') continue
      data[name] =
        type === 'datetime-local'
          ? value + ':00+07:00'
          : name === 'max_discount' && value === ''
            ? null
            : value
    }
    if (!users) {
      if (typeof data.code === 'string')
        data.code = data.code.trim().toUpperCase()
      if (discountType === 'FIXED') data.max_discount = null
      if (
        Date.parse(String(data.start_date)) >= Date.parse(String(data.end_date))
      ) {
        setError('Thời điểm kết thúc phải sau thời điểm bắt đầu.')
        return
      }
    }
    data.is_active = form.has('is_active')
    setBusy(true)
    setError('')
    try {
      await mockApi.saveAdminCatalog(resource, selected?.id, data)
      setEditing(false)
      setSelected(undefined)
      setRows(undefined)
      setLoadError('')
      setNotice(users ? 'Đã lưu người dùng.' : 'Đã lưu voucher.')
      reload((n) => n + 1)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không thể lưu.')
    } finally {
      setBusy(false)
    }
  }

  const label = users ? 'người dùng' : 'voucher'
  const date = (value: unknown) =>
    new Date(String(value)).toLocaleString('vi-VN', {
      timeZone: 'Asia/Saigon',
      dateStyle: 'short',
      timeStyle: 'short',
    })

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h1>{users ? 'Quản lý người dùng' : 'Voucher'}</h1>
        <Button type="button" onClick={() => openEditor()} disabled={busy}>
          Thêm {label}
        </Button>
      </header>
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      <div
        className={editing ? 'admin-management has-editor' : 'admin-management'}
      >
        <section
          className="admin-panel admin-management-list"
          aria-label={`Danh sách ${label}`}
        >
          <div className="admin-panel-heading">
            <h2>Danh sách {label}</h2>
          </div>
          {loadError ? (
            <div className="admin-management-message">
              <p role="alert">{loadError}</p>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  setLoadError('')
                  reload((n) => n + 1)
                }}
              >
                Thử lại
              </Button>
            </div>
          ) : !rows ? (
            <p className="admin-management-message" role="status">
              Đang tải danh sách…
            </p>
          ) : !rows.length ? (
            <p className="admin-management-message">Chưa có {label}.</p>
          ) : (
            <ul className="admin-management-rows">
              {rows.map((row) => {
                const key = String(row[users ? 'email' : 'code'])
                return (
                  <li key={row.id}>
                    <div className="admin-management-row">
                      <div>
                        <strong>{key}</strong>
                        {users ? (
                          <small>
                            {row.role === 'ADMIN'
                              ? 'Quản trị viên'
                              : 'Khách hàng'}
                          </small>
                        ) : (
                          <small>
                            {String(row.name)} ·{' '}
                            {row.discount_type === 'PERCENT'
                              ? `${Number(row.value)}%`
                              : formatVnd(Number(row.value))}
                          </small>
                        )}
                      </div>
                      <span
                        className={`admin-status${row.is_active ? ' live' : ''}`}
                      >
                        {row.is_active ? 'Đang bật' : 'Đã tắt'}
                      </span>
                      {(!users || row.role === 'CUSTOMER') && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          aria-label={`Sửa ${key}`}
                          onClick={() => openEditor(row)}
                          disabled={busy}
                        >
                          Sửa
                        </Button>
                      )}
                    </div>
                    {!users && (
                      <dl className="admin-voucher-info">
                        <div>
                          <dt>Lượt dùng</dt>
                          <dd>
                            {String(row.used_count ?? 0)} /{' '}
                            {String(row.usage_limit)}
                          </dd>
                        </div>
                        <div>
                          <dt>Đơn tối thiểu</dt>
                          <dd>{formatVnd(Number(row.min_order_value))}</dd>
                        </div>
                        <div>
                          <dt>Thời gian hiệu lực</dt>
                          <dd>
                            {date(row.start_date)} – {date(row.end_date)}
                          </dd>
                        </div>
                        {row.discount_type === 'PERCENT' &&
                          row.max_discount != null && (
                            <div>
                              <dt>Giảm tối đa</dt>
                              <dd>{formatVnd(Number(row.max_discount))}</dd>
                            </div>
                          )}
                      </dl>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {(page > 1 || hasNext) && (
            <nav
              className="admin-management-pagination"
              aria-label="Phân trang"
            >
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
              >
                Trang trước
              </Button>
              <span>Trang {page}</span>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={!hasNext}
                onClick={() => changePage(page + 1)}
              >
                Trang sau
              </Button>
            </nav>
          )}
        </section>
        {editing && (
          <section className="admin-panel admin-management-editor">
            <div className="admin-panel-heading">
              <h2 ref={editorHeading} tabIndex={-1}>
                {selected ? 'Chỉnh sửa' : 'Thêm'} {label}
              </h2>
            </div>
            <form
              key={selected?.id ?? 'new'}
              className="admin-form-grid"
              onSubmit={save}
            >
              {error && (
                <p className="form-error admin-editor-full" role="alert">
                  {error}
                </p>
              )}
              {!users && (
                <p className="admin-editor-full admin-editor-hint">
                  Thời gian theo giờ Việt Nam (UTC+7). Mỗi đơn áp dụng một mã.
                </p>
              )}
              {(users ? userFields : voucherFields).map(
                ([name, fieldLabel, type]) => {
                  if (
                    users &&
                    selected &&
                    (name === 'email' || name === 'password')
                  )
                    return null
                  if (name === 'max_discount' && discountType === 'FIXED')
                    return null
                  const raw = String(
                    selected?.[name] ??
                      (name === 'usage_limit'
                        ? 1
                        : name === 'min_order_value'
                          ? 0
                          : ''),
                  )
                  const value =
                    type === 'datetime-local' && raw
                      ? new Date(Date.parse(raw) + 7 * 3600000)
                          .toISOString()
                          .slice(0, 16)
                      : raw
                  return (
                    <label key={name}>
                      {name === 'value'
                        ? discountType === 'PERCENT'
                          ? 'Giá trị giảm (%)'
                          : 'Giá trị giảm (₫)'
                        : fieldLabel}
                      {type === 'select' ? (
                        <select
                          name={name}
                          value={discountType}
                          onChange={(event) =>
                            setDiscountType(event.target.value)
                          }
                        >
                          <option value="FIXED">Số tiền cố định</option>
                          <option value="PERCENT">Phần trăm</option>
                        </select>
                      ) : (
                        <input
                          name={name}
                          type={type}
                          defaultValue={value}
                          autoComplete={
                            type === 'password' ? 'new-password' : undefined
                          }
                          min={
                            type === 'number'
                              ? name === 'usage_limit'
                                ? Math.max(1, Number(selected?.used_count ?? 0))
                                : name === 'value' || name === 'max_discount'
                                  ? 0.01
                                  : 0
                              : undefined
                          }
                          max={
                            name === 'value' && discountType === 'PERCENT'
                              ? 100
                              : undefined
                          }
                          step={
                            type === 'number'
                              ? name === 'usage_limit'
                                ? 1
                                : 0.01
                              : undefined
                          }
                          required={!['first_name', 'last_name'].includes(name)}
                        />
                      )}
                    </label>
                  )
                },
              )}
              <label className="admin-editor-check admin-editor-full">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={selected?.is_active ?? true}
                />
                {users ? 'Cho phép đăng nhập' : 'Cho phép áp dụng voucher'}
              </label>
              <div className="admin-editor-actions admin-editor-full">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => setEditing(false)}
                >
                  Đóng
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Đang lưu…' : `Lưu ${label}`}
                </Button>
              </div>
            </form>
          </section>
        )}
      </div>
    </section>
  )
}
