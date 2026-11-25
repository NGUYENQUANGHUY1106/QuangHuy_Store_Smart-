import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
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

const categoryPhotos: Partial<Record<string, string>> = {
  'bong-dung-cu': equipmentPhoto,
  'giay-bong-da': bootsPhoto,
  'phu-kien': accessoriesPhoto,
  'phu-kien-bong-da': footballAccessoriesPhoto,
  'quan-ao-the-thao': apparelPhoto,
}

const homeFootballBoots = import.meta.glob<string>('../assets/*', {
  eager: true,
  import: 'default',
  query: '?url',
})['../assets/home-football-boots.jpg']

export function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>()
  const [{ categories, brands }, setOptions] = useState<{
    categories: { id: string; slug: string; name: string }[]
    brands: { id: string; slug: string; name: string }[]
  }>({ categories: [], brands: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    mockApi
      .getPublicCatalogOptions()
      .then((options) => {
        if (active) setOptions(options)
      })
      .catch(() => {
        if (active) setError('Không thể tải danh mục.')
      })
    mockApi
      .getCatalogProducts()
      .then(({ products }) => {
        if (active) setFeaturedProducts(products.slice(0, 4))
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
            <Link to="/category/giay-bong-da">
              <Button size="lg">Mua giày bóng đá</Button>
            </Link>
            <Link to="/category/quan-ao-the-thao">
              <Button variant="secondary" size="lg">
                Xem trang phục
              </Button>
            </Link>
          </div>
        </div>
        {homeFootballBoots ? (
          <img
            className="hero-visual"
            src={homeFootballBoots}
            alt="Các mẫu giày bóng đá màu đỏ và đen"
            width={1080}
            height={1080}
            fetchPriority="high"
          />
        ) : (
          <div className="hero-visual hero-visual-fallback" aria-hidden="true">
            TF · FG · IC
          </div>
        )}
      </section>

      <section className="section-block category-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chọn theo nhu cầu</p>
            <h2>Danh mục nổi bật</h2>
          </div>
        </div>
        <div className="category-grid">
          {categories.map((category) => {
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

      <section className="section-block sport-blog">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Tin thể thao</p>
            <h2>Hướng dẫn & trải nghiệm</h2>
          </div>
        </div>
        <div className="blog-grid">
          <article>
            <span>01</span>
            <h3>Cách chọn giày theo mặt sân</h3>
            <p>
              FG, TF và IC — ba lựa chọn phù hợp với từng điều kiện thi đấu.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Size giày bền đẹp khi thi đấu</h3>
            <p>
              Đo bàn chân và chọn size chuẩn giúp nâng cao cảm giác kiểm soát
              bóng.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Góc nhìn bóng đá phong cách</h3>
            <p>Phối trang phục tập luyện năng động cho mọi buổi ra sân.</p>
          </article>
        </div>
      </section>
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
