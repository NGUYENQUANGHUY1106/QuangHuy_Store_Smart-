import { ArrowRight } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import equipmentPhoto from '../assets/home-categories/bong-dung-cu.webp'
import bootsPhoto from '../assets/home-categories/giay-bong-da.webp'
import footballAccessoriesPhoto from '../assets/home-categories/phu-kien-bong-da.webp'
import accessoriesPhoto from '../assets/home-categories/phu-kien.webp'
import apparelPhoto from '../assets/home-categories/quan-ao-the-thao.webp'
import { mockApi } from '../services/mockApi.js'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ProductCard, type Product } from '../components/ProductCard'
import type { CatalogCategory } from '../components/home/showcaseCatalog'
import '../components/home/showcase.css'

const CircularBootShowcase = lazy(() =>
  import('../components/home/CircularBootShowcase').then(
    ({ CircularBootShowcase: component }) => ({ default: component }),
  ),
)
const InteractiveShoeCabinet = lazy(() =>
  import('../components/home/InteractiveShoeCabinet').then(
    ({ InteractiveShoeCabinet: component }) => ({ default: component }),
  ),
)

const categoryPhotos: Partial<Record<string, string>> = {
  'bong-dung-cu': equipmentPhoto,
  'giay-bong-da': bootsPhoto,
  'phu-kien': accessoriesPhoto,
  'phu-kien-bong-da': footballAccessoriesPhoto,
  'quan-ao-the-thao': apparelPhoto,
}

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>()
  const [{ categories, brands }, setOptions] = useState<{
    categories?: CatalogCategory[]
    brands: { id: string; slug: string; name: string }[]
  }>({ brands: [] })
  const [catalogError, setCatalogError] = useState(false)
  const [catalogAttempt, setCatalogAttempt] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    mockApi
      .getPublicCatalogOptions(true)
      .then((options) => {
        if (active) setOptions(options)
      })
      .catch(() => {
        if (active) setCatalogError(true)
      })
    return () => {
      active = false
    }
  }, [catalogAttempt])

  useEffect(() => {
    let active = true
    mockApi
      .getCatalogProducts({ page_size: 4 })
      .then(({ products }) => {
        if (active) setFeaturedProducts(products)
      })
      .catch(() => {
        if (active) setError('Không thể tải sản phẩm.')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <Badge tone="accent">Mùa giải 2026</Badge>
          <h1>
            Bứt tốc.
            <br />
            Chinh phục sân cỏ.
          </h1>
          <p>Bộ sưu tập giày bóng đá và trang phục thể thao mới nhất.</p>
          <div className="hero-actions">
            <Link
              className="button button-primary button-lg"
              to="/category/giay-bong-da"
            >
              Mua giày bóng đá
            </Link>
            <Link
              className="button button-secondary button-lg"
              to="/category/quan-ao-the-thao"
            >
              Xem trang phục
            </Link>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="boot-showcase">
              <div className="boot-orbit-stage">
                <p className="boot-loading" role="status">
                  Đang tải giày bóng đá…
                </p>
              </div>
              <div className="boot-showcase-footer" />
            </div>
          }
        >
          <CircularBootShowcase />
        </Suspense>
      </section>

      <section className="section-block category-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chọn theo nhu cầu</p>
            <h2>Danh mục nổi bật</h2>
          </div>
        </div>
        <div className="category-grid">
          {categories?.map((category) => {
            const photo = categoryPhotos[category.slug]
            return (
              <Link
                className="category-card"
                key={category.id}
                to={`/category/${category.slug}`}
              >
                {photo && (
                  <img
                    className="category-card-photo"
                    src={photo}
                    alt=""
                    width={627}
                    height={418}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <h3>{category.name}</h3>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Được chọn cho bạn</p>
            <h2>Sản phẩm nổi bật</h2>
          </div>
          <Link className="text-link" to="/search">
            Xem tất cả <ArrowRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {featuredProducts?.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        {!featuredProducts && !error && <p role="status">Đang tải sản phẩm…</p>}
        {featuredProducts?.length === 0 && <p>Chưa có sản phẩm đang bán.</p>}
      </section>

      <section className="section-block promotion-section">
        <div className="promotion-banner">
          <div>
            <h2>Khám phá bộ sưu tập</h2>
            <Link to="/search?sort=priceAsc">
              <Button variant="secondary" size="lg">
                Mua ngay
              </Button>
            </Link>
          </div>
          <strong>2026</strong>
        </div>
      </section>

      <Suspense
        fallback={
          <section className="section-block cabinet-section">
            <div className="cabinet-frame">
              <div className="cabinet-shelves">
                <p className="cabinet-state" role="status">
                  Đang tải tủ trưng bày…
                </p>
              </div>
            </div>
          </section>
        }
      >
        <InteractiveShoeCabinet
          categories={categories}
          catalogError={catalogError}
          retryCatalog={() => {
            setCatalogError(false)
            setCatalogAttempt(catalogAttempt + 1)
          }}
        />
      </Suspense>
      <section className="section-block brand-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Thương hiệu đối tác</p>
            <h2>Đồng hành cùng đội bóng</h2>
          </div>
          <Link className="text-link" to="/brands">
            Xem thương hiệu <ArrowRight size={17} />
          </Link>
        </div>
        <div className="brand-grid">
          {brands.map((brand) => (
            <Link key={brand.id} to={`/search?brand=${brand.slug}`}>
              <strong>{brand.name}</strong>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
