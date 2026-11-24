import { Filter, Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { Button } from '../components/Button'
import { ProductCard, type Product } from '../components/ProductCard'
import { Modal } from '../components/Modal'
import { mockApi } from '../services/mockApi'

type Option = { id: string; slug: string; name: string }

export function CatalogPage({ categorySlug }: { categorySlug?: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)
  const categoryParam = searchParams.get('category') ?? categorySlug ?? ''
  const brandParam = searchParams.get('brand') ?? ''
  const sizeParam = searchParams.get('size') ?? ''
  const query = searchParams.get('q') ?? ''
  const minPrice = Number(searchParams.get('min') ?? 0)
  const maxPrice = Number(searchParams.get('max') ?? 10000000)
  const sort = searchParams.get('sort') ?? 'newest'
  const [apiProducts, setApiProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const [count, setCount] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [retry, setRetry] = useState(0)
  const [{ categories, brands }, setOptions] = useState<{
    categories: Option[]
    brands: Option[]
  }>({ categories: [], brands: [] })
  useEffect(() => {
    let active = true
    mockApi
      .getPublicCatalogOptions()
      .then((options) => {
        if (active) setOptions(options)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setApiError('')
    mockApi
      .getCatalogProducts({
        page,
        q: query,
        category: categoryParam,
        brand: brandParam,
        size: sizeParam,
        min_price: minPrice || undefined,
        max_price: maxPrice === 10000000 ? undefined : maxPrice,
        sort:
          sort === 'priceAsc'
            ? 'price'
            : sort === 'priceDesc'
              ? '-price'
              : 'newest',
      })
      .then((result) => {
        if (active) {
          setApiProducts(result.products)
          setCount(result.count)
          setHasNext(result.hasNext)
        }
      })
      .catch((error) => {
        if (active)
          setApiError(
            error instanceof Error ? error.message : 'Không thể tải sản phẩm',
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [
    categoryParam,
    brandParam,
    sizeParam,
    query,
    minPrice,
    maxPrice,
    sort,
    page,
    retry,
  ])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (key !== 'page') next.delete('page')
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  const clearFilters = () => setSearchParams({})

  const categoryName = categories.find(
    (item) => item.slug === categoryParam,
  )?.name
  const title =
    categoryName ?? (query ? `Kết quả cho "${query}"` : 'Tất cả sản phẩm')

  const filterControls = (
    <div className="catalog-filter-controls">
      <label>
        Danh mục
        <select
          value={categoryParam}
          onChange={(event) => {
            updateParam('category', event.target.value)
          }}
        >
          <option value="">Tất cả</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Thương hiệu
        <select
          value={brandParam}
          onChange={(event) => updateParam('brand', event.target.value)}
        >
          <option value="">Tất cả</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.slug}>
              {brand.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Khoảng giá</legend>
        <div className="price-range">
          <input
            type="number"
            value={minPrice || ''}
            placeholder="Từ"
            onChange={(event) => updateParam('min', event.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            value={maxPrice === 10000000 ? '' : maxPrice}
            placeholder="Đến"
            onChange={(event) => updateParam('max', event.target.value)}
          />
        </div>
      </fieldset>
      <fieldset>
        <legend>Size</legend>
        <div className="filter-sizes">
          {(categoryName === 'Quần áo thể thao'
            ? ['S', 'M', 'L', 'XL']
            : ['39', '40', '41', '42', '43', '44', 'S', 'M', 'L', 'XL']
          ).map((size) => (
            <button
              key={size}
              type="button"
              className={sizeParam === size ? 'active' : ''}
              onClick={() =>
                updateParam('size', sizeParam === size ? '' : size)
              }
            >
              {size}
            </button>
          ))}
        </div>
      </fieldset>
      <Button variant="ghost" type="button" onClick={clearFilters}>
        Xóa bộ lọc
      </Button>
    </div>
  )

  return (
    <div className="catalog-page">
      <Breadcrumb
        items={[{ label: 'Trang chủ', href: '/' }, { label: title }]}
      />
      <header className="catalog-header">
        <div>
          <p className="eyebrow">QuangHuy Sport</p>
          <h1>{title}</h1>
        </div>
        <div className="catalog-tools">
          <label className="catalog-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => updateParam('q', event.target.value)}
              placeholder="Tìm sản phẩm..."
            />
          </label>
          <select
            className="catalog-sort"
            value={sort}
            onChange={(event) => updateParam('sort', event.target.value)}
            aria-label="Sắp xếp"
          >
            <option value="newest">Mới nhất</option>
            <option value="priceAsc">Giá tăng dần</option>
            <option value="priceDesc">Giá giảm dần</option>
          </select>
          <button
            className="mobile-filter-button"
            type="button"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal size={18} /> Bộ lọc
          </button>
        </div>
      </header>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">{filterControls}</aside>
        <div>
          <p className="catalog-count">{count} sản phẩm</p>
          {loading ? (
            <section className="empty-state">
              <h2>Đang tải sản phẩm</h2>
            </section>
          ) : apiError ? (
            <section className="empty-state" role="alert">
              <h2>Không thể tải dữ liệu</h2>
              <p>{apiError}</p>
              <Button type="button" onClick={() => setRetry(retry + 1)}>
                Thử lại
              </Button>
            </section>
          ) : apiProducts.length > 0 ? (
            <div className="product-grid catalog-grid">
              {apiProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <section className="empty-state">
              <Filter size={32} />
              <h2>Không tìm thấy sản phẩm</h2>
              <p>Thử đổi từ khóa hoặc xóa một vài bộ lọc.</p>
              <Button onClick={clearFilters}>Xóa bộ lọc</Button>
            </section>
          )}
          {!loading && !apiError && (page > 1 || hasNext) && (
            <div className="hero-actions">
              <Button
                type="button"
                disabled={page === 1}
                onClick={() => updateParam('page', String(page - 1))}
              >
                Trang trước
              </Button>
              <Button
                type="button"
                disabled={!hasNext}
                onClick={() => updateParam('page', String(page + 1))}
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={filterOpen}
        title="Bộ lọc sản phẩm"
        onClose={() => setFilterOpen(false)}
      >
        {filterControls}
        <Button
          type="button"
          className="mobile-filter-apply"
          onClick={() => setFilterOpen(false)}
        >
          Xem {count} sản phẩm
        </Button>
      </Modal>
    </div>
  )
}
