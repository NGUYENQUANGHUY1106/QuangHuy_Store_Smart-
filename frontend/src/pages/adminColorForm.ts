export function packColorGroups(form: FormData, groups: number[]) {
  const payload = new FormData()
  const files = [...form.values()].filter(
    (entry): entry is File => entry instanceof File,
  )
  if (files.some((entry) => entry.size > 5 * 1024 * 1024))
    throw new Error('Mỗi ảnh có dung lượng tối đa 5 MB.')
  if (files.reduce((total, entry) => total + entry.size, 0) > 50 * 1024 * 1024)
    throw new Error('Tổng dung lượng ảnh mỗi lần lưu tối đa 50 MB.')
  payload.set(
    'colors',
    JSON.stringify(
      groups.map((group, index) => {
        const prefix = `color-${group}-`
        const main = form.get(prefix + 'main')
        if (main instanceof File && main.size)
          payload.append(`main_${index}`, main)
        const extras = form
          .getAll(prefix + 'extras')
          .filter((file) => file instanceof File && file.size)
        if (extras.length > 8)
          throw new Error('Mỗi màu được chọn tối đa 8 ảnh phụ.')
        extras.forEach((file) => payload.append(`extras_${index}`, file))
        return {
          color: String(form.get(prefix + 'name') ?? '').trim(),
          sizes: form.getAll(prefix + 'size').map((size, row) => ({
            size: String(size).trim(),
            unit_price: form.getAll(prefix + 'price')[row],
            stock_qty: Number(form.getAll(prefix + 'stock')[row]),
          })),
        }
      }),
    ),
  )
  return payload
}
