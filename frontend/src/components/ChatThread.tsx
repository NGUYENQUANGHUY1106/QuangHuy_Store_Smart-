import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'
import { ReviewAuthor } from './ReviewDetails'
import {
  type ChatProduct,
  type ChatProductSelection,
  type useProductChat,
} from '../context/useProductChat'
import { productImageUrl } from '../services/mockApi'
import { formatChatTime, formatVnd } from '../utils/format'

export type ChatAttachment = {
  selection: ChatProductSelection
  preview: ChatProduct
}

export function ChatProductCard({ product }: { product: ChatProduct }) {
  return (
    <Link className="chat-product" to={`/products/${product.slug}`}>
      <img src={productImageUrl(product.thumbnail)} alt="" />
      <span>
        <strong>{product.name}</strong>
        <small>{formatVnd(Number(product.price))}</small>
        {(product.color || product.size) && (
          <small>
            {[product.color, product.size && `Size ${product.size}`]
              .filter(Boolean)
              .join(' · ')}
          </small>
        )}
      </span>
    </Link>
  )
}

const statusLabel = { sent: 'Đã gửi', delivered: 'Đã nhận', read: 'Đã xem' }

export function ChatThread({
  chat,
  shop,
  visible,
  attachment,
  removeAttachment,
}: {
  chat: ReturnType<typeof useProductChat>
  shop: boolean
  visible: boolean
  attachment?: ChatAttachment
  removeAttachment?: () => void
}) {
  const [text, setText] = useState('')
  const messages = chat.snapshot.messages
  const conversation = chat.snapshot.conversation
  const pending = chat.pending.filter(
    (item) => item.conversation === conversation,
  )
  const list = useRef<HTMLDivElement>(null)
  const last = messages.at(-1)?.id
  const markRead = useEffectEvent(() => chat.markRead())
  const stopTyping = useEffectEvent(() => chat.signalTyping(false))

  useEffect(() => {
    if (!visible) {
      stopTyping()
      return
    }
    markRead()
    const readWhenVisible = () => markRead()
    document.addEventListener('visibilitychange', readWhenVisible)
    return () =>
      document.removeEventListener('visibilitychange', readWhenVisible)
  }, [visible, messages])

  useEffect(() => {
    if (visible && list.current)
      list.current.scrollTop = list.current.scrollHeight
  }, [visible, last, pending.length])

  function send(event: FormEvent) {
    event.preventDefault()
    if (chat.send(text, attachment?.selection, attachment?.preview)) {
      setText('')
      removeAttachment?.()
    }
  }

  return (
    <div className="chat-thread">
      {chat.status !== 'online' && (
        <p className="chat-notice" role="status">
          {chat.status === 'connecting'
            ? 'Đang kết nối…'
            : chat.status === 'denied'
              ? 'Tài khoản chưa có quyền quản lý tin nhắn.'
              : 'Mất kết nối. Đang thử kết nối lại…'}
        </p>
      )}
      {chat.error && (
        <p className="chat-notice" role="alert">
          {chat.error}
        </p>
      )}
      <div
        className="chat-messages"
        ref={list}
        role="log"
        aria-label="Tin nhắn"
      >
        {!messages.length && !pending.length && (
          <p className="chat-notice">
            Chưa có tin nhắn trong thời gian lưu tạm.
          </p>
        )}
        {messages.map((message) => (
          <article
            key={message.id}
            className={`chat-bubble${message.shop === shop ? ' own' : ''}`}
          >
            <ReviewAuthor
              name={message.author}
              fromShop={message.shop}
              avatarUrl={message.avatar_url}
            />
            {message.product && <ChatProductCard product={message.product} />}
            {message.body && <p>{message.body}</p>}
            <small>
              {formatChatTime(message.at)}
              {message.shop === shop && ` · ${statusLabel[message.status]}`}
            </small>
          </article>
        ))}
        {pending.map((entry) => (
          <article key={entry.client_id} className="chat-bubble own">
            {entry.preview && <ChatProductCard product={entry.preview} />}
            {entry.body && <p>{entry.body}</p>}
            <small>{entry.failed || 'Đang gửi…'}</small>
            {entry.failed && (
              <Button
                size="sm"
                type="button"
                variant="secondary"
                disabled={chat.status !== 'online'}
                onClick={() => chat.transmit(entry)}
              >
                Gửi lại
              </Button>
            )}
          </article>
        ))}
        {chat.typing && chat.typing === conversation && (
          <p className="chat-notice" role="status">
            <span className="chat-typing-dots" aria-hidden="true">
              ● ● ●
            </span>{' '}
            Đang nhập tin nhắn…
          </p>
        )}
      </div>
      <form className="chat-composer" onSubmit={send}>
        {attachment && (
          <div className="chat-composer-product">
            <ChatProductCard product={attachment.preview} />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={removeAttachment}
            >
              Bỏ sản phẩm
            </Button>
          </div>
        )}
        <label>
          Nội dung tin nhắn
          <textarea
            rows={2}
            maxLength={2000}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              chat.signalTyping(Boolean(event.target.value))
            }}
            onBlur={() => chat.signalTyping(false)}
            onKeyDown={(event) => {
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              )
                send(event)
            }}
          />
        </label>
        <Button
          type="submit"
          disabled={!conversation || (!text.trim() && !attachment)}
        >
          Gửi
        </Button>
      </form>
    </div>
  )
}
