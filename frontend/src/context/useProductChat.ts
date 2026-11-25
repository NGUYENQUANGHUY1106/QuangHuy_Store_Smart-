import { useEffect, useRef, useState } from 'react'
import { mockApi } from '../services/mockApi'

export type ChatProductSelection = {
  product_id: string
  variant_id?: string
  color?: string
}
export type ChatProduct = {
  id: string
  slug: string
  name: string
  thumbnail: string | null
  price: string
  color?: string | null
  size?: string | null
}
export type ChatMessage = {
  id: string
  client_id: string
  conversation: string
  author: string
  avatar_url?: string | null
  shop: boolean
  body: string
  product: ChatProduct | null
  at: string
  status: 'sent' | 'delivered' | 'read'
}
export type ChatCustomer = {
  id: string
  name: string
  email: string
  phone: string
  avatar_url?: string | null
}
export type InboxEntry = {
  customer: ChatCustomer
  preview: string
  at: string
  online: boolean
  unread: number
}
type Snapshot = {
  conversation: string
  messages: ChatMessage[]
  inbox: InboxEntry[]
  shop_online: boolean
}
type Pending = {
  client_id: string
  conversation: string
  body: string
  product?: ChatProductSelection
  preview?: ChatProduct
  failed?: string
}
const initial: Snapshot = {
  conversation: '',
  messages: [],
  inbox: [],
  shop_online: false,
}

export function useProductChat(userId: string | undefined, shop = false) {
  const [status, setStatus] = useState<
    'connecting' | 'online' | 'offline' | 'denied'
  >('connecting')
  const [snapshot, setSnapshot] = useState(initial)
  const [pending, setPending] = useState<Pending[]>([])
  const [typing, setTyping] = useState('')
  const [error, setError] = useState('')
  const socket = useRef<WebSocket>(null)
  const desired = useRef('')
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const lastTyping = useRef(0)

  useEffect(() => {
    if (!userId || !sessionStorage.getItem('qhs-access-token')) return
    let disposed = false
    let reconnect: ReturnType<typeof setTimeout>
    let typingTimeout: ReturnType<typeof setTimeout>
    let attempt = 0
    const messageTimers = timers.current
    desired.current = ''

    function connect() {
      if (disposed) return
      setStatus('connecting')
      const base = new URL(
        import.meta.env.VITE_API_ORIGIN || 'http://127.0.0.1:8000',
      )
      base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:'
      base.pathname = shop ? '/ws/admin/product-chat' : '/ws/product-chat'
      const current = new WebSocket(base)
      socket.current = current
      current.onopen = () => {
        current.send(
          JSON.stringify({
            event: 'auth',
            token: sessionStorage.getItem('qhs-access-token'),
          }),
        )
      }
      current.onmessage = ({ data }) => {
        if (disposed) return
        const payload = JSON.parse(data)
        if (payload.event === 'snapshot') {
          setStatus('online')
          attempt = 0
          setSnapshot(payload)
          const acknowledged = new Set(
            (payload.messages as ChatMessage[]).map(
              (message) => message.client_id,
            ),
          )
          setPending((rows) =>
            rows.filter((row) => !acknowledged.has(row.client_id)),
          )
          if (
            shop &&
            !payload.conversation &&
            desired.current &&
            (payload.inbox as InboxEntry[]).some(
              (entry) => entry.customer.id === desired.current,
            )
          ) {
            current.send(
              JSON.stringify({
                event: 'conversation.join',
                conversation: desired.current,
              }),
            )
          }
        } else if (
          payload.event === 'message.ack' ||
          payload.event === 'error'
        ) {
          const id = payload.message?.client_id ?? payload.client_id
          clearTimeout(messageTimers.get(id))
          messageTimers.delete(id)
          if (payload.event === 'message.ack') {
            const message: ChatMessage = payload.message
            setPending((rows) => rows.filter((row) => row.client_id !== id))
            setSnapshot((state) =>
              state.conversation === message.conversation &&
              !state.messages.some((row) => row.id === message.id)
                ? { ...state, messages: [...state.messages, message] }
                : state,
            )
          } else if (id) {
            setPending((rows) =>
              rows.map((row) =>
                row.client_id === id ? { ...row, failed: payload.detail } : row,
              ),
            )
          } else {
            setError(payload.detail)
          }
        } else if (payload.event === 'typing.update') {
          clearTimeout(typingTimeout)
          setTyping(payload.active ? payload.conversation : '')
          if (payload.active)
            typingTimeout = setTimeout(() => setTyping(''), 4500)
        }
      }
      current.onclose = async ({ code }) => {
        if (disposed) return
        setStatus(code === 4403 ? 'denied' : 'offline')
        setTyping('')
        setPending((rows) =>
          rows.map((row) => ({ ...row, failed: 'Mất kết nối.' })),
        )
        for (const timer of messageTimers.values()) clearTimeout(timer)
        messageTimers.clear()
        if (code === 4403) return
        if (code === 4401) {
          try {
            await mockApi.getMe()
          } catch {
            return
          }
        }
        if (!disposed)
          reconnect = setTimeout(connect, Math.min(10000, 500 * 2 ** attempt++))
      }
    }
    reconnect = setTimeout(connect, 0)
    return () => {
      disposed = true
      clearTimeout(reconnect)
      clearTimeout(typingTimeout)
      for (const timer of messageTimers.values()) clearTimeout(timer)
      messageTimers.clear()
      socket.current?.close()
      socket.current = null
    }
  }, [userId, shop])

  function emit(event: object) {
    if (status !== 'online' || socket.current?.readyState !== WebSocket.OPEN)
      return false
    socket.current.send(JSON.stringify(event))
    return true
  }

  function join(conversation: string) {
    desired.current = conversation
    setTyping('')
    setError('')
    emit({ event: 'conversation.join', conversation })
  }

  function transmit(record: Pending) {
    const sent = emit({
      event: 'message.send',
      conversation: record.conversation,
      client_id: record.client_id,
      body: record.body,
      product: record.product,
    })
    setPending((rows) => [
      ...rows.filter((row) => row.client_id !== record.client_id),
      {
        ...record,
        failed: sent ? undefined : 'Mất kết nối.',
      },
    ])
    if (sent) {
      clearTimeout(timers.current.get(record.client_id))
      timers.current.set(
        record.client_id,
        setTimeout(() => {
          timers.current.delete(record.client_id)
          setPending((rows) =>
            rows.map((row) =>
              row.client_id === record.client_id
                ? { ...row, failed: 'Chưa nhận được xác nhận.' }
                : row,
            ),
          )
        }, 8000),
      )
    }
  }

  function send(
    body: string,
    product?: ChatProductSelection,
    preview?: ChatProduct,
  ) {
    if (!snapshot.conversation || (!body.trim() && !product)) return false
    transmit({
      conversation: snapshot.conversation,
      client_id: crypto.randomUUID(),
      body,
      product,
      preview,
    })
    return true
  }

  function signalTyping(active: boolean) {
    const now = Date.now()
    if (active && now - lastTyping.current < 1500) return
    lastTyping.current = active ? now : 0
    emit({
      event: active ? 'typing.start' : 'typing.stop',
      conversation: snapshot.conversation,
    })
  }

  useEffect(() => {
    if (status !== 'online') return
    const incoming = snapshot.messages.filter(
      (message) => message.shop !== shop && message.status === 'sent',
    )
    if (incoming.length && socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({
          event: 'message.delivered',
          conversation: snapshot.conversation,
          ids: incoming.map((message) => message.id),
        }),
      )
    }
  }, [snapshot, status, shop])

  function markRead() {
    if (document.visibilityState !== 'visible') return
    const unread = snapshot.messages.filter(
      (message) => message.shop !== shop && message.status !== 'read',
    )
    if (unread.length)
      emit({
        event: 'message.read',
        conversation: snapshot.conversation,
        ids: unread.map((message) => message.id),
      })
  }
  return {
    status,
    snapshot,
    pending,
    typing,
    error,
    join,
    send,
    transmit,
    signalTyping,
    markRead,
  }
}
