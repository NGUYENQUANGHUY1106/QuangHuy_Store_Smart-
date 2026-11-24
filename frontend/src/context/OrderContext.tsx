import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { orders } from '../services/mockApi'

export type OrderRecord = (typeof orders)[number] & {
  paymentMethod?: string
  shippingAddress?: string
}

type OrderContextValue = {
  orders: OrderRecord[]
  addOrder: (order: OrderRecord) => void
  cancelOrder: (id: string) => void
  updateStatus: (id: string, status: string) => void
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderList, setOrderList] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('qhs-orders')
      return saved
        ? (JSON.parse(saved) as OrderRecord[])
        : (orders as OrderRecord[])
    } catch {
      return orders as OrderRecord[]
    }
  })

  useEffect(() => {
    localStorage.setItem('qhs-orders', JSON.stringify(orderList))
  }, [orderList])

  const value = useMemo(
    () => ({
      orders: orderList,
      addOrder: (order: OrderRecord) =>
        setOrderList((current) => [order, ...current]),
      cancelOrder: (id: string) =>
        setOrderList((current) =>
          current.map((order) =>
            order.id === id
              ? { ...order, status: 'cancelled', statusLabel: 'Đã hủy' }
              : order,
          ),
        ),
      updateStatus: (id: string, status: string) =>
        setOrderList((current) =>
          current.map((order) => {
            if (order.id !== id) return order
            const labels: Record<string, string> = {
              pending: 'Chờ xác nhận',
              shipping: 'Đang giao',
              delivered: 'Hoàn thành',
              cancelled: 'Đã hủy',
            }
            return { ...order, status, statusLabel: labels[status] ?? status }
          }),
        ),
    }),
    [orderList],
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) throw new Error('useOrders must be used inside OrderProvider')
  return context
}
