import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { mockApi, productImageUrl } from '../services/mockApi'
import { AdminColorFields } from './AdminColorFields'
import { packColorGroups } from './adminColorForm'

export type ProductAssets = {
  status: string
  variants: {
    id: string
    sku: string
    color: string
    size: string
    unit_price: string
    stock_qty: number
  }[]
  images: {
    id: string
    url: string
    alt_text: string
    sort_order: number
    variant_id: string | null
  }[]
}

export function AdminProductAssets({
  id,
  initial,
}: {
  id: string
  initial: ProductAssets
}) {
  const [product, setProduct] = useState(initial)
  const [selectedColor, setSelectedColor] = useState(
    initial.variants[0]?.color ?? '',
  )
  const [editingImage, setEditingImage] = useState('')
  const [addingColor, setAddingColor] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const colors = [...new Set(product.variants.map((variant) => variant.color))]
  const variants = product.variants.filter(
    (variant) => variant.color === selectedColor,
  )
  const images = product.images.filter((image) =>
    selectedColor
      ? variants.some((variant) => variant.id === image.variant_id)
      : image.variant_id === null,
  )
  const image = images.find((asset) => asset.id === editingImage)

  async function save(message: string, action: () => Promise<void>) {
    if (busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await action()
      setProduct(await mockApi.getProduct(id))
      setNotice(message)
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : 'Không thể lưu thay đổi.',
      )
    } finally {
      setBusy(false)
    }
  }

  function submitImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) form.delete('file')
    form.set('product_id', id)
    if (!image) form.set('variant_id', variants[0]?.id ?? '')
    const formElement = event.currentTarget
    void save(
      image ? 'Đã cập nhật ảnh.' : 'Đã thêm ảnh chi tiết.',
      async () => {
        if (image) await mockApi.saveProductImage(image.id, form)
        else await mockApi.uploadProductImage(form)
        formElement.reset()
        setEditingImage('')
      },
    )
  }

  return (
    <div id="product-assets" className="admin-form-layout admin-product-assets">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Màu sắc, giá và ảnh</h2>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => setAddingColor(!addingColor)}
          >
            {addingColor ? 'Hủy thêm màu' : 'Thêm phối màu'}
          </Button>
        </div>
        <label className="admin-asset-color">
          Màu đang chỉnh
          <select
            value={selectedColor}
            disabled={busy}
            onChange={(event) => {
              setSelectedColor(event.target.value)
              setEditingImage('')
            }}
          >
            <option value="">Ảnh chung của sản phẩm</option>
            {colors.map((color) => (
              <option key={color}>{color}</option>
            ))}
          </select>
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="admin-notice" role="status">
            {notice}
          </p>
        )}
        {addingColor && (
          <form
            className="admin-color-groups"
            onSubmit={(event) => {
              event.preventDefault()
              const fields = new FormData(event.currentTarget)
              void save('Đã thêm phối màu, ảnh và tồn kho.', async () => {
                await mockApi.saveProductColors(
                  packColorGroups(fields, [0]),
                  id,
                )
                setSelectedColor(String(fields.get('color-0-name')).trim())
                setEditingImage('')
                setAddingColor(false)
              })
            }}
          >
            <AdminColorFields group={0} number={colors.length + 1} />
            <Button type="submit" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu phối màu mới'}
            </Button>
          </form>
        )}
        {selectedColor ? (
          <>
            <form
              className="admin-color-rename"
              key={selectedColor}
              onSubmit={(event) => {
                event.preventDefault()
                const newColor = String(
                  new FormData(event.currentTarget).get('new_color'),
                ).trim()
                void save('Đã cập nhật tên màu cho các size.', async () => {
                  await mockApi.renameProductColor(id, selectedColor, newColor)
                  setSelectedColor(newColor)
                })
              }}
            >
              <label>
                Tên màu
                <input
                  name="new_color"
                  defaultValue={selectedColor}
                  required
                  maxLength={32}
                />
              </label>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={busy}
              >
                Đổi tên màu
              </Button>
            </form>
            <div className="admin-variant-prices">
              {variants.map((variant) => (
                <form
                  className="admin-color-rename"
                  key={variant.id}
                  onSubmit={(event) => {
                    event.preventDefault()
                    const unitPrice = String(
                      new FormData(event.currentTarget).get('unit_price'),
                    )
                    void save(
                      `Đã cập nhật giá size ${variant.size}.`,
                      async () => {
                        await mockApi.saveAdminCatalog('variants', variant.id, {
                          unit_price: unitPrice,
                        })
                      },
                    )
                  }}
                >
                  <label>
                    Giá size {variant.size} (₫)
                    <small>
                      {variant.sku} · Tồn hiện tại: {variant.stock_qty}
                    </small>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="unit_price"
                      required
                      defaultValue={variant.unit_price}
                    />
                  </label>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                  >
                    Lưu giá
                  </Button>
                </form>
              ))}
            </div>
            <Link to="/admin/inventory" className="text-link">
              Điều chỉnh tồn kho
            </Link>
          </>
        ) : (
          <p>Chọn một màu để sửa giá theo size và quản lý ảnh của màu đó.</p>
        )}
      </section>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>
            Ảnh chi tiết {selectedColor ? `· ${selectedColor}` : '· Dùng chung'}
          </h2>
        </div>
        {product.status !== 'published' && (
          <p>Ảnh lưu trong database sẽ hiển thị sau khi công khai sản phẩm.</p>
        )}
        {images.length ? (
          <ul className="admin-asset-list">
            {images.map((asset, index) => (
              <li key={asset.id}>
                {product.status === 'published' && (
                  <img
                    src={productImageUrl(asset.url)}
                    alt={asset.alt_text || ''}
                    loading="lazy"
                  />
                )}
                <span>
                  {index === 0 ? 'Ảnh chính' : `Ảnh phụ ${index}`} ·{' '}
                  {asset.alt_text || 'Chưa có mô tả'}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => setEditingImage(asset.id)}
                >
                  Sửa ảnh {index + 1}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Chưa có ảnh trong nhóm này.</p>
        )}
        <form
          className="admin-form-grid admin-asset-upload"
          key={image?.id ?? selectedColor}
          onSubmit={submitImage}
        >
          <div className="admin-editor-full">
            <h3>{image ? 'Chỉnh sửa ảnh' : 'Thêm ảnh chi tiết'}</h3>
            <p className="admin-editor-hint">
              JPG, PNG hoặc WebP · tối đa 5 MB mỗi ảnh.
            </p>
          </div>
          <label>
            {image ? 'Tệp thay thế (nếu cần)' : 'Chọn tệp ảnh'}
            <input
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required={!image}
            />
          </label>
          <label>
            Mô tả ảnh
            <input
              name="alt_text"
              maxLength={200}
              defaultValue={image?.alt_text ?? ''}
            />
          </label>
          {image && (
            <label>
              Thứ tự hiển thị
              <input
                name="sort_order"
                type="number"
                step="1"
                min="0"
                required
                defaultValue={image.sort_order}
              />
            </label>
          )}
          <div className="hero-actions">
            {image && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => setEditingImage('')}
              >
                Hủy sửa
              </Button>
            )}
            <Button type="submit" disabled={busy}>
              {image ? 'Lưu ảnh' : 'Thêm ảnh'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
