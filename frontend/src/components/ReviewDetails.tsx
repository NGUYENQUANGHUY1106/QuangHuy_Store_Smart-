import { productImageUrl } from '../services/mockApi'
import { useState } from 'react'

export type ReviewReply = {
  id: number
  author: string
  body: string
  from_shop: boolean
  avatar_url?: string | null
}

export type ProductReview = Omit<ReviewReply, 'from_shop'> & {
  rating: number
  created_at: string
  product_name: string
  thumbnail: string | null
  size: string
  color: string
  replies: ReviewReply[]
}

export function ProfileAvatar({
  name,
  url,
  large = false,
}: {
  name: string
  url?: string | null
  large?: boolean
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((word) => word.charAt(0))
    .join('')
  const [failed, setFailed] = useState<string>()
  return (
    <span className={`user-avatar${large ? ' large' : ''}`} aria-hidden="true">
      {url && failed !== url ? (
        <img src={productImageUrl(url)} alt="" onError={() => setFailed(url)} />
      ) : (
        initials
      )}
    </span>
  )
}

export function ReviewAuthor({
  name,
  fromShop = false,
  avatarUrl,
}: {
  name: string
  fromShop?: boolean
  avatarUrl?: string | null
}) {
  return (
    <span className={`review-author${fromShop ? ' shop-author' : ''}`}>
      <ProfileAvatar
        name={fromShop ? 'Q H' : name}
        url={fromShop ? undefined : avatarUrl}
      />
      <strong>{fromShop ? 'Chủ shop' : name}</strong>
    </span>
  )
}

export function ReviewProduct({ review }: { review: ProductReview }) {
  return (
    <div className="review-product">
      <img src={productImageUrl(review.thumbnail)} alt="" loading="lazy" />
      <div>
        <strong>{review.product_name}</strong>
        <small>
          Màu {review.color} · Size {review.size}
        </small>
      </div>
    </div>
  )
}

export function ReviewReplies({ replies }: { replies: ReviewReply[] }) {
  if (!replies.length) return null
  return (
    <ul className="review-replies">
      {replies.map((reply) => (
        <li key={reply.id}>
          <ReviewAuthor
            name={reply.author}
            fromShop={reply.from_shop}
            avatarUrl={reply.avatar_url}
          />
          <p>{reply.body}</p>
        </li>
      ))}
    </ul>
  )
}
