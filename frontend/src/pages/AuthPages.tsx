import { Eye, EyeOff } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pending = useRef(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending.current) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ.')
      return
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.')
      return
    }
    pending.current = true
    setLoading(true)
    setError('')
    try {
      if (await login(email, password)) {
        navigate('/account')
      } else {
        setError('Email hoặc mật khẩu không đúng.')
      }
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      pending.current = false
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <p className="eyebrow">QUANGHUY SPORT</p>
        <h1>
          Chào mừng
          <br />
          trở lại.
        </h1>
        <span>Đồ thể thao cho mọi sân chơi.</span>
      </section>
      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={submit}>
          <p className="eyebrow">Tài khoản</p>
          <h2>Đăng nhập</h2>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="huy@example.com"
            />
          </label>
          <label>
            Mật khẩu
            <div className="password-input">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ít nhất 6 ký tự"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          <Button size="lg" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
        </form>
      </section>
    </div>
  )
}

const registrationBanner = import.meta.glob<string>('../assets/*', {
  eager: true,
  import: 'default',
  query: '?url',
})['../assets/registration-football-boots.jpg']

const registrationPasswordMinLength = 8

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const pending = useRef(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending.current) return
    const normalizedEmail = email.trim()
    if (!name.trim()) setError('Vui lòng nhập họ tên.')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))
      setError('Email không hợp lệ.')
    else if (password.length < registrationPasswordMinLength)
      setError(
        `Mật khẩu phải có ít nhất ${registrationPasswordMinLength} ký tự.`,
      )
    else if (password !== confirm) setError('Mật khẩu nhập lại không khớp.')
    else {
      pending.current = true
      setLoading(true)
      setError('')
      try {
        await register(normalizedEmail, password, name.trim())
        navigate('/account')
      } catch (failure) {
        setError(
          failure instanceof Error && !(failure instanceof TypeError)
            ? failure.message
            : 'Không thể kết nối máy chủ. Vui lòng thử lại.',
        )
      } finally {
        pending.current = false
        setLoading(false)
      }
    }
  }

  return (
    <div className="auth-page">
      <section
        className="auth-visual auth-visual-alt"
        style={
          registrationBanner
            ? {
                backgroundImage: `linear-gradient(to top, rgb(0 0 0 / 90%), transparent 68%), url("${registrationBanner}")`,
              }
            : undefined
        }
      >
        <p className="eyebrow">QUANGHUY SPORT</p>
        <h1>
          Tạo tài khoản
          <br />
          cùng chúng tôi.
        </h1>
      </section>
      <section className="auth-form-panel">
        <form className="auth-form" onSubmit={submit}>
          <p className="eyebrow">Thành viên mới</p>
          <h2>Đăng ký</h2>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label>
            Họ và tên
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
            />
          </label>
          <label>
            Mật khẩu
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={`Ít nhất ${registrationPasswordMinLength} ký tự`}
            />
          </label>
          <label>
            Nhập lại mật khẩu
            <input
              required
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder="Khớp với mật khẩu trên"
            />
          </label>
          <Button size="lg" type="submit" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </Button>
          <p className="auth-switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </form>
      </section>
    </div>
  )
}

export function ForgotPasswordPage() {
  return (
    <div className="compact-auth-page">
      <section className="auth-form">
        <h2>Khôi phục tài khoản</h2>
        <p>Tính năng khôi phục mật khẩu chưa mở.</p>
        <Link className="auth-link" to="/login">
          Quay lại đăng nhập
        </Link>
      </section>
    </div>
  )
}

export const ResetPasswordPage = ForgotPasswordPage
