import {
  brands,
  categories,
  colors,
  cart,
  currentUser,
  orders,
  products,
  vouchers,
} from '../data/mockData.js'

export {
  brands,
  categories,
  colors,
  cart,
  currentUser,
  orders,
  products,
  vouchers,
}

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://127.0.0.1:8000'

function authHeaders(extra = {}) {
  const access =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('qhs-access-token')
      : null
  return {
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...extra,
  }
}

let pendingRefresh = null

async function refreshAccess(previousAuthorization) {
  const access = sessionStorage.getItem('qhs-access-token')
  const refresh = sessionStorage.getItem('qhs-refresh-token')
  if (!access || !refresh) return null
  if (`Bearer ${access}` !== previousAuthorization) return null

  if (pendingRefresh?.refresh === refresh) return pendingRefresh.request
  const request = (async () => {
    const response = await fetch(`${API_ORIGIN}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!response.ok) return null
    const tokens = await response.json()
    if (
      sessionStorage.getItem('qhs-refresh-token') !== refresh ||
      typeof tokens.access !== 'string' ||
      typeof tokens.refresh !== 'string'
    )
      return null
    sessionStorage.setItem('qhs-access-token', tokens.access)
    sessionStorage.setItem('qhs-refresh-token', tokens.refresh)
    return tokens.access
  })()
  pendingRefresh = { refresh, request }
  try {
    return await request
  } finally {
    if (pendingRefresh?.request === request) pendingRefresh = null
  }
}

async function fetchJson(path, init) {
  let response = await fetch(`${API_ORIGIN}${path}`, {
    credentials: 'include',
    ...init,
  })
  const authorization = init?.headers?.Authorization
  if (response.status === 401 && authorization && path !== '/auth/logout') {
    const access = await refreshAccess(authorization)
    if (access) {
      response = await fetch(`${API_ORIGIN}${path}`, {
        credentials: 'include',
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${access}` },
      })
    }
  }
  if (!response.ok) {
    let body = null
    try {
      body = await response.json()
    } catch {
      body = null
    }
    if (
      response.status === 400 &&
      (path === '/auth/register' ||
        path === '/auth/me' ||
        /^\/admin\/(users|vouchers|media|products|variants)(\/|$)/.test(path))
    ) {
      const messages = Object.keys(body ?? {}).flatMap((field) =>
        Array.isArray(body?.[field])
          ? body[field].filter((message) => typeof message === 'string')
          : [],
      )
      if (messages.length) throw new Error(messages.join(' '))
    }
    throw new Error(
      body?.error?.message ||
        body?.detail ||
        (typeof body?.error === 'string'
          ? body.error
          : `API request failed: ${response.status}`),
    )
  }
  if (response.status === 204) return null
  return response.json()
}

function mediaUrl(path) {
  return path?.startsWith('/media/') ? `${API_ORIGIN}${path}` : path
}

export function productImageUrl(thumbnail) {
  return typeof thumbnail === 'string' && thumbnail
    ? mediaUrl(thumbnail)
    : '/images/product-placeholder.svg'
}

function mapCatalogProduct(summary, detail) {
  const source = detail ?? summary
  const variantPrices =
    detail?.variants?.map((variant) => Number(variant.unit_price)) ?? []
  const salePrice =
    summary.from_price != null
      ? Number(summary.from_price)
      : Math.min(...variantPrices)
  return {
    id: source.id,
    name: source.name,
    slug: source.slug,
    brand: source.brand?.name ?? 'QuangHuy Sport',
    category: source.category?.name ?? '',
    description: source.description ?? '',
    originalPrice: salePrice,
    salePrice,
    rating: 0,
    reviewCount: 0,
    image: productImageUrl(source.thumbnail),
    images: (detail?.images ?? []).map((entry) => ({
      id: entry.id,
      url: mediaUrl(entry.url),
      alt: entry.alt_text,
      color: detail?.variants?.find(
        (variant) => variant.id === entry.variant_id,
      )?.color,
    })),
    badge: '',
    variants: (detail?.variants ?? []).map((variant) => ({
      id: variant.id,
      unitPrice: Number(variant.unit_price),
      sku: variant.sku,
      size: variant.size,
      color: variant.color,
      stock: variant.stock_qty,
    })),
  }
}

export const mockApi = {
  async getInventoryBalances() {
    return fetchJson('/admin/inventory/balances', { headers: authHeaders() })
  },
  async getInventoryMovements() {
    return fetchJson('/admin/inventory/movements', { headers: authHeaders() })
  },
  async adjustInventory(data) {
    return fetchJson('/admin/inventory/adjust', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    })
  },
  async getCart() {
    return fetchJson('/cart', { headers: authHeaders() })
  },
  async mergeCart(items) {
    const body = JSON.stringify({ items })
    const storageKey = 'qhs-cart-merge'
    const saved = localStorage.getItem(storageKey)?.split('|', 2)
    const key = saved?.[1] === body ? saved[0] : crypto.randomUUID()
    localStorage.setItem(storageKey, `${key}|${body}`)
    const result = await fetchJson('/cart/merge', {
      method: 'POST',
      headers: authHeaders({
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
      }),
      body,
    })
    return result
  },
  async addCartItem(variantId, qty) {
    return fetchJson('/cart/items', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ variant_id: variantId, qty }),
    })
  },
  async updateCartItem(itemId, qty) {
    return fetchJson(`/cart/items/${itemId}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ qty }),
    })
  },
  async removeCartItem(itemId) {
    return fetchJson(`/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  },
  async validateVoucher(code) {
    return fetchJson('/vouchers/validate', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ code }),
    })
  },
  /** @param {{ variant_id: string, qty: number }} [directItem] */
  async quoteCheckout(voucherCode, directItem) {
    return fetchJson('/checkout/quote', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        voucher_code: voucherCode,
        direct_item: directItem,
      }),
    })
  },
  async checkout(payload, idempotencyKey) {
    return fetchJson('/checkout/orders', {
      method: 'POST',
      headers: authHeaders({
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      }),
      body: JSON.stringify(payload),
    })
  },
  async getProductReviews(slug, page, orderItem) {
    const query = new URLSearchParams({ page: String(page) })
    if (orderItem) query.set('order_item', orderItem)
    return fetchJson(`/products/${encodeURIComponent(slug)}/reviews?${query}`, {
      headers: authHeaders(),
    })
  },
  async createReview(orderItemId, rating, body) {
    return fetchJson('/reviews', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ order_item_id: orderItemId, rating, body }),
    })
  },
  async replyToReview(reviewId, body) {
    return fetchJson(`/reviews/${reviewId}/replies`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ body }),
    })
  },
  async getAdminReviews(page) {
    return fetchJson(`/admin/reviews?page=${page}`, { headers: authHeaders() })
  },
  async adminReplyToReview(reviewId, body) {
    return fetchJson(`/admin/reviews/${reviewId}/replies`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ body }),
    })
  },
  async removeAdminReview(reviewId) {
    return fetchJson(`/admin/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  },
  async getOrders(page = 1, status = 'all') {
    const params = new URLSearchParams({ page: String(page) })
    if (status !== 'all') params.set('status', status)
    const data = await fetchJson(`/orders?${params}`, {
      headers: authHeaders(),
    })
    if (data && Array.isArray(data.results)) {
      return {
        hasNext: Boolean(data.next),
        orders: data.results.map((order) => ({
          id: order.number || order.id,
          orderId: order.id,
          number: order.number,
          status: order.status.toLowerCase(),
          statusLabel:
            order.status === 'PENDING'
              ? 'Chờ xác nhận'
              : order.status === 'CONFIRMED'
                ? 'Đã xác nhận'
                : order.status === 'SHIPPING'
                  ? 'Đang giao'
                  : order.status === 'COMPLETED'
                    ? 'Hoàn thành'
                    : 'Đã hủy',
          createdAt: order.created_at
            ? order.created_at.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          total: Number(order.total),
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          shipping: Number(order.shipping),
          paymentMethod: order.payment_method,
          paymentStatus: order.payment_status,
          shippingAddress: order.address_snapshot
            ? `${order.address_snapshot.receiver || ''} - ${order.address_snapshot.phone || ''} - ${order.address_snapshot.street || ''}`
            : '',
          items: (order.items || []).map((it) => ({
            id: it.id,
            productSlug: it.product_slug,
            reviewed: it.reviewed,
            productId: it.variant,
            name: it.product_name_snapshot,
            image: productImageUrl(it.thumbnail),
            sku: it.sku_snapshot,
            size: it.size_snapshot,
            color: it.color_snapshot,
            quantity: it.qty,
            unitPrice: Number(it.unit_price),
            lineSubtotal: Number(it.line_subtotal),
          })),
        })),
      }
    }
    throw new Error('Dữ liệu đơn hàng không hợp lệ.')
  },
  async getOrderDetail(id) {
    return fetchJson(`/orders/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
    })
  },
  /** @param {number} [expectedVersion] */
  async cancelOrder(id, reason = '', expectedVersion) {
    return fetchJson(`/orders/${id}/cancel`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ reason, expected_version: expectedVersion }),
    })
  },
  async getAdminOrders(params = {}) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) search.set(key, String(value))
    })
    return fetchJson(
      `/admin/orders${search.size ? `?${search.toString()}` : ''}`,
      { headers: authHeaders() },
    )
  },
  async getAdminOrderDetail(id) {
    return fetchJson(`/admin/orders/${id}`, { headers: authHeaders() })
  },
  async getDashboardMetrics(date = '') {
    const query = date ? `?date=${encodeURIComponent(date)}` : ''
    return fetchJson(`/admin/analytics/dashboard${query}`, {
      headers: authHeaders(),
    })
  },
  /** @param {number} [expectedVersion] */
  async updateAdminOrderStatus(id, status, reason = '', expectedVersion) {
    return fetchJson(`/admin/orders/${id}/status`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        status,
        reason,
        expected_version: expectedVersion,
      }),
    })
  },
  async login(email, password) {
    return fetchJson('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  },
  async register(email, password, displayName) {
    return fetchJson('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, display_name: displayName }),
    })
  },
  async logout() {
    const refresh =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('qhs-refresh-token')
        : null
    try {
      if (refresh) {
        await fetchJson('/auth/logout', {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ refresh }),
        })
      }
    } catch {
      // Ignored
    } finally {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('qhs-access-token')
        sessionStorage.removeItem('qhs-refresh-token')
        sessionStorage.removeItem('qhs-user')
      }
    }
  },
  async getMe() {
    return fetchJson('/auth/me', { headers: authHeaders() })
  },
  /** @param {File | null} file */
  async updateAvatar(file) {
    const body = new FormData()
    if (file) body.set('avatar', file)
    return fetchJson('/auth/me/avatar', {
      method: file ? 'PUT' : 'DELETE',
      headers: authHeaders(),
      body: file ? body : undefined,
    })
  },
  async updateProfile(payload) {
    return fetchJson('/auth/me', {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
  },
  async getAddresses() {
    const addresses = []
    let page = 1
    let next
    do {
      const data = await fetchJson(`/addresses?page=${page}`, {
        headers: authHeaders(),
      })
      if (!Array.isArray(data?.results))
        throw new Error('Dữ liệu địa chỉ không hợp lệ.')
      addresses.push(...data.results)
      next = data.next
      page += 1
    } while (next)
    return addresses
  },
  async createAddress(data) {
    return fetchJson('/addresses', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    })
  },
  async updateAddress(id, data) {
    return fetchJson(`/addresses/${id}`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    })
  },
  async deleteAddress(id) {
    return fetchJson(`/addresses/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
  },
  async getPublicCatalogOptions() {
    const [categoryPage, brandPage] = await Promise.all([
      fetchJson('/categories'),
      fetchJson('/brands'),
    ])
    return { categories: categoryPage.results, brands: brandPage.results }
  },
  async getSearchSuggestions(query) {
    return fetchJson(`/search/suggestions?q=${encodeURIComponent(query)}`)
  },
  async getCatalogProducts(params = {}) {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '')
        search.set(key, String(value))
    })
    const page = await fetchJson(
      `/products${search.size ? `?${search.toString()}` : ''}`,
    )
    const summaries = page.results ?? page
    const details = await Promise.all(
      summaries.map((summary) =>
        fetchJson(`/products/${summary.slug}`).catch(() => null),
      ),
    )
    return {
      products: summaries.map((summary, index) =>
        mapCatalogProduct(summary, details[index]),
      ),
      count: page.count,
      hasNext: Boolean(page.next),
    }
  },
  async getCatalogProduct(slug) {
    const detail = await fetchJson(`/products/${slug}`)
    return mapCatalogProduct(detail, detail)
  },
  async getProducts(page = 1) {
    return fetchJson(`/admin/products?page=${page}`, { headers: authHeaders() })
  },
  async getAdminCatalog(resource, page = 1) {
    return fetchJson(`/admin/${resource}?page=${page}`, {
      headers: authHeaders(),
    })
  },
  async saveAdminCatalog(resource, id, data) {
    return fetchJson(
      id
        ? `/admin/${resource}/${encodeURIComponent(id)}`
        : `/admin/${resource}`,
      {
        method: id ? 'PATCH' : 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data),
      },
    )
  },
  async uploadProductImage(form) {
    return fetchJson('/admin/media/upload', {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })
  },
  async saveProductImage(id, form) {
    return fetchJson(`/admin/media/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: form,
    })
  },
  async renameProductColor(id, color, newColor) {
    return fetchJson(`/admin/products/${encodeURIComponent(id)}/colors`, {
      method: 'PATCH',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ color, new_color: newColor }),
    })
  },
  async getProduct(id) {
    return fetchJson(`/admin/products/${encodeURIComponent(id)}`, {
      headers: authHeaders(),
    })
  },
  async saveProduct(id, product) {
    return fetchJson(
      id ? `/admin/products/${encodeURIComponent(id)}` : '/admin/products',
      {
        method: id ? 'PATCH' : 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(product),
      },
    )
  },
  async getCatalogOptions() {
    const [categoryPage, brandPage] = await Promise.all([
      fetchJson('/admin/categories', { headers: authHeaders() }),
      fetchJson('/admin/brands', { headers: authHeaders() }),
    ])
    return { categories: categoryPage.results, brands: brandPage.results }
  },
  async getCategories() {
    return structuredClone(categories)
  },
  async getBrands() {
    return structuredClone(brands)
  },
  async getColors() {
    return structuredClone(colors)
  },
  async getVouchers() {
    return structuredClone(vouchers)
  },
  async getCurrentUser() {
    return structuredClone(currentUser)
  },
}
