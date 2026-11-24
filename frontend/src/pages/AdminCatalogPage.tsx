import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { mockApi } from '../services/mockApi'

type Resource = 'categories' | 'brands' | 'variants' | 'media'
type Row = {
  id: string
  name?: string
  slug?: string
  parent?: string | null
  product?: string
  sku?: string
  size?: string
  color?: string
  unit_price?: string
  stock_qty?: number
  is_active: boolean
}
type Option = { id: string; name: string }
const titles = {
  categories: 'Danh mục',
  brands: 'Thương hiệu',
  variants: 'Biến thể SKU',
  media: 'Ảnh sản phẩm',
}
const blank = {
  id: '',
  name: '',
  slug: '',
  parent: '',
  product: '',
  sku: '',
  size: '',
  color: '',
  unit_price: '',
  is_active: true,
}

export function AdminCatalogPage({ resource }: { resource: Resource }) {
  const [rows, setRows] = useState<Row[]>()
  const [products, setProducts] = useState<Option[]>([])
  const [categories, setCategories] = useState<Option[]>([])
  const [form, setForm] = useState(blank)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)

  const update = (field: keyof typeof blank, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }))

  useEffect(() => {
    let active = true
    if (resource !== 'media') {
      mockApi
        .getAdminCatalog(resource, page)
        .then((data) => {
          if (!active) return
          setRows(data.results)
          setHasNext(Boolean(data.next))
        })
        .catch(() => {
          if (active) setError('Không thể tải danh sách.')
        })
    }
    return () => {
      active = false
    }
  }, [resource, page])

  useEffect(() => {
    let active = true
    if (resource === 'variants' || resource === 'media') {
      mockApi
        .getProducts()
        .then((data) => {
          if (active) setProducts(data.results)
        })
        .catch(() => {
          if (active) setError('Không thể tải sản phẩm.')
        })
    }
    if (resource === 'categories') {
      mockApi
        .getAdminCatalog('categories')
        .then((data) => {
          if (active) setCategories(data.results)
        })
        .catch(() => {
          if (active) setError('Không thể tải danh mục cha.')
        })
    }
    return () => {
      active = false
    }
  }, [resource])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const element = event.currentTarget
    setBusy(true)
    setError('')
    setStatus('')
    try {
      if (resource === 'media') {
        await mockApi.uploadProductImage(new FormData(element))
        element.reset()
        setStatus('Đã tải và gắn ảnh vào sản phẩm.')
        return
      }
      const fields =
        resource === 'variants'
          ? {
              product: form.product,
              sku: form.sku,
              size: form.size,
              color: form.color,
              unit_price: form.unit_price,
            }
          : {
              name: form.name,
              slug: form.slug,
              ...(resource === 'categories'
                ? { parent: form.parent || null }
                : {}),
            }
      await mockApi.saveAdminCatalog(resource, form.id, {
        ...fields,
        is_active: form.is_active,
      })
      setForm(blank)
      setStatus('Đã lưu thay đổi.')
      const current = await mockApi.getAdminCatalog(resource, page)
      setRows(current.results)
      setHasNext(Boolean(current.next))
      if (resource === 'categories' && page === 1)
        setCategories(current.results)
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Không thể cập nhật dữ liệu.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>{titles[resource]}</h1>
      </header>
      <nav className="hero-actions" aria-label="Quản lý danh mục">
        <Link to="/admin/products">Sản phẩm</Link>
        <Link to="/admin/variants">SKU</Link>
        <Link to="/admin/categories">Danh mục</Link>
        <Link to="/admin/brands">Thương hiệu</Link>
        <Link to="/admin/media">Ảnh</Link>
      </nav>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      {status && <p role="status">{status}</p>}
      {resource === 'media' ? (
        <form className="admin-panel admin-form-grid" onSubmit={submit}>
          <label>
            Sản phẩm
            <select name="product_id" required>
              <option value="">Chọn sản phẩm</option>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ảnh sản phẩm
            <input
              required
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </label>
          <label>
            Mô tả ảnh
            <input name="alt_text" maxLength={200} />
          </label>
          <Button type="submit" disabled={busy || products.length === 0}>
            Tải ảnh
          </Button>
        </form>
      ) : (
        <>
          {!rows && !error && <p role="status">Đang tải danh sách…</p>}
          {rows?.length === 0 && <p>Chưa có bản ghi.</p>}
          {rows && rows.length > 0 && (
            <section className="admin-panel admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{resource === 'variants' ? 'SKU' : 'Tên'}</th>
                    <th>Trạng thái</th>
                    {resource === 'variants' && <th>Tồn</th>}
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name ?? row.sku}</td>
                      <td>{row.is_active ? 'Đang dùng' : 'Đã tắt'}</td>
                      {resource === 'variants' && <td>{row.stock_qty}</td>}
                      <td>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setForm({
                              ...blank,
                              ...row,
                              parent: row.parent ?? '',
                              product: row.product ?? '',
                            })
                          }
                        >
                          Sửa {row.name ?? row.sku}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {(page > 1 || hasNext) && (
            <div className="hero-actions">
              <Button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Trang trước
              </Button>
              <Button
                type="button"
                disabled={!hasNext}
                onClick={() => setPage(page + 1)}
              >
                Trang sau
              </Button>
            </div>
          )}
          <form className="admin-panel admin-form-grid" onSubmit={submit}>
            <h2 className="full-field">{form.id ? 'Chỉnh sửa' : 'Thêm mới'}</h2>
            {resource === 'variants' ? (
              <>
                <label>
                  Sản phẩm
                  <select
                    required
                    disabled={Boolean(form.id)}
                    value={form.product}
                    onChange={(event) => update('product', event.target.value)}
                  >
                    <option value="">Chọn sản phẩm</option>
                    {products.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  SKU
                  <input
                    required
                    maxLength={64}
                    value={form.sku}
                    onChange={(event) => update('sku', event.target.value)}
                  />
                </label>
                <label>
                  Size
                  <input
                    required
                    maxLength={16}
                    value={form.size}
                    onChange={(event) => update('size', event.target.value)}
                  />
                </label>
                <label>
                  Màu
                  <input
                    required
                    maxLength={32}
                    value={form.color}
                    onChange={(event) => update('color', event.target.value)}
                  />
                </label>
                <label>
                  Đơn giá VND
                  <input
                    required
                    type="number"
                    min={0}
                    step={1}
                    value={form.unit_price}
                    onChange={(event) =>
                      update('unit_price', event.target.value)
                    }
                  />
                </label>
                <Link to="/admin/inventory">Điều chỉnh tồn kho</Link>
              </>
            ) : (
              <>
                <label>
                  Tên
                  <input
                    required
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                  />
                </label>
                <label>
                  Slug
                  <input
                    required
                    value={form.slug}
                    onChange={(event) => update('slug', event.target.value)}
                  />
                </label>
                {resource === 'categories' && (
                  <label>
                    Danh mục cha
                    <select
                      value={form.parent}
                      onChange={(event) => update('parent', event.target.value)}
                    >
                      <option value="">Không có</option>
                      {categories
                        .filter((item) => item.id !== form.id)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
              </>
            )}
            <label>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => update('is_active', event.target.checked)}
              />{' '}
              Hoạt động
            </label>
            <div className="hero-actions">
              <Button type="submit" disabled={busy}>
                Lưu
              </Button>
              {form.id && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setForm(blank)}
                >
                  Hủy sửa
                </Button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  )
}
