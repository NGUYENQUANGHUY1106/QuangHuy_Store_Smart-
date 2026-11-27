import { AdminProductAssets, type ProductAssets } from './AdminProductAssets'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { mockApi, productImageUrl } from '../services/mockApi'
import { formatVnd } from '../utils/format'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'

type AdminVariant = {
  id: string
  sku: string
  size: string
  color: string
  stock_qty: number
}
type AdminProduct = {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  description: string
  thumbnail?: string | null
  status: string
  variants: AdminVariant[]
}
type CatalogOption = { id: string; name: string }

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [apiOrders, setApiOrders] = useState<any[] | null>(null)
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [cancelModal, setCancelModal] = useState<{
    open: boolean
    orderId: string
    targetStatus: string
    version?: number
  }>({
    open: false,
    orderId: '',
    targetStatus: '',
  })

  const loadOrders = () => {
    mockApi
      .getAdminOrders({
        status: status === 'all' ? undefined : status,
        search: query || undefined,
      })
      .then((data) => {
        if (data && Array.isArray(data.results)) {
          setApiOrders(
            data.results.map((ord: any) => ({
              id: ord.number || ord.id,
              orderId: ord.id,
              version: ord.version,
              status: ord.status.toLowerCase(),
              createdAt: ord.created_at ? ord.created_at.slice(0, 10) : '',
              customer: ord.address_snapshot?.receiver || 'Khách hàng',
              total: Number(ord.total),
            })),
          )
        }
      })
      .catch(() => {
        setErrorMsg('Không thể tải đơn hàng.')
      })
  }

  useEffect(() => {
    loadOrders()
  }, [status, query])

  const orderList = apiOrders ?? []

  const handleStatusChange = (
    orderId: string,
    newStatus: string,
    version: number,
  ) => {
    if (newStatus === 'cancelled') {
      setCancelModal({ open: true, orderId, targetStatus: newStatus, version })
      return
    }
    executeStatusChange(orderId, newStatus, version)
  }

  const executeStatusChange = async (
    orderId: string,
    newStatus: string,
    version?: number,
  ) => {
    setErrorMsg('')
    try {
      await mockApi.updateAdminOrderStatus(orderId, newStatus, '', version)
      loadOrders()
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Không thể chuyển trạng thái đơn hàng (Conflict hoặc vi phạm quy tắc).',
      )
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Xử lý đơn</p>
          <h1>Đơn hàng</h1>
        </div>
      </header>
      <section className="admin-panel">
        {errorMsg && (
          <div
            className="form-error"
            role="alert"
            style={{ marginBottom: '1rem' }}
          >
            {errorMsg}
          </div>
        )}
        <div className="admin-filter-bar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm mã đơn..."
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Ngày</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orderList.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                  </td>
                  <td>{order.createdAt}</td>
                  <td>{order.customer}</td>
                  <td>{formatVnd(order.total)}</td>
                  <td>
                    <select
                      className="admin-status-select"
                      value={order.status}
                      onChange={(event) =>
                        handleStatusChange(
                          order.id,
                          event.target.value,
                          order.version,
                        )
                      }
                    >
                      <option value="pending">Chờ xác nhận</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="shipping">Đang giao</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="cancelled">Đã hủy</option>
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-link-button"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={cancelModal.open}
        title="Xác nhận hủy đơn hàng"
        onClose={() =>
          setCancelModal({ open: false, orderId: '', targetStatus: '' })
        }
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p>
            <strong>Cảnh báo tác động kho:</strong> Việc hủy đơn sẽ tự động hoàn
            trả toàn bộ số lượng tồn kho của các sản phẩm trong đơn hàng này.
          </p>
          <p>
            Bạn có chắc chắn muốn hủy đơn hàng{' '}
            <strong>{cancelModal.orderId}</strong>?
          </p>
          <div
            className="modal-actions"
            style={{
              marginTop: '1rem',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                setCancelModal({ open: false, orderId: '', targetStatus: '' })
              }
            >
              Không
            </Button>
            <Button
              type="button"
              onClick={() => {
                executeStatusChange(
                  cancelModal.orderId,
                  cancelModal.targetStatus,
                  cancelModal.version,
                )
                setCancelModal({ open: false, orderId: '', targetStatus: '' })
              }}
            >
              Xác nhận hủy và hoàn tồn
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

type AdminOrderResponse = {
  id: string
  number: string
  version: number
  status: string
  created_at?: string
  total: string
  items?: {
    product_name_snapshot: string
    sku_snapshot: string
    thumbnail?: string | null
    qty: number
    line_subtotal: string
  }[]
}

export function AdminOrderDetailPage() {
  const { id } = useParams()
  const [apiOrder, setApiOrder] = useState<AdminOrderResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const loadDetail = () => {
    if (id) {
      mockApi
        .getAdminOrderDetail(id)
        .then((data) => {
          if (data && (data.id || data.number)) {
            setApiOrder(data)
          }
        })
        .catch(() => {
          setErrorMsg('Không thể tải đơn hàng.')
        })
    }
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  const order = apiOrder
    ? {
        id: apiOrder.number || apiOrder.id,
        orderId: apiOrder.id,
        version: apiOrder.version,
        status: apiOrder.status.toLowerCase(),
        createdAt: apiOrder.created_at ? apiOrder.created_at.slice(0, 10) : '',
        total: Number(apiOrder.total),
        items: (apiOrder.items ?? []).map((it) => ({
          name: it.product_name_snapshot,
          image: productImageUrl(it.thumbnail),
          sku: it.sku_snapshot,
          quantity: it.qty,
          lineSubtotal: Number(it.line_subtotal),
        })),
      }
    : null

  if (!order)
    return (
      <div className="admin-page">
        <section className="admin-panel">
          <h2>{errorMsg || 'Đang tải đơn hàng…'}</h2>
        </section>
      </div>
    )

  const handleStatusChange = async (newStatus: string) => {
    if (
      newStatus === 'cancelled' &&
      !window.confirm(
        'Hủy đơn sẽ hoàn số lượng đã giữ về kho. Bạn xác nhận hủy?',
      )
    )
      return
    setErrorMsg('')
    try {
      await mockApi.updateAdminOrderStatus(
        order.id,
        newStatus,
        '',
        order.version,
      )
      loadDetail()
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Không thể chuyển trạng thái (409 Conflict).',
      )
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Chi tiết đơn</p>
          <h1>{order.id}</h1>
        </div>
        <Link className="admin-back-link" to="/admin/orders">
          <ArrowLeft size={16} />
          Quay lại
        </Link>
      </header>
      {errorMsg && (
        <div
          className="form-error"
          role="alert"
          style={{ marginBottom: '1rem' }}
        >
          {errorMsg}
        </div>
      )}
      <div className="admin-detail-grid">
        <section className="admin-panel">
          <h2>Sản phẩm ({order.items.length})</h2>
          {order.items.map((item) => (
            <div className="admin-order-item" key={item.sku}>
              <img className="admin-line-thumbnail" src={item.image} alt="" />
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.sku} × {item.quantity}
                </small>
              </div>
              <strong>{formatVnd(item.lineSubtotal)}</strong>
            </div>
          ))}
        </section>
        <section className="admin-panel">
          <h2>Trạng thái</h2>
          <select
            className="admin-status-select wide"
            value={order.status}
            onChange={(event) => handleStatusChange(event.target.value)}
          >
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <dl className="admin-detail-meta">
            <div>
              <dt>Ngày đặt</dt>
              <dd>{order.createdAt}</dd>
            </div>
            <div>
              <dt>Tổng tiền</dt>
              <dd>{formatVnd(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

export function AdminGenericPage({
  code,
  title,
}: {
  code: string
  title: string
}) {
  const genericList: Record<
    string,
    Array<{ id: string; name: string; detail: string }>
  > = {
    A13: [
      { id: '1', name: 'Giày bóng đá', detail: 'Danh mục sản phẩm' },
      { id: '2', name: 'Quần áo thể thao', detail: 'Danh mục sản phẩm' },
    ],
    A15: [
      { id: '1', name: 'Nike', detail: 'Thương hiệu đối tác' },
      { id: '2', name: 'Adidas', detail: 'Thương hiệu đối tác' },
      { id: '3', name: 'Mizuno', detail: 'Thương hiệu đối tác' },
      { id: '4', name: 'Puma', detail: 'Thương hiệu đối tác' },
    ],
    A16: [
      {
        id: '1',
        name: 'Nguyễn Quang Huy',
        detail: 'huy@example.com · Customer',
      },
    ],
    A17: [
      {
        id: '1',
        name: 'Nguyễn Quang Huy',
        detail: 'Khách hàng · Đang hoạt động',
      },
    ],
    A18: [
      {
        id: '1',
        name: 'Doanh thu tháng 11',
        detail: 'Dữ liệu mẫu chưa xác nhận',
      },
    ],
    A19: [
      {
        id: '1',
        name: 'Nike Mercurial Vapor 16',
        detail: 'Bán chạy trong dữ liệu mẫu',
      },
    ],
    A20: [
      { id: '1', name: 'QHSNEW', detail: 'Giảm 10% · tối thiểu 500.000đ' },
      {
        id: '2',
        name: 'FREESHIP',
        detail: 'Giảm 30.000đ · tối thiểu 1.000.000đ',
      },
    ],
    A21: [{ id: '1', name: 'Voucher mới', detail: 'Form tạo/sửa voucher mẫu' }],
    A22: [
      {
        id: '1',
        name: 'Chưa có review',
        detail: 'Dữ liệu review P2 chưa kích hoạt',
      },
    ],
    A23: [
      {
        id: '1',
        name: 'Không có review',
        detail: 'Chọn một review sau khi module P2 được kích hoạt',
      },
    ],
    A24: [
      {
        id: '1',
        name: 'Không có job',
        detail: 'AI worker chưa được kích hoạt',
      },
    ],
    A25: [
      {
        id: '1',
        name: 'AI Try-On',
        detail: 'Model/license/GPU chưa được phê duyệt',
      },
    ],
    A26: [
      {
        id: '1',
        name: 'Đăng nhập admin',
        detail: 'Log mẫu chưa có backend audit',
      },
    ],
    A27: [{ id: '1', name: 'QUANGHUY SPORT', detail: 'Cài đặt cửa hàng mẫu' }],
    A28: [{ id: '1', name: 'Banner mùa giải', detail: 'Banner trang chủ mẫu' }],
    A29: [{ id: '1', name: 'Banner mới', detail: 'Form tạo/sửa banner mẫu' }],
    A30: [
      {
        id: '1',
        name: 'Không có background job',
        detail: 'Worker P2 chưa được kích hoạt',
      },
    ],
  }
  const list = genericList[code] ?? []
  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <p className="admin-eyebrow">Quản trị</p>
          <h1>{title}</h1>
        </div>
      </header>
      <section className="admin-panel">
        {[
          'A13',
          'A14',
          'A15',
          'A16',
          'A20',
          'A21',
          'A24',
          'A25',
          'A27',
          'A28',
          'A29',
        ].includes(code) && (
          <div className="admin-toolbar">
            <input placeholder={`Tìm ${title.toLowerCase()}...`} />
            <Button type="button" size="sm">
              Thêm mới
            </Button>
          </div>
        )}
        <div className="admin-generic-list">
          {list.map((item) => (
            <article key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p>{item.detail}</p>
              </div>
              <button type="button">Mở</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email || password.length < 6) {
      setError('Vui lòng nhập email và mật khẩu tối thiểu 6 ký tự.')
      return
    }
    if (submitting) return
    setSubmitting(true)
    setError('')
    try {
      if (
        (await login(email, password)) &&
        (await mockApi.getMe()).role === 'ADMIN'
      ) {
        navigate('/admin', { replace: true })
      } else {
        setError(
          'Tài khoản không có quyền quản trị hoặc thông tin đăng nhập chưa đúng.',
        )
      }
    } catch {
      setError('Không thể xác thực quyền quản trị.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="brand admin-brand">
          <span>QUANGHUY</span>
          <strong>SPORT</strong>
        </div>
        <p className="admin-eyebrow">Cổng quản trị</p>
        <h1>Đăng nhập</h1>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <Button type="submit" disabled={submitting}>
          Đăng nhập
        </Button>
      </form>
    </div>
  )
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>()
  const [page, setPage] = useState(1)
  const [hasNext, setHasNext] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    mockApi
      .getProducts(page)
      .then((data) => {
        if (active) {
          setProducts(data.results)
          setHasNext(Boolean(data.next))
        }
      })
      .catch(() => {
        if (active) setError('Không thể tải sản phẩm.')
      })
    return () => {
      active = false
    }
  }, [page])

  async function archive(id: string) {
    setError('')
    try {
      const product = await mockApi.saveProduct(id, { status: 'archived' })
      setProducts((current) =>
        current?.map((row) => (row.id === id ? product : row)),
      )
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Không thể ngừng bán.',
      )
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Sản phẩm</h1>
        <div className="hero-actions">
          <Link className="admin-back-link" to="/admin/media">
            Quản lý ảnh
          </Link>
          <Link className="admin-back-link" to="/admin/products/new">
            Thêm sản phẩm
          </Link>
        </div>
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!products && !error && <p role="status">Đang tải sản phẩm…</p>}
      {products?.length === 0 && <p>Chưa có sản phẩm.</p>}
      {products && products.length > 0 && (
        <section className="admin-panel admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Trạng thái</th>
                <th>Tồn kho</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-product-cell">
                      <img
                        src={productImageUrl(product.thumbnail)}
                        alt=""
                        loading="lazy"
                      />
                      <strong>{product.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`admin-status${product.status === 'published' ? ' live' : ''}`}
                    >
                      {product.status === 'published'
                        ? 'Đang bán'
                        : product.status === 'archived'
                          ? 'Đã ngừng bán'
                          : 'Bản nháp'}
                    </span>
                  </td>
                  <td>
                    {product.variants.reduce(
                      (sum, variant) => sum + variant.stock_qty,
                      0,
                    )}
                  </td>
                  <td>
                    <Link to={`/admin/products/${product.id}/edit`}>Sửa</Link>
                    {product.status !== 'archived' && (
                      <button
                        className="admin-delete"
                        type="button"
                        onClick={() => void archive(product.id)}
                      >
                        Ngừng bán
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <div className="hero-actions">
        <Button
          type="button"
          disabled={page === 1}
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
    </div>
  )
}

export function AdminProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [options, setOptions] = useState<{
    categories: CatalogOption[]
    brands: CatalogOption[]
  }>()
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    brand: '',
    status: 'draft',
  })
  const [assets, setAssets] = useState<ProductAssets>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([
      mockApi.getCatalogOptions(),
      id ? mockApi.getProduct(id) : null,
    ])
      .then(([lists, product]) => {
        if (!active) return
        setOptions(lists)
        if (product) {
          const { name, slug, description, category, brand, status } = product
          setForm({ name, slug, description, category, brand, status })
          setAssets(product)
        }
      })
      .catch(() => {
        if (active) setError('Không thể tải thông tin sản phẩm.')
      })
    return () => {
      active = false
    }
  }, [id])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await mockApi.saveProduct(id, form)
      navigate('/admin/products')
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Không thể lưu sản phẩm.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>{id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h1>
        <div className="hero-actions">
          {id && assets && (
            <a className="admin-back-link" href="#product-assets">
              Màu, giá và ảnh
            </a>
          )}
          <Link className="admin-back-link" to="/admin/products">
            Quay lại
          </Link>
        </div>
      </header>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!options && !error && <p role="status">Đang tải thông tin sản phẩm…</p>}
      {options && (
        <form
          className="admin-panel admin-form-grid admin-product-info"
          onSubmit={submit}
        >
          <label>
            Tên sản phẩm
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </label>
          <label>
            Slug
            <input
              required
              pattern="[a-zA-Z0-9_-]+"
              value={form.slug}
              onChange={(event) =>
                setForm({ ...form, slug: event.target.value })
              }
            />
          </label>
          <label>
            Danh mục
            <select
              required
              value={form.category}
              onChange={(event) =>
                setForm({ ...form, category: event.target.value })
              }
            >
              <option value="">Chọn danh mục</option>
              {options.categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Thương hiệu
            <select
              required
              value={form.brand}
              onChange={(event) =>
                setForm({ ...form, brand: event.target.value })
              }
            >
              <option value="">Chọn thương hiệu</option>
              {options.brands.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trạng thái
            <select
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value })
              }
            >
              <option value="draft">Bản nháp</option>
              <option value="published">Đang bán</option>
              <option value="archived">Ngừng bán</option>
            </select>
          </label>
          <label>
            Mô tả
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <Button type="submit" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu sản phẩm'}
          </Button>
        </form>
      )}
      {id && assets && <AdminProductAssets key={id} id={id} initial={assets} />}
    </div>
  )
}
