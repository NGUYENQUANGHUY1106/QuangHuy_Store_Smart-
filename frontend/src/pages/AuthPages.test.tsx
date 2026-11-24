import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage, RegisterPage } from './AuthPages'
import { AuthProvider } from '../context/AuthContext'
import { mockApi } from '../services/mockApi'

describe('AuthPages UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  it('renders login form and shows error for invalid email', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /Đăng nhập/i }),
    ).toBeInTheDocument()
    const emailInput = screen.getByPlaceholderText('huy@example.com')
    const passwordInput = screen.getByPlaceholderText('Ít nhất 6 ký tự')
    const form = container.querySelector('form')!

    fireEvent.change(emailInput, { target: { value: 'not-an-email' } })
    fireEvent.change(passwordInput, { target: { value: '123456' } })
    fireEvent.submit(form)

    expect(await screen.findByText('Email không hợp lệ.')).toBeInTheDocument()
  })

  it('shows error when login API fails', async () => {
    vi.spyOn(mockApi, 'login').mockRejectedValue(
      new Error('invalid_credentials'),
    )

    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const emailInput = screen.getByPlaceholderText('huy@example.com')
    const passwordInput = screen.getByPlaceholderText('Ít nhất 6 ký tự')
    const form = container.querySelector('form')!

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('sends one login request and uses the local account route', async () => {
    let finish!: (response: unknown) => void
    const login = vi.spyOn(mockApi, 'login').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    vi.spyOn(mockApi, 'getAddresses').mockResolvedValue([])
    const { container } = render(
      <MemoryRouter initialEntries={['/login?next=https://outside.example']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account" element={<h1>Tài khoản đã đăng nhập</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Ít nhất 6 ký tự'), {
      target: { value: 'password123' },
    })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(login).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('button', { name: 'Đang đăng nhập...' }),
    ).toBeDisabled()
    finish({
      access: 'test-access',
      refresh: 'test-refresh',
      user: { id: 'user-1', email: 'test@example.com' },
    })
    expect(
      await screen.findByRole('heading', { name: 'Tài khoản đã đăng nhập' }),
    ).toBeInTheDocument()
  })

  it('validates password mismatch on register', async () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const nameInput = screen.getByPlaceholderText('Nguyễn Văn A')
    const emailInput = screen.getByPlaceholderText('email@example.com')
    const passInput = screen.getByPlaceholderText('Ít nhất 8 ký tự')
    const confirmInput = screen.getByPlaceholderText('Khớp với mật khẩu trên')
    const form = container.querySelector('form')!

    fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn A' } })
    fireEvent.change(emailInput, { target: { value: 'a@example.com' } })
    fireEvent.change(passInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'mismatch123' } })
    fireEvent.submit(form)

    expect(
      await screen.findByText('Mật khẩu nhập lại không khớp.'),
    ).toBeInTheDocument()
  })

  it('blocks short registration passwords and displays Django field errors', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json(
        {
          password: [
            'Mật khẩu này quá phổ biến.',
            'Mật khẩu này hoàn toàn là số.',
          ],
        },
        { status: 400 },
      ),
    )
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </MemoryRouter>,
    )
    const form = container.querySelector('form')!
    const password = screen.getByPlaceholderText('Ít nhất 8 ký tự')
    const confirmation = screen.getByPlaceholderText('Khớp với mật khẩu trên')
    fireEvent.change(screen.getByLabelText('Họ và tên'), {
      target: { value: 'Nguyễn Văn A' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@example.com' },
    })
    fireEvent.change(password, { target: { value: '123456' } })
    fireEvent.change(confirmation, { target: { value: '123456' } })
    fireEvent.submit(form)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Mật khẩu phải có ít nhất 8 ký tự.',
    )
    expect(fetcher).not.toHaveBeenCalled()

    fireEvent.change(password, { target: { value: '12345678' } })
    fireEvent.change(confirmation, { target: { value: '12345678' } })
    fireEvent.submit(form)
    expect(
      await screen.findByText(
        'Mật khẩu này quá phổ biến. Mật khẩu này hoàn toàn là số.',
      ),
    ).toBeVisible()
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
