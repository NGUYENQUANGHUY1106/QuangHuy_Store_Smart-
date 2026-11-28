import { Check, Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mockApi } from '../services/mockApi'
import { useCart } from '../context/CartContext'
import { formatVnd } from '../utils/format'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'
import { type Product } from '../components/ProductCard'
import { ProductReviews } from './ProductReviews'
import { ProductChatButton } from '../components/CustomerProductChat'

export function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem, busy } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [photo, setPhoto] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!slug) return
    let active = true
    setLoading(true)
    setLoadError('')
    mockApi
      .getCatalogProduct(slug)
      .then((result: Product) => {
        if (!active) return
        setProduct(result)
        setPhoto('')
        setSelectedSize('')
        setQuantity(1)
        setSelectedColor(
          result.images?.find((image) => image.color)?.color ??
            result.variants[0]?.color ??
            '',
        )
      })
      .catch((error) => {
        if (active)
          setLoadError(
            error instanceof Error ? error.message : 'Không thể tải sản phẩm',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return (
      <section className="empty-state">
        <h1>Đang tải sản phẩm</h1>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="empty-state" role="alert">
        <h1>Không thể tải sản phẩm</h1>
        <p>{loadError}</p>
        <Button onClick={() => navigate('/search')}>Về trang tìm kiếm</Button>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="empty-state">
        <h1>Không tìm thấy sản phẩm</h1>
        <Button onClick={() => navigate('/search')}>Về trang tìm kiếm</Button>
      </section>
    )
  }

  const colors = [...new Set(product.variants.map((variant) => variant.color))]
  const sizes = [...new Set(product.variants.map((variant) => variant.size))]
  const selectedVariant = product.variants.find(
    (variant) =>
      variant.color === selectedColor && variant.size === selectedSize,
  )
  const photos = [
    ...(product.images ?? []).filter((image) => image.color === selectedColor),
    ...(product.images ?? []).filter(
      (image) => !image.color && image.color !== selectedColor,
    ),
  ]
  const currentImage = photos.find((image) => image.url === photo)
  const colorPrices = product.variants
    .filter((variant) => variant.color === selectedColor)
    .map((variant) => variant.unitPrice ?? product.salePrice)
  const mainImage =
    currentImage?.url ||
    photos[0]?.url ||
    (product.images?.some((image) => image.color) ? undefined : product.image)

  const addToCart = async () => {
    if (!selectedVariant || selectedVariant.stock === 0) {
      setMessage('Vui lòng chọn màu và size còn hàng.')
      return
    }
    try {
      await addItem(product, selectedVariant, quantity)
      setMessage(`Đã thêm ${quantity} sản phẩm vào giỏ hàng.`)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Không thể thêm sản phẩm vào giỏ hàng.',
      )
    }
  }

  const buyNow = () => {
    if (!selectedVariant?.id || quantity > selectedVariant.stock) {
      setMessage('Vui lòng chọn màu, size và số lượng còn hàng.')
      return
    }
    const selection = new URLSearchParams({
      product: product.slug,
      variant: selectedVariant.id,
      qty: String(quantity),
    })
    navigate(`/checkout?${selection}`)
  }

  return (
    <div className="product-detail-page">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', href: '/' },
          { label: product.category, href: '/search' },
          { label: product.name },
        ]}
      />
      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="product-main-image">
            {mainImage ? (
              <img
                src={mainImage}
                alt={currentImage?.alt || photos[0]?.alt || product.name}
              />
            ) : (
              <p>Chưa có ảnh cho phối màu này.</p>
            )}
          </div>
          <div className="product-thumbnails">
            {photos.map((image, index) => (
              <button
                key={image.id}
                type="button"
                aria-pressed={image.url === mainImage}
                aria-label={image.alt || `Ảnh sản phẩm ${index + 1}`}
                onClick={() => setPhoto(image.url)}
              >
                <img src={image.url} alt="" />
              </button>
            ))}
          </div>
        </div>

        <section className="product-info">
          <p className="product-card-brand">{product.brand}</p>
          <h1>{product.name}</h1>
          <div className="product-detail-prices">
            <strong>
              {formatVnd(selectedVariant?.unitPrice ?? product.salePrice)}
            </strong>
            {product.originalPrice > product.salePrice && (
              <s>{formatVnd(product.originalPrice)}</s>
            )}
          </div>

          <fieldset className="variant-section">
            <legend>
              Màu sắc: <strong>{selectedColor}</strong>
            </legend>
            <div className="color-options">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={selectedColor === color ? 'active' : ''}
                  onClick={() => {
                    setSelectedColor(color)
                    setPhoto('')
                    setSelectedSize('')
                    setMessage('')
                  }}
                  aria-label={`Chọn màu ${color}`}
                >
                  {selectedColor === color && <Check size={15} />}
                  {color}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="variant-section">
            <legend>
              Size: <strong>{selectedSize || 'Chọn size'}</strong>
            </legend>
            <div className="size-options">
              {sizes.map((size) => {
                const variant = product.variants.find(
                  (item) => item.color === selectedColor && item.size === size,
                )
                const out = !variant || variant.stock === 0
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={out}
                    aria-pressed={selectedSize === size}
                    className={selectedSize === size ? 'active' : ''}
                    onClick={() => {
                      setSelectedSize(size)
                      setMessage('')
                    }}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            {selectedVariant && (
              <p className="stock-status">
                SKU {selectedVariant.sku} · Còn {selectedVariant.stock} sản phẩm
              </p>
            )}
          </fieldset>

          <div className="add-cart-row">
            <div className="quantity-control">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                aria-label="Giảm số lượng"
              >
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                aria-label="Tăng số lượng"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="product-purchase-actions">
              <Button
                size="lg"
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={addToCart}
              >
                Thêm vào giỏ
              </Button>
              <Button size="lg" type="button" onClick={buyNow}>
                Mua ngay
              </Button>
            </div>
          </div>
          <ProductChatButton
            attachment={{
              selection: {
                product_id: product.id,
                variant_id: selectedVariant?.id,
                color: selectedColor || undefined,
              },
              preview: {
                id: product.id,
                slug: product.slug,
                name: product.name,
                thumbnail: photos[0]?.url ?? mainImage ?? null,
                price: String(
                  selectedVariant?.unitPrice ??
                    (colorPrices.length
                      ? Math.min(...colorPrices)
                      : product.salePrice),
                ),
                color: selectedColor,
                size: selectedSize || null,
              },
            }}
          />
          {message && (
            <p className="variant-message" role="status">
              {message}
            </p>
          )}
        </section>
      </div>

      <section className="product-tabs">
        <h2>Mô tả</h2>
        <p className="product-description">
          {product.description || 'Chưa có mô tả.'}
        </p>
        <p>Chưa có hướng dẫn size</p>
      </section>
      <ProductReviews key={product.slug} slug={product.slug} />
    </div>
  )
}
