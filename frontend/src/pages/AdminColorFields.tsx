import { useState } from 'react'
import { Button } from '../components/Button'

export function AdminColorFields({
  group,
  number,
  remove,
}: {
  group: number
  number: number
  remove?: () => void
}) {
  const [rows, setRows] = useState([0])
  const prefix = `color-${group}-`
  return (
    <fieldset className="admin-color-fields">
      <legend>Phối màu {number}</legend>
      <div className="admin-form-grid">
        <label>
          Tên màu{' '}
          <input
            name={prefix + 'name'}
            placeholder="Ví dụ: Đỏ"
            maxLength={32}
            required
          />
        </label>
        <label>
          Ảnh chính{' '}
          <input
            name={prefix + 'main'}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </label>
        <label>
          Ảnh phụ{' '}
          <input
            name={prefix + 'extras'}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
          />
        </label>
        <p className="admin-editor-hint">
          Chọn tối đa 8 ảnh phụ. JPG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh.
        </p>
      </div>
      <div className="admin-size-rows">
        {rows.map((row, index) => (
          <div className="admin-size-row" key={row}>
            <label>
              Size{' '}
              <input
                name={prefix + 'size'}
                placeholder="Ví dụ: 40"
                maxLength={16}
                required
              />
            </label>
            <label>
              Giá bán (₫){' '}
              <input
                name={prefix + 'price'}
                type="number"
                min="0"
                max="999999999999.99"
                step="0.01"
                required
              />
            </label>
            <label>
              Tồn ban đầu{' '}
              <input
                name={prefix + 'stock'}
                type="number"
                min="0"
                max="2147483647"
                step="1"
                defaultValue={0}
                required
              />
            </label>
            {rows.length > 1 && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                aria-label={`Bỏ dòng size ${index + 1}`}
                onClick={() => setRows(rows.filter((item) => item !== row))}
              >
                Bỏ
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="hero-actions">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={rows.length >= 30}
          onClick={() => setRows([...rows, Math.max(...rows) + 1])}
        >
          Thêm size
        </Button>
        {remove && (
          <Button type="button" size="sm" variant="ghost" onClick={remove}>
            Bỏ phối màu
          </Button>
        )}
      </div>
    </fieldset>
  )
}
