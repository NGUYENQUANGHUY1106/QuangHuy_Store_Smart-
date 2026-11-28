import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ShoppingBag, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { mockApi } from '../../services/mockApi'
import { formatVnd } from '../../utils/format'
import type { Product } from '../ProductCard'
import { ShowcaseImage } from './ShowcaseImage'
import { categorySlugs, type CatalogCategory } from './showcaseCatalog'

const pageSize = 12
const shoeRoots = ['giay-bong-da']
const accessoryRoots = ['phu-kien', 'phu-kien-bong-da', 'bong-dung-cu']
const tabs = [
  { name: 'Tất cả', roots: [...shoeRoots, ...accessoryRoots] },
  { name: 'Giày bóng đá', roots: shoeRoots },
  { name: 'Phụ kiện', roots: accessoryRoots },
]
type CabinetPage = { products: Product[]; count: number }

function CabinetDetails({
  product,
  close,
}: {
  product: Product
  close: () => void
}) {
  const { addItem } = useCart()
  const reduced = useReducedMotion()
  const fieldId = useId()
  const panel = useRef<HTMLElement>(null)
  const submitting = useRef(false)
  const [detail, setDetail] = useState<Product>()
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ error: boolean; message: string }>()

  useEffect(() => {
    panel.current?.focus({ preventScroll: true })
    panel.current?.scrollIntoView?.({
      block: 'center',
      behavior: reduced ? 'auto' : 'smooth',
    })
  }, [reduced])

  useEffect(() => {
    let live = true
    mockApi
      .getCatalogProduct(product.slug)
      .then((data) => {
        if (live) setDetail(data)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [product.slug, attempt])

  const variants = detail?.variants ?? []
  const colors = [...new Set(variants.map((row) => row.color))]
  const sizes = variants.filter((row) => row.color === color)
  const variant = sizes.find((row) => row.size === size)
  const colorPrices = sizes.flatMap(({ unitPrice }) =>
    unitPrice === undefined ? [] : [unitPrice],
  )
  const price =
    variant?.unitPrice ??
    (colorPrices.length
      ? Math.min(...colorPrices)
      : (detail?.salePrice ?? product.salePrice))
  const available = detail
    ? variants.some((row) => (!color || row.color === color) && row.stock > 0)
    : product.inStock
  const photograph =
    (color && detail?.images?.find((image) => image.color === color)?.url) ||
    product.image

  async function addToCart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current || !variant?.id || variant.stock < 1) return
    submitting.current = true
    setBusy(true)
    setNotice(undefined)
    try {
      await addItem({ ...product, image: photograph }, variant, 1)
      setNotice({ error: false, message: 'Đã thêm sản phẩm vào giỏ hàng.' })
    } catch (error) {
      setNotice({
        error: true,
        message:
          error instanceof Error
            ? error.message
            : 'Chưa thêm được vào giỏ hàng. Vui lòng thử lại.',
      })
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <motion.article
      ref={panel}
      tabIndex={-1}
      className="cabinet-details"
      data-cabinet-details
      aria-labelledby={`cabinet-title-${product.id}`}
      initial={reduced ? false : { opacity: 0, y: 18, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.94 }}
      transition={
        reduced
          ? { duration: 0 }
          : { type: 'spring', stiffness: 290, damping: 27 }
      }
    >
      <ShowcaseImage
        className="cabinet-detail-photo"
        src={photograph}
        alt={product.name}
      />
      <div className="cabinet-details-copy">
        <p className="cabinet-detail-category">
          {product.brand} · {product.category}
        </p>
        <h3 id={`cabinet-title-${product.id}`}>{product.name}</h3>
        <div className="cabinet-detail-price">
          {Number.isFinite(price) && <strong>{formatVnd(price)}</strong>}
          {product.originalPrice > price && (
            <del>{formatVnd(product.originalPrice)}</del>
          )}
          {available !== undefined && (
            <span className="cabinet-stock">
              {available ? 'Còn hàng' : 'Hết hàng'}
            </span>
          )}
        </div>
        {detail?.description && (
          <p className="cabinet-detail-description">{detail.description}</p>
        )}
        {!detail && !failed && <p role="status">Đang tải màu sắc và size…</p>}
        {failed && (
          <p role="alert">
            Chưa tải được biến thể.{' '}
            <button
              className="text-link"
              type="button"
              onClick={() => {
                setFailed(false)
                setAttempt(attempt + 1)
              }}
            >
              Thử lại
            </button>
          </p>
        )}
        <form onSubmit={addToCart}>
          {colors.length > 0 && (
            <div className="cabinet-options">
              <div>
                <label htmlFor={`${fieldId}-color`}>Màu sắc</label>
                <select
                  id={`${fieldId}-color`}
                  value={color}
                  disabled={busy}
                  onChange={(event) => {
                    setColor(event.target.value)
                    setSize('')
                    setNotice(undefined)
                  }}
                >
                  <option value="">Chọn màu</option>
                  {colors.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${fieldId}-size`}>Size</label>
                <select
                  id={`${fieldId}-size`}
                  value={size}
                  disabled={!color || busy}
                  onChange={(event) => {
                    setSize(event.target.value)
                    setNotice(undefined)
                  }}
                >
                  <option value="">Chọn size</option>
                  {sizes.map((row) => (
                    <option
                      key={row.sku}
                      value={row.size}
                      disabled={row.stock < 1}
                    >
                      {row.size}
                      {row.stock < 1 ? ' · Hết hàng' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <div className="cabinet-detail-actions">
            <Link
              className="button button-secondary"
              to={`/products/${product.slug}`}
            >
              Xem chi tiết
            </Link>
            <button
              className="button button-primary"
              type="submit"
              disabled={busy || !variant?.id || variant.stock < 1}
            >
              <ShoppingBag size={17} aria-hidden="true" />
              {busy ? 'Đang thêm…' : 'Thêm vào giỏ'}
            </button>
          </div>
          {notice && (
            <p
              role={notice.error ? 'alert' : 'status'}
              className="cabinet-result"
            >
              {notice.message}
            </p>
          )}
        </form>
      </div>
      <button
        className="cabinet-close"
        type="button"
        onClick={close}
        aria-label="Đóng thông tin sản phẩm"
      >
        <X size={21} aria-hidden="true" />
      </button>
    </motion.article>
  )
}

export function InteractiveShoeCabinet({
  categories,
  catalogError,
  retryCatalog,
}: {
  categories: CatalogCategory[] | undefined
  catalogError: boolean
  retryCatalog: () => void
}) {
  const [tab, setTab] = useState(0)
  const [page, setPage] = useState(1)
  const [direction, setDirection] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; data: CabinetPage }>()
  const [failedKey, setFailedKey] = useState('')
  const [selected, setSelected] = useState<Product>()
  const reduced = useReducedMotion()
  const trigger = useRef<HTMLButtonElement>(null)
  const pages = useRef(new Map<string, Promise<CabinetPage>>())
  const slugs =
    categories && categorySlugs(categories, tabs[tab].roots).join(',')
  const requestKey = `${slugs}:${page}`
  const key = `${requestKey}:${attempt}`
  const failed = catalogError || failedKey === key
  const loading = !failed && result?.key !== key
  const shown = result?.data
  const activePage = !loading && !failed ? shown : undefined
  const pageCount = Math.ceil((activePage?.count ?? 0) / pageSize)

  useEffect(() => {
    if (slugs === undefined) return
    let live = true
    const cache = pages.current

    function fetchPage(number: number, categorySlugs: string) {
      const cacheKey = `${categorySlugs}:${number}`
      const cached = cache.get(cacheKey)
      if (cached) return cached
      const request: Promise<CabinetPage> = mockApi
        .getCatalogProducts(
          {
            category: categorySlugs.split(','),
            page: number,
            page_size: pageSize,
          },
          false,
        )
        .catch((error: unknown) => {
          cache.delete(cacheKey)
          throw error
        })
      cache.set(cacheKey, request)
      return request
    }

    const request = slugs
      ? fetchPage(page, slugs)
      : Promise.resolve({ products: [], count: 0 })
    request
      .then((data) => {
        if (!live) return
        setResult({ key, data })
        if (slugs && page * pageSize < data.count)
          void fetchPage(page + 1, slugs).catch(() => {})
      })
      .catch(() => {
        if (live) setFailedKey(key)
      })
    return () => {
      live = false
    }
  }, [slugs, page, key])

  useEffect(() => {
    if (!selected) return
    function dismissOutside(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        event.target.closest('[data-cabinet-product], [data-cabinet-details]')
      )
        return
      setSelected(undefined)
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSelected(undefined)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [selected])

  const movement = reduced ? 0 : 34
  const variants = {
    enter: (step: number) => ({ opacity: 0, x: step * movement }),
    center: { opacity: 1, x: 0 },
    exit: (step: number) => ({ opacity: 0, x: -step * movement }),
  }

  return (
    <section
      className="section-block cabinet-section"
      aria-labelledby="cabinet-heading"
    >
      <div className="cabinet-header">
        <div>
          <h2 id="cabinet-heading">Tủ giày bóng đá &amp; phụ kiện</h2>
          <p>Khám phá những sản phẩm phù hợp với phong cách thi đấu của bạn.</p>
        </div>
        <div
          className="cabinet-tabs"
          role="group"
          aria-label="Danh mục trưng bày"
        >
          {tabs.map(({ name }, index) => (
            <button
              type="button"
              key={name}
              aria-pressed={tab === index}
              onClick={() => {
                if (index === tab) return
                setSelected(undefined)
                setDirection(Math.sign(index - tab))
                setTab(index)
                setPage(1)
              }}
            >
              {name}
              {tab === index && (
                <motion.span
                  className="cabinet-tab-indicator"
                  layoutId="cabinet-category"
                  transition={{ duration: reduced ? 0 : 0.25 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="cabinet-frame">
        <div className="cabinet-window" aria-busy={loading}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              className="cabinet-shelves"
              key={failed ? key : (result?.key ?? 'start')}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduced ? 0 : 0.2 }}
            >
              {!failed &&
                shown?.products.map((product) => (
                  <div className="cabinet-cell" key={product.id}>
                    <motion.button
                      className="cabinet-product"
                      type="button"
                      data-cabinet-product
                      disabled={loading}
                      aria-expanded={selected?.id === product.id}
                      aria-label={product.name}
                      whileHover={
                        reduced || selected?.id === product.id
                          ? undefined
                          : { y: -5, scale: 1.04 }
                      }
                      animate={
                        selected?.id === product.id && !reduced
                          ? { y: -14, scale: 1.17 }
                          : { y: 0, scale: 1 }
                      }
                      transition={{
                        type: 'spring',
                        stiffness: 270,
                        damping: 24,
                      }}
                      onClick={(event) => {
                        trigger.current = event.currentTarget
                        setSelected(
                          selected?.id === product.id ? undefined : product,
                        )
                      }}
                    >
                      <ShowcaseImage
                        className="cabinet-product-photo"
                        src={product.image}
                        alt=""
                        loading="lazy"
                      />
                      <span className="cabinet-product-label">
                        <span>{product.name}</span>
                        {product.inStock === false ? (
                          <strong>Hết hàng</strong>
                        ) : (
                          Number.isFinite(product.salePrice) && (
                            <strong>{formatVnd(product.salePrice)}</strong>
                          )
                        )}
                      </span>
                    </motion.button>
                  </div>
                ))}
              {loading &&
                !shown &&
                Array.from({ length: pageSize }, (_, index) => (
                  <div className="cabinet-cell" key={index} aria-hidden="true">
                    <div className="cabinet-skeleton" />
                  </div>
                ))}
              {!loading && !failed && !shown?.products.length && (
                <p className="cabinet-state">
                  Danh mục này chưa có sản phẩm trưng bày.
                </p>
              )}
              {failed && (
                <div className="cabinet-state" role="alert">
                  <p>Chưa tải được tủ trưng bày.</p>
                  <button
                    className="text-link"
                    type="button"
                    onClick={() => {
                      if (catalogError) retryCatalog()
                      else setAttempt(attempt + 1)
                    }}
                  >
                    Thử lại
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="cabinet-toolbar">
          <span role="status">
            {loading
              ? 'Đang tải sản phẩm…'
              : activePage
                ? `${activePage.count} sản phẩm`
                : ''}
          </span>
          <nav className="showcase-pager" aria-label="Phân trang tủ trưng bày">
            <button
              type="button"
              aria-label="Kệ trước"
              disabled={page <= 1 || loading || failed}
              onClick={() => {
                setSelected(undefined)
                setDirection(-1)
                setPage(page - 1)
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <span>
              Kệ {pageCount ? page : 0} / {pageCount}
            </span>
            <button
              type="button"
              aria-label="Kệ sau"
              disabled={page >= pageCount || loading || failed}
              onClick={() => {
                setSelected(undefined)
                setDirection(1)
                setPage(page + 1)
              }}
            >
              <ArrowRight size={18} />
            </button>
          </nav>
        </div>
        <div className="cabinet-overlay">
          <AnimatePresence initial={false} mode="wait">
            {selected && (
              <CabinetDetails
                key={selected.id}
                product={selected}
                close={() => {
                  setSelected(undefined)
                  trigger.current?.focus()
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
