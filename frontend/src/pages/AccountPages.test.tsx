import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountLayoutPage, AddressesPage, ProfilePage } from './AccountPages'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { Header } from '../components/Header'
import { mockApi } from '../services/mockApi'

describe('AccountPages UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('redirects guest to /login when visiting account layout', () => {
    render(
      <MemoryRouter initialEntries={['/account']}>
        <AuthProvider>
          <Routes>
            <Route path="/account" element={<AccountLayoutPage />} />
            <Route path="/login" element={<div>Trang đăng nhập</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument()
  })

  it('updates the name and avatar in both the account page and header', async () => {
    sessionStorage.setItem(
      'qhs-user',
      JSON.stringify({
        id: 'legacy-user',
        name: 'legacy@example.com',
        email: 'legacy@example.com',
        phone: '',
        addresses: [],
      }),
    )
    vi.spyOn(mockApi, 'getCart').mockResolvedValue({ items: [] })
    vi.spyOn(mockApi, 'updateAvatar').mockResolvedValue({
      avatar_url: '/media/profile-avatars/test',
    })
    vi.spyOn(mockApi, 'updateProfile').mockResolvedValue({
      id: 'legacy-user',
      display_name: 'Nguyễn Quang Huy',
      full_name: 'Nguyễn Quang Huy',
    })
    const { container } = render(
      <MemoryRouter initialEntries={['/account']}>
        <AuthProvider>
          <CartProvider>
            <Header />
            <Routes>
              <Route path="/account" element={<AccountLayoutPage />}>
                <Route index element={<ProfilePage />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>,
    )
    const name = screen.getByRole('textbox', { name: 'Họ và tên' })
    expect(name).toHaveValue('')
    expect(container.querySelector('.account-name')).toHaveTextContent('legacy')
    expect(screen.queryByText('legacy@example.com')).not.toBeInTheDocument()
    fireEvent.change(name, { target: { value: 'Nguyễn Quang Huy' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(
      await screen.findByText('Đã lưu thông tin cá nhân.'),
    ).toBeInTheDocument()
    expect(container.querySelector('.account-name')).toHaveTextContent(
      'Nguyễn Quang Huy',
    )
    expect(container.querySelector('.account-header p')).toHaveTextContent(
      'Nguyễn Quang Huy',
    )

    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' })
    fireEvent.change(container.querySelector('input[type=file]')!, {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật ảnh' }))
    expect(
      await screen.findByText('Đã cập nhật ảnh đại diện.'),
    ).toBeInTheDocument()
    for (const selector of [
      '.account-trigger',
      '.account-header',
      '.profile-avatar-form',
    ]) {
      expect(
        container.querySelector(`${selector} .user-avatar img`),
      ).toHaveAttribute(
        'src',
        expect.stringContaining('/media/profile-avatars/test'),
      )
    }
  })

  it('renders addresses page and shows empty state', () => {
    sessionStorage.setItem(
      'qhs-user',
      JSON.stringify({
        id: 'user-1',
        name: 'Huy',
        email: 'huy@example.com',
        phone: '0900000000',
        addresses: [],
      }),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <AddressesPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /Sổ địa chỉ/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Chưa có địa chỉ nào')).toBeInTheDocument()
  })

  it('can open add address modal and save address via API', async () => {
    vi.spyOn(mockApi, 'createAddress').mockResolvedValue({
      id: 'addr-new',
      receiver: 'Nguyễn Văn B',
      phone: '0912345678',
      street: '123 Đường Số 1',
      is_default: true,
    })
    vi.spyOn(mockApi, 'getAddresses').mockResolvedValue([
      {
        id: 'addr-new',
        receiver: 'Nguyễn Văn B',
        phone: '0912345678',
        street: '123 Đường Số 1',
        is_default: true,
      },
    ])

    sessionStorage.setItem(
      'qhs-user',
      JSON.stringify({
        id: 'user-1',
        name: 'Huy',
        email: 'huy@example.com',
        phone: '0900000000',
        addresses: [],
      }),
    )

    render(
      <MemoryRouter>
        <AuthProvider>
          <AddressesPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Thêm địa chỉ' }))
    expect(
      screen.getByRole('heading', { name: 'Thêm địa chỉ' }),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Người nhận'), {
      target: { value: 'Nguyễn Văn B' },
    })
    fireEvent.change(screen.getByLabelText('Số điện thoại'), {
      target: { value: '0912345678' },
    })
    fireEvent.change(screen.getByLabelText('Địa chỉ'), {
      target: { value: '123 Đường Số 1' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Lưu địa chỉ' }))

    await waitFor(() => {
      expect(mockApi.createAddress).toHaveBeenCalled()
    })
  })
})
