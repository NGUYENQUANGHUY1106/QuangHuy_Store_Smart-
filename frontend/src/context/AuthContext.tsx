import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { mockApi } from '../services/mockApi'

export type UserAddress = {
  id: string
  receiver: string
  phone: string
  address: string
  isDefault: boolean
}

export type UserProfile = {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl?: string | null
  birthday?: string
  gender?: string
  role?: string
  capabilities?: string[]
  addresses: UserAddress[]
}

type AuthContextValue = {
  user: UserProfile | null
  login: (email: string, password: string) => Promise<boolean>
  register: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<void>
  logout: () => void
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
  updateAvatar: (file: File | null) => Promise<void>
  updateAddresses: (addresses: UserProfile['addresses']) => void
  refreshAddresses: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('qhs-user')
      return saved ? (JSON.parse(saved) as UserProfile) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) sessionStorage.setItem('qhs-user', JSON.stringify(user))
    else sessionStorage.removeItem('qhs-user')
  }, [user])

  useEffect(() => {
    for (const key of ['qhs-access-token', 'qhs-refresh-token', 'qhs-user']) {
      localStorage.removeItem(key)
    }
  }, [])

  const loadAddresses = async () => {
    try {
      const list = await mockApi.getAddresses()
      if (Array.isArray(list)) {
        return list.map((a: any) => ({
          id: a.id,
          receiver: a.receiver,
          phone: a.phone,
          address: a.street,
          isDefault: Boolean(a.is_default),
        }))
      }
    } catch {
      // Ignored
    }
    return null
  }

  useEffect(() => {
    const token =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('qhs-access-token')
        : null
    if (token) {
      mockApi
        .getMe()
        .then(async (me) => {
          if (me && me.id) {
            const addrs = await loadAddresses()
            setUser((current) => ({
              id: me.id,
              name: me.display_name || me.email,
              avatarUrl: me.avatar_url,
              email: me.email,
              phone: me.phone || '',
              birthday: me.birthday || '',
              gender: me.gender || '',
              role: me.role || 'CUSTOMER',
              capabilities: me.capabilities || [],
              addresses: addrs ?? current?.addresses ?? [],
            }))
          }
        })
        .catch(() => {})
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const result = await mockApi.login(email, password)
      if (!result?.access) return false
      sessionStorage.setItem('qhs-access-token', result.access)
      sessionStorage.setItem('qhs-refresh-token', result.refresh)
      const addrs = await loadAddresses()
      setUser({
        id: result.user.id,
        name: result.user.display_name || result.user.email,
        avatarUrl: result.user.avatar_url,
        email: result.user.email,
        phone: result.user.phone || '',
        birthday: result.user.birthday || '',
        gender: result.user.gender || '',
        role: result.user.role || 'CUSTOMER',
        capabilities: result.user.capabilities || [],
        addresses: addrs || [],
      })
      return true
    } catch {
      return false
    }
  }

  const register = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    const result = await mockApi.register(email, password, displayName)
    if (!result?.access) {
      throw new Error('Không thể tạo tài khoản. Vui lòng thử lại.')
    }
    sessionStorage.setItem('qhs-access-token', result.access)
    sessionStorage.setItem('qhs-refresh-token', result.refresh)
    setUser({
      id: result.user.id,
      name: result.user.display_name || result.user.email,
      avatarUrl: result.user.avatar_url,
      email: result.user.email,
      phone: result.user.phone || '',
      birthday: result.user.birthday || '',
      gender: result.user.gender || '',
      role: result.user.role || 'CUSTOMER',
      capabilities: result.user.capabilities || [],
      addresses: [],
    })
  }

  const logout = () => {
    mockApi.logout()
    setUser(null)
  }

  const updateProfile = async (profile: Partial<UserProfile>) => {
    const saved = await mockApi.updateProfile({
      display_name: profile.name,
      phone: profile.phone,
      birthday: profile.birthday || null,
      gender: profile.gender,
    })
    setUser((current) =>
      current && current.id === saved.id
        ? {
            ...current,
            name: saved.display_name,
            phone: saved.phone,
            birthday: saved.birthday ?? '',
            gender: saved.gender,
          }
        : current,
    )
  }

  const refreshAddresses = async () => {
    const addrs = await loadAddresses()
    if (!addrs) throw new Error('Không thể tải sổ địa chỉ.')
    setUser((current) =>
      current?.id === user?.id && current
        ? { ...current, addresses: addrs }
        : current,
    )
  }

  const updateAvatar = async (file: File | null) => {
    const saved = await mockApi.updateAvatar(file)
    if (!(
      saved?.avatar_url === null || typeof saved?.avatar_url === 'string'
    )) {
      throw new Error('Không thể cập nhật ảnh đại diện.')
    }
    setUser((current) =>
      current?.id === user?.id && current
        ? { ...current, avatarUrl: saved.avatar_url }
        : current,
    )
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      register,
      logout,
      updateProfile,
      updateAvatar,
      updateAddresses: (addresses) =>
        setUser((current) => (current ? { ...current, addresses } : current)),
      refreshAddresses,
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
