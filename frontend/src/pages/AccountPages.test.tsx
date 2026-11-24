import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountLayoutPage, AddressesPage } from './AccountPages'
import { AuthProvider } from '../context/AuthContext'
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
