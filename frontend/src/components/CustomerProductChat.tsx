import { MessageCircle, Minus, X } from 'lucide-react'
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProductChat } from '../context/useProductChat'
import { ChatThread, type ChatAttachment } from './ChatThread'
import { ReviewAuthor } from './ReviewDetails'
import { Button } from './Button'

const OpenChat = createContext<((attachment: ChatAttachment) => void) | null>(
  null,
)

export function CustomerProductChat({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  return user ? (
    <CustomerChatSession key={user.id} userId={user.id}>
      {children}
    </CustomerChatSession>
  ) : (
    children
  )
}

function CustomerChatSession({
  userId,
  children,
}: {
  userId: string
  children: ReactNode
}) {
  const chat = useProductChat(userId)
  const [mode, setMode] = useState<'closed' | 'open' | 'minimized'>('closed')
  const [attachment, setAttachment] = useState<ChatAttachment>()
  const { pathname } = useLocation()
  const display = !pathname.startsWith('/admin') && mode !== 'closed'
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (display && mode === 'open') closeButton.current?.focus()
  }, [display, mode])
  const open = (product: ChatAttachment) => {
    setAttachment(product)
    setMode('open')
  }
  return (
    <OpenChat.Provider value={open}>
      {children}
      {display && mode === 'minimized' && (
        <Button
          className="chat-minimized"
          type="button"
          onClick={() => setMode('open')}
        >
          <MessageCircle size={18} /> Mở chat
        </Button>
      )}
      <section
        className="chat-popup"
        aria-label="Trò chuyện với cửa hàng"
        role="dialog"
        hidden={!display || mode !== 'open'}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setMode('closed')
        }}
      >
        <header className="chat-header">
          <div>
            <ReviewAuthor name="Chủ shop" fromShop />
            <small>
              {chat.status === 'online'
                ? chat.snapshot.shop_online
                  ? 'Đang hoạt động'
                  : 'Ngoại tuyến'
                : 'Chưa kết nối'}
            </small>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Thu nhỏ chat"
            onClick={() => setMode('minimized')}
          >
            <Minus size={20} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Đóng chat"
            ref={closeButton}
            onClick={() => setMode('closed')}
          >
            <X size={20} />
          </button>
        </header>
        <ChatThread
          chat={chat}
          shop={false}
          visible={display && mode === 'open'}
          attachment={attachment}
          removeAttachment={() => setAttachment(undefined)}
        />
      </section>
    </OpenChat.Provider>
  )
}

export function ProductChatButton({
  attachment,
}: {
  attachment: ChatAttachment
}) {
  const open = useContext(OpenChat)
  const location = useLocation()
  const navigate = useNavigate()
  const reopen = useEffectEvent(() => {
    open?.(location.state?.chatAttachment ?? attachment)
    navigate(location.pathname + location.search, { replace: true })
  })
  useEffect(() => {
    if (open && location.hash === '#chat') {
      reopen()
    }
  }, [location.hash, open])
  return (
    <div className="product-chat-action">
      {open ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() => open(attachment)}
        >
          <MessageCircle size={18} /> Chat về sản phẩm
        </Button>
      ) : (
        <Link
          className="button button-secondary"
          to="/login"
          state={{
            returnTo: `${location.pathname}#chat`,
            chatAttachment: attachment,
          }}
        >
          <MessageCircle size={18} /> Chat về sản phẩm
        </Link>
      )}
    </div>
  )
}
