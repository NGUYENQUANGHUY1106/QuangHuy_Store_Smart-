import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { mockApi, productImageUrl } from '../services/mockApi'
import { useAuth } from './AuthContext'
import type { Product } from '../components/ProductCard'

const guestKey = 'qhs-cart'
type Variant = Product['variants'][number]
type CartLine = {
  id?: string
  variantId?: string
  sku: string
  quantity: number
  product: { name: string; brand: string; image: string; salePrice: number }
  variant: Pick<Variant, 'color' | 'size' | 'stock'>
  available: boolean
}

function serverLines(data: { items: unknown }): CartLine[] {
  if (!Array.isArray(data.items)) throw new Error('Không thể đọc giỏ hàng.')
  return data.items.map((line) => {
    const unitPrice = Number(line?.unit_price)
    if (
      typeof line?.id !== 'string' ||
      typeof line.variant_id !== 'string' ||
      typeof line.sku !== 'string' ||
      typeof line.product_name !== 'string' ||
      typeof line.color !== 'string' ||
      typeof line.size !== 'string' ||
      !Number.isInteger(line.qty) ||
      line.qty < 1 ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !Number.isInteger(line.stock_qty)
    ) {
      throw new Error('Dữ liệu giỏ hàng không hợp lệ.')
    }
    return {
      id: line.id,
      variantId: line.variant_id,
      sku: line.sku,
      quantity: line.qty,
      product: {
        name: line.product_name,
        brand: '',
        image: productImageUrl(line.thumbnail),
        salePrice: unitPrice,
      },
      variant: { color: line.color, size: line.size, stock: line.stock_qty },
      available: line.is_available === true,
    }
  })
}

function readGuestCart(): CartLine[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(guestKey) ?? '[]')
    if (!Array.isArray(data)) return []
    return data.flatMap((line) => {
      if (
        typeof line?.sku !== 'string' ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1
      )
        return []
      if (
        typeof line.product?.name === 'string' &&
        Number.isFinite(line.product.salePrice) &&
        typeof line.variant?.size === 'string' &&
        Number.isInteger(line.variant.stock)
      )
        return [line]
      return [
        {
          sku: line.sku,
          quantity: line.quantity,
          available: false,
          product: {
            name: line.sku,
            brand: '',
            image: '/images/product-placeholder.svg',
            salePrice: 0,
          },
          variant: { color: '', size: '', stock: 0 },
        },
      ]
    })
  } catch {
    return []
  }
}

type CartContextValue = {
  items: CartLine[]
  itemCount: number
  busy: boolean
  error: string
  addItem: (
    product: Product,
    variant: Variant,
    quantity: number,
  ) => Promise<void>
  updateQuantity: (sku: string, quantity: number) => Promise<void>
  removeItem: (sku: string) => Promise<void>
  clearCart: () => void
  getItemDetails: (line: CartLine) => CartLine
}

const CartContext = createContext<CartContextValue | null>(null)
const getItemDetails = (line: CartLine) => line

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const owner = user?.id
  const [guestItems, setGuestItems] = useState(readGuestCart)
  const [serverCart, setServerCart] = useState<{
    owner?: string
    items: CartLine[]
  }>({ items: [] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const items = owner
    ? serverCart.owner === owner
      ? serverCart.items
      : []
    : guestItems

  useEffect(() => {
    localStorage.setItem(guestKey, JSON.stringify(guestItems))
  }, [guestItems])

  useEffect(() => {
    let active = true
    setError('')
    if (!owner) {
      setServerCart({ items: [] })
      setBusy(false)
      return
    }
    setBusy(true)
    // Defer the mutation so React StrictMode cleanup can discard its first effect.
    void Promise.resolve().then(async () => {
      if (!active) return
      const entries = readGuestCart()
      const transferable = entries.filter((line) => line.variantId)
      try {
        const data = transferable.length
          ? await mockApi.mergeCart(
              transferable.map((line) => ({
                variant_id: line.variantId,
                qty: line.quantity,
              })),
            )
          : await mockApi.getCart()
        if (!active) return
        setServerCart({ owner, items: serverLines(data) })
        if (transferable.length) {
          const remaining = entries.filter((line) => !line.variantId)
          localStorage.setItem(guestKey, JSON.stringify(remaining))
          localStorage.removeItem('qhs-cart-merge')
          setGuestItems(remaining)
        }
      } catch (failure) {
        if (!active) return
        setError(
          failure instanceof Error
            ? failure.message
            : 'Không thể đồng bộ giỏ hàng.',
        )
        try {
          const data = await mockApi.getCart()
          if (active) setServerCart({ owner, items: serverLines(data) })
        } catch {
          // Keep the original sync error visible.
        }
      } finally {
        if (active) setBusy(false)
      }
    })
    return () => {
      active = false
    }
  }, [owner])

  const mutate = async (request: () => Promise<CartLine[]>) => {
    setBusy(true)
    setError('')
    try {
      const next = await request()
      setServerCart((current) =>
        current.owner === owner ? { owner, items: next } : current,
      )
    } catch (failure) {
      const message =
        failure instanceof Error
          ? failure.message
          : 'Không thể cập nhật giỏ hàng.'
      setError(message)
      throw new Error(message)
    } finally {
      setBusy(false)
    }
  }

  const addItem: CartContextValue['addItem'] = async (
    product,
    variant,
    quantity,
  ) => {
    if (!variant.id || variant.unitPrice === undefined)
      throw new Error('Biến thể không còn khả dụng.')
    const nextQuantity =
      quantity + (items.find((line) => line.sku === variant.sku)?.quantity ?? 0)
    if (owner) {
      await mutate(async () =>
        serverLines(await mockApi.addCartItem(variant.id, quantity)),
      )
    } else {
      if (nextQuantity > variant.stock)
        throw new Error('Sản phẩm không đủ tồn kho.')
      setGuestItems((current) => [
        ...current.filter((line) => line.sku !== variant.sku),
        {
          variantId: variant.id,
          sku: variant.sku,
          quantity: nextQuantity,
          available: true,
          product: {
            name: product.name,
            brand: product.brand,
            image: product.image,
            salePrice: variant.unitPrice ?? product.salePrice,
          },
          variant,
        },
      ])
    }
  }

  const removeItem = async (sku: string) => {
    const line = items.find((item) => item.sku === sku)
    if (owner && line?.id) {
      await mutate(async () => {
        await mockApi.removeCartItem(line.id)
        return items.filter((item) => item.sku !== sku)
      })
    } else
      setGuestItems((current) => current.filter((item) => item.sku !== sku))
  }

  const updateQuantity = async (sku: string, quantity: number) => {
    if (quantity < 1) return removeItem(sku)
    const line = items.find((item) => item.sku === sku)
    if (!line) return
    if (owner && line.id) {
      await mutate(async () => {
        const response = await mockApi.updateCartItem(line.id, quantity)
        const [updated] = serverLines({ items: [response.item] })
        return items.map((item) => (item.sku === sku ? updated : item))
      })
    } else if (quantity <= line.variant.stock) {
      setGuestItems((current) =>
        current.map((item) =>
          item.sku === sku ? { ...item, quantity } : item,
        ),
      )
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount: items.reduce((sum, line) => sum + line.quantity, 0),
        busy,
        error,
        addItem,
        updateQuantity,
        removeItem,
        getItemDetails,
        clearCart: () =>
          owner ? setServerCart({ owner, items: [] }) : setGuestItems([]),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
