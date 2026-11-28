import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { mockApi } from '../../services/mockApi'
import { formatVnd } from '../../utils/format'
import type { Product } from '../ProductCard'
import { ShowcaseImage } from './ShowcaseImage'
import { bootAngle, showcaseBoots } from './showcaseCatalog'

const spring = { type: 'spring', stiffness: 240, damping: 27, mass: 1 } as const
const wrap = (step: number, count: number) => ((step % count) + count) % count

function OrbitBoot({
  product,
  index,
  count,
  width,
  rotation,
  active,
  select,
}: {
  product: Product
  index: number
  count: number
  width: number
  rotation: MotionValue<number>
  active: boolean
  select: () => void
}) {
  const [angle, setAngle] = useState(() => bootAngle(product.image, 0, 0))
  const phase = useTransform(
    () => ((index - rotation.get()) * Math.PI * 2) / count,
  )
  const depth = useTransform(() => (Math.cos(phase.get()) + 1) / 2)
  const x = useTransform(() => Math.sin(phase.get()) * width * 0.33)
  const y = useTransform(() =>
    count === 1 ? 0 : (depth.get() - 0.5) * Math.min(width * 0.21, 142),
  )
  const scale = useTransform(() => {
    const near = depth.get()
    return 0.53 + 0.49 * near + 0.16 * near ** 6
  })
  const opacity = useTransform(() => {
    const near = depth.get()
    return 0.45 + 0.33 * near + 0.22 * near ** 8
  })
  const zIndex = useTransform(() => Math.round(depth.get() * 100))
  return (
    <motion.div className="boot-orbit-item" style={{ x, y, zIndex }}>
      <motion.div className="boot-orbit-depth" style={{ scale, opacity }}>
        <button
          type="button"
          className="boot-orbit-photo"
          onClick={select}
          aria-label={
            active ? `Xem ${product.name}` : `Đưa ${product.name} ra giữa`
          }
          tabIndex={active ? 0 : -1}
          aria-current={active || undefined}
        >
          <ShowcaseImage
            src={product.image}
            alt={product.name}
            draggable={false}
            fetchPriority={index === 0 ? 'high' : 'auto'}
            style={{ transform: `rotate(${angle}deg)` }}
            onLoad={({ currentTarget }) =>
              setAngle(
                bootAngle(
                  product.image,
                  currentTarget.naturalWidth,
                  currentTarget.naturalHeight,
                ),
              )
            }
          />
        </button>
      </motion.div>
    </motion.div>
  )
}

export function CircularBootShowcase() {
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [products, setProducts] = useState<Product[]>()
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [step, setStep] = useState(0)
  const position = useMotionValue(0)
  const transition = useRef<ReturnType<typeof animate> | null>(null)
  const dragOrigin = useRef(0)
  const pointerStart = useRef<number | undefined>(undefined)
  const lastWheel = useRef(0)
  const suppressClick = useRef(0)
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ['start end', 'end start'],
  })
  const scroll = useSpring(scrollYProgress, { stiffness: 95, damping: 27 })
  const rotation = useTransform(
    () =>
      position.get() +
      (reduced || (products?.length ?? 0) <= 1
        ? 0
        : (scroll.get() - 0.5) * 0.32),
  )
  const count = products?.length ?? 0
  const active = count ? wrap(step, count) : 0
  const selected = products?.[active]

  useEffect(() => {
    let live = true
    mockApi
      .getCatalogProducts(
        { category: 'giay-bong-da', in_stock: 'true', page_size: 20 },
        false,
      )
      .then(({ products: rows }) => {
        if (live) setProducts(showcaseBoots(rows))
      })
      .catch(() => {
        if (live) setError(true)
      })
    return () => {
      live = false
    }
  }, [attempt])

  useEffect(() => {
    if (!stage.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => () => transition.current?.stop(), [])

  function snap(destination: number) {
    setStep(destination)
    transition.current?.stop()
    if (reduced) position.set(destination)
    else transition.current = animate(position, destination, spring)
  }

  return (
    <div
      className="boot-showcase"
      ref={root}
      role="region"
      aria-label="Vòng trưng bày giày bóng đá"
      aria-roledescription="bộ sưu tập tương tác"
      onKeyDown={(event) => {
        if (count <= 1 || !['ArrowLeft', 'ArrowRight'].includes(event.key))
          return
        event.preventDefault()
        snap(step + (event.key === 'ArrowRight' ? 1 : -1))
        if (
          event.target instanceof HTMLElement &&
          event.target.matches('.boot-orbit-photo')
        )
          requestAnimationFrame(() =>
            stage.current
              ?.querySelector<HTMLElement>('[aria-current]')
              ?.focus({ preventScroll: true }),
          )
      }}
    >
      <motion.div
        className="boot-orbit-stage"
        ref={stage}
        onPointerDownCapture={(event) => {
          pointerStart.current = event.clientX
          suppressClick.current = 0
        }}
        onPointerMoveCapture={(event) => {
          if (
            count > 1 &&
            pointerStart.current !== undefined &&
            Math.abs(event.clientX - pointerStart.current) > 12
          )
            suppressClick.current = performance.now() + 350
        }}
        onPointerUpCapture={() => {
          pointerStart.current = undefined
        }}
        onPointerCancelCapture={() => {
          pointerStart.current = undefined
        }}
        onWheel={({ deltaX, deltaY }) => {
          const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY
          const now = performance.now()
          if (
            count <= 1 ||
            Math.abs(delta) < 4 ||
            now - lastWheel.current < 260
          )
            return
          lastWheel.current = now
          snap(step + Math.sign(delta))
        }}
        onPanStart={() => {
          if (count <= 1) return
          transition.current?.stop()
          dragOrigin.current = position.get()
        }}
        onPan={(_, info) => {
          if (count > 1 && Math.abs(info.offset.x) > 12)
            suppressClick.current = performance.now() + 350
          if (count > 1 && !reduced)
            position.set(
              dragOrigin.current - info.offset.x / Math.max(width * 0.26, 75),
            )
        }}
        onPanEnd={(_, info) => {
          if (count <= 1) return
          suppressClick.current = performance.now() + 220
          const shift = -info.offset.x / Math.max(width * 0.26, 75)
          const momentum = Math.max(-1.5, Math.min(1.5, -info.velocity.x / 750))
          snap(
            Math.abs(info.offset.x) > 12
              ? Math.round(dragOrigin.current + shift + momentum)
              : step,
          )
        }}
      >
        <div className="boot-orbit-track" aria-hidden="true" />
        {selected && (
          <div className="boot-orbit-spotlight" aria-hidden="true" />
        )}
        {!products && !error && (
          <div className="boot-loading" role="status">
            Đang tải giày bóng đá…
          </div>
        )}
        {error && (
          <div className="boot-empty" role="alert">
            <p>Chưa tải được giày bóng đá.</p>
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setError(false)
                setAttempt(attempt + 1)
              }}
            >
              Thử lại
            </button>
          </div>
        )}
        {products?.length === 0 && (
          <p className="boot-empty">Chưa có mẫu giày còn hàng để trưng bày.</p>
        )}
        {products?.map((product, index) => (
          <OrbitBoot
            key={`${product.id}:${product.image}`}
            product={product}
            index={index}
            count={count}
            width={width}
            rotation={rotation}
            active={index === active}
            select={() => {
              if (performance.now() < suppressClick.current) return
              const delta = index - active
              if (!delta) navigate(`/products/${product.slug}`)
              else
                snap(
                  step +
                    (Math.abs(delta) > count / 2
                      ? delta - Math.sign(delta) * count
                      : delta),
                )
            }}
          />
        ))}
      </motion.div>
      <div className="boot-showcase-footer">
        <div className="boot-model" aria-live="polite">
          {selected && (
            <>
              <span>{selected.brand}</span>
              <h2>{selected.name}</h2>
              <strong>{formatVnd(selected.salePrice)}</strong>
              {selected.originalPrice > selected.salePrice && (
                <del>{formatVnd(selected.originalPrice)}</del>
              )}
            </>
          )}
        </div>
        <div className="boot-showcase-actions">
          {selected && (
            <Link
              className="boot-product-link"
              to={`/products/${selected.slug}`}
            >
              Xem sản phẩm <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          )}
          <div className="showcase-pager">
            <button
              type="button"
              aria-label="Giày trước"
              onClick={() => snap(step - 1)}
              disabled={count <= 1}
            >
              <ArrowLeft size={18} />
            </button>
            <span>
              {count ? active + 1 : 0} / {count}
            </span>
            <button
              type="button"
              aria-label="Giày sau"
              onClick={() => snap(step + 1)}
              disabled={count <= 1}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
