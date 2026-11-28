import { Heart } from 'lucide-react'
import { formatVnd } from '../utils/format'
import { Badge } from './Badge'
import { Link } from 'react-router-dom'

type ProductVariant = {
  id?: string
  unitPrice?: number
  sku: string
  size: string
  color: string
  stock: number
}

export type Product = {
  id: string
  name: string
  slug: string
  brand: string
  category: string
  description: string
  originalPrice: number
  salePrice: number
  inStock?: boolean
  rating: number
  reviewCount: number
  image: string
  images?: { id: string; url: string; alt: string; color?: string }[]
  badge: string
  variants: ProductVariant[]
}

export function ProductCard({ product }: { product: Product }) {
  const discount =
    product.originalPrice > product.salePrice
      ? Math.round((1 - product.salePrice / product.originalPrice) * 100)
      : 0
  const sizes = [...new Set(product.variants.map((variant) => variant.size))]

  return (
    <article className="product-card">
      <div className="product-card-media">
        {product.badge && (
          <Badge tone={discount > 0 ? 'accent' : 'neutral'}>
            {product.badge}
          </Badge>
        )}
        {discount > 0 && <Badge tone="danger">-{discount}%</Badge>}
        <button
          className="product-card-heart"
          type="button"
          aria-label={`Yêu thích ${product.name}`}
        >
          <Heart size={19} />
        </button>
        <img src={product.image} alt={product.name} />
      </div>
      <div className="product-card-body">
        <p className="product-card-brand">{product.brand}</p>
        <h3>{product.name}</h3>
        <div className="product-card-prices">
          <strong>{formatVnd(product.salePrice)}</strong>
          {discount > 0 && <s>{formatVnd(product.originalPrice)}</s>}
        </div>
        <div className="product-card-sizes" aria-label="Size nhanh">
          {sizes.slice(0, 5).map((size) => (
            <span key={size}>{size}</span>
          ))}
        </div>
        <Link className="product-card-action" to={`/products/${product.slug}`}>
          Xem sản phẩm
        </Link>
      </div>
    </article>
  )
}
