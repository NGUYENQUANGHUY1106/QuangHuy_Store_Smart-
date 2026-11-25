import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ReviewAuthor } from '../components/ReviewDetails'
import { ChatProductCard, ChatThread } from '../components/ChatThread'
import type { useProductChat } from '../context/useProductChat'
import { formatChatTime } from '../utils/format'

export function AdminMessagesPage() {
  const chat = useOutletContext<ReturnType<typeof useProductChat>>()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [requested, setRequested] = useState('')
  const { inbox, conversation, messages } = chat.snapshot
  const active = inbox.find((row) => row.customer.id === conversation)
  const rows = inbox.filter(
    (row) =>
      row.customer.name
        .toLocaleLowerCase('vi')
        .includes(search.trim().toLocaleLowerCase('vi')) &&
      (filter === 'all' || (filter === 'unread' ? row.unread > 0 : row.online)),
  )
  const products = [
    ...new Map(
      messages.flatMap((message) =>
        message.product ? [[message.product.id, message.product] as const] : [],
      ),
    ).values(),
  ]
  return (
    <section className="admin-messages">
      <h1>Tin nhắn</h1>
      {chat.status !== 'online' && (
        <p role="status">
          {chat.status === 'connecting'
            ? 'Đang kết nối…'
            : chat.status === 'denied'
              ? 'Tài khoản chưa có quyền quản lý tin nhắn.'
              : 'Mất kết nối. Đang thử kết nối lại…'}
        </p>
      )}
      {chat.error && <p role="alert">{chat.error}</p>}
      <div className="admin-chat-layout">
        <aside
          className="admin-chat-inbox"
          aria-label="Danh sách cuộc trò chuyện"
        >
          <label>
            Tìm theo tên
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label>
            Hiển thị
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Tất cả tin nhắn</option>
              <option value="unread">Chưa đọc</option>
              <option value="online">Đang hoạt động</option>
            </select>
          </label>
          {rows.length === 0 && <p>Không có cuộc trò chuyện phù hợp.</p>}
          <ul className="admin-chat-list">
            {rows.map((row) => (
              <li key={row.customer.id}>
                <button
                  type="button"
                  className={row.unread ? 'unread' : ''}
                  aria-pressed={
                    conversation === row.customer.id && requested !== 'closed'
                  }
                  onClick={() => {
                    setRequested(row.customer.id)
                    chat.join(row.customer.id)
                  }}
                >
                  <ReviewAuthor
                    name={row.customer.name}
                    avatarUrl={row.customer.avatar_url}
                  />
                  <span className="chat-list-preview">{row.preview}</span>
                  <small>
                    {formatChatTime(row.at)} ·{' '}
                    {row.online ? 'Đang hoạt động' : 'Ngoại tuyến'}
                  </small>
                  {row.unread > 0 && (
                    <span className="chat-badge">{row.unread} chưa đọc</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="admin-chat-main">
          {active &&
          requested !== 'closed' &&
          (!requested || requested === active.customer.id) ? (
            <>
              <header className="chat-header">
                <ReviewAuthor
                  name={active.customer.name}
                  avatarUrl={active.customer.avatar_url}
                />
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setRequested('closed')}
                >
                  Đóng cuộc trò chuyện
                </button>
              </header>
              <ChatThread key={conversation} chat={chat} shop visible />
            </>
          ) : (
            <p className="chat-notice">
              Chọn một cuộc trò chuyện để xem tin nhắn.
            </p>
          )}
        </div>
        {active &&
          requested !== 'closed' &&
          (!requested || requested === active.customer.id) && (
            <details className="admin-chat-customer" open>
              <summary>Thông tin khách hàng</summary>
              <ReviewAuthor
                name={active.customer.name}
                avatarUrl={active.customer.avatar_url}
              />
              <p>{active.customer.email}</p>
              {active.customer.phone && <p>{active.customer.phone}</p>}
              <p>{active.online ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
              <h2>Sản phẩm đã gửi</h2>
              {products.length ? (
                products.map((product) => (
                  <ChatProductCard key={product.id} product={product} />
                ))
              ) : (
                <p>Chưa có sản phẩm đính kèm.</p>
              )}
            </details>
          )}
      </div>
    </section>
  )
}
