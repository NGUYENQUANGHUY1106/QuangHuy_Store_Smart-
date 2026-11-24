import { MapPin, Package, ShieldCheck, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { mockApi } from '../services/mockApi'

export function AccountLayoutPage() {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="account-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: 'Tài khoản' }]}
      />
      <header className="account-header">
        <div className="user-avatar large">{user?.name.charAt(0) ?? 'U'}</div>
        <div>
          <h1>Tài khoản của tôi</h1>
          <p>{user.name}</p>
        </div>
      </header>
      <div className="account-layout">
        <aside className="account-sidebar">
          <nav>
            <NavLink to="/account" end>
              <UserRound size={18} />
              Thông tin cá nhân
            </NavLink>
            <NavLink to="/account/addresses">
              <MapPin size={18} />
              Sổ địa chỉ
            </NavLink>
            <NavLink to="/account/orders">
              <Package size={18} />
              Đơn hàng
            </NavLink>
            <NavLink to="/account/security">
              <ShieldCheck size={18} />
              Đổi mật khẩu
            </NavLink>
          </nav>
        </aside>
        <main className="account-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    birthday: user?.birthday ?? '',
    gender: user?.gender ?? 'Nam',
  })

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setSaveError('')
    try {
      await updateProfile(form)
      setMessage('Đã lưu thông tin cá nhân.')
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Không thể lưu thông tin cá nhân.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="account-panel">
      <h2>Thông tin cá nhân</h2>
      <form className="form-grid" onSubmit={submit}>
        <label>
          Họ và tên
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </label>
        <label>
          Số điện thoại
          <input
            value={form.phone}
            onChange={(event) =>
              setForm({ ...form, phone: event.target.value })
            }
          />
        </label>
        <label>
          Ngày sinh
          <input
            type="date"
            value={form.birthday}
            onChange={(event) =>
              setForm({ ...form, birthday: event.target.value })
            }
          />
        </label>
        <label>
          Giới tính
          <select
            value={form.gender}
            onChange={(event) =>
              setForm({ ...form, gender: event.target.value })
            }
          >
            <option>Nam</option>
            <option>Nữ</option>
            <option>Khác</option>
          </select>
        </label>
        <div className="full-field">
          {message && (
            <p role="status" className="variant-message">
              {message}
            </p>
          )}
          {saveError && (
            <p role="alert" className="form-error">
              {saveError}
            </p>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </section>
  )
}

export function AddressesPage() {
  const { user, refreshAddresses } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [receiver, setReceiver] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openNew = () => {
    setEditingId(null)
    setReceiver('')
    setPhone('')
    setAddress('')
    setError('')
    setModalOpen(true)
  }

  const openEdit = (item: NonNullable<typeof user>['addresses'][number]) => {
    setEditingId(item.id)
    setReceiver(item.receiver)
    setPhone(item.phone)
    setAddress(item.address)
    setError('')
    setModalOpen(true)
  }

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const addresses = user?.addresses ?? []
      if (editingId) {
        await mockApi.updateAddress(editingId, {
          receiver,
          phone,
          street: address,
        })
      } else {
        await mockApi.createAddress({
          receiver,
          phone,
          street: address,
          is_default: addresses.length === 0,
        })
      }
      await refreshAddresses()
      setModalOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu địa chỉ.')
    } finally {
      setLoading(false)
    }
  }

  const setDefault = async (id: string) => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      await mockApi.updateAddress(id, { is_default: true })
      await refreshAddresses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đặt mặc định.')
    } finally {
      setLoading(false)
    }
  }

  const removeAddress = async (id: string) => {
    if (loading || !window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?'))
      return
    setLoading(true)
    setError('')
    try {
      await mockApi.deleteAddress(id)
      await refreshAddresses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa địa chỉ.')
    } finally {
      setLoading(false)
    }
  }

  const addressList = user?.addresses ?? []

  return (
    <section className="account-panel">
      <div className="panel-heading">
        <h2>Sổ địa chỉ</h2>
        <Button type="button" onClick={openNew}>
          Thêm địa chỉ
        </Button>
      </div>
      {error && !modalOpen && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {addressList.length === 0 ? (
        <div className="empty-state compact">
          <h3>Chưa có địa chỉ nào</h3>
          <p>Thêm địa chỉ để thuận tiện hơn khi thanh toán.</p>
        </div>
      ) : (
        <div className="address-list">
          {addressList.map((item) => (
            <article className="address-card" key={item.id}>
              <div>
                <strong>{item.receiver}</strong>
                {item.isDefault && (
                  <span className="default-label">Mặc định</span>
                )}
                <p>{item.phone}</p>
                <p>{item.address}</p>
              </div>
              <div className="address-actions">
                {!item.isDefault && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setDefault(item.id)}
                  >
                    Đặt mặc định
                  </button>
                )}
                <button type="button" onClick={() => openEdit(item)}>
                  Sửa
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => removeAddress(item.id)}
                >
                  Xóa
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Modal
        open={modalOpen}
        title={editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
        onClose={() => setModalOpen(false)}
      >
        <form className="form-grid" onSubmit={saveAddress}>
          {error && (
            <p className="form-error full-field" role="alert">
              {error}
            </p>
          )}
          <label className="full-field">
            Người nhận
            <input
              required
              value={receiver}
              onChange={(event) => setReceiver(event.target.value)}
            />
          </label>
          <label className="full-field">
            Số điện thoại
            <input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label className="full-field">
            Địa chỉ
            <input
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </label>
          <Button className="full-field" type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
          </Button>
        </form>
      </Modal>
    </section>
  )
}

export function SecurityPage() {
  return (
    <section className="account-panel">
      <h2>Đổi mật khẩu</h2>
      <p>Tính năng đổi mật khẩu chưa mở.</p>
    </section>
  )
}
