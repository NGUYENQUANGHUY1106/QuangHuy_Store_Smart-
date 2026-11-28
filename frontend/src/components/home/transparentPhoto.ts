const photos = new Map<string, Promise<Blob>>()
const maxCachedPhotos = 48

export function transparentPhoto(
  src: string,
  priority?: 'high' | 'low' | 'auto',
) {
  const cached = photos.get(src)
  if (cached) return cached
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.fetchPriority = priority ?? 'auto'
  image.src = src
  const result = image
    .decode()
    .then(() => cutOutStudioPhoto(image))
    .catch((error: unknown) => {
      photos.delete(src)
      throw error
    })
  if (photos.size >= maxCachedPhotos) {
    const oldest = photos.keys().next().value
    if (oldest) photos.delete(oldest)
  }
  photos.set(src, result)
  return result
}

async function cutOutStudioPhoto(image: HTMLImageElement): Promise<Blob> {
  const ratio = Math.min(
    1,
    700 / Math.max(image.naturalWidth, image.naturalHeight),
  )
  const width = Math.max(1, Math.round(image.naturalWidth * ratio))
  const height = Math.max(1, Math.round(image.naturalHeight * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, width, height)
  const frame = ctx.getImageData(0, 0, width, height)
  const { data } = frame
  const pixels = width * height
  const distance = new Uint8Array(pixels)
  const queue = new Int32Array(pixels)
  const outside = new Uint8Array(pixels)
  let hasAlpha = false

  // Estimate the studio backdrop per row, then remove only pixels connected to an edge.
  for (let y = 0; y < height; y++) {
    const left = y * width * 4
    const right = left + (width - 1) * 4
    for (let x = 0; x < width; x++) {
      const pixel = y * width + x
      const blend = x / Math.max(1, width - 1)
      let gap = 0
      for (let channel = 0; channel < 3; channel++) {
        const background =
          data[left + channel] +
          (data[right + channel] - data[left + channel]) * blend
        gap = Math.max(gap, Math.abs(data[pixel * 4 + channel] - background))
      }
      distance[pixel] = gap
      if (data[pixel * 4 + 3] < 240) hasAlpha = true
    }
  }

  if (!hasAlpha) {
    let length = 0
    function enqueue(pixel: number, threshold: number, marker: number) {
      if (outside[pixel] || distance[pixel] > threshold) return
      outside[pixel] = marker
      queue[length++] = pixel
    }
    function flood(threshold: number, marker: number) {
      for (let cursor = 0; cursor < length; cursor++) {
        const pixel = queue[cursor]
        if (pixel % width > 0) enqueue(pixel - 1, threshold, marker)
        if (pixel % width < width - 1) enqueue(pixel + 1, threshold, marker)
        if (pixel >= width) enqueue(pixel - width, threshold, marker)
        if (pixel < pixels - width) enqueue(pixel + width, threshold, marker)
      }
    }
    for (let x = 0; x < width; x++) {
      enqueue(x, 7, 1)
      enqueue(x + pixels - width, 7, 1)
    }
    for (let y = 1; y < height - 1; y++) {
      enqueue(y * width, 7, 1)
      enqueue(y * width + width - 1, 7, 1)
    }
    flood(7, 1)

    // Openings formed by straps can contain a large patch of the exact backdrop.
    for (let start = 0; start < pixels; start++) {
      if (outside[start] || distance[start] > 3) continue
      length = 0
      enqueue(start, 3, 2)
      flood(3, 2)
      if (length >= Math.max(72, pixels * 0.002)) {
        for (let cursor = 0; cursor < length; cursor++)
          outside[queue[cursor]] = 1
      }
    }

    for (let pixel = 0; pixel < pixels; pixel++) {
      const offset = pixel * 4 + 3
      if (outside[pixel] === 1) {
        data[offset] = 0
        continue
      }
      if (distance[pixel] >= 22) continue
      const x = pixel % width
      const edge =
        (x > 0 && outside[pixel - 1] === 1) ||
        (x < width - 1 && outside[pixel + 1] === 1) ||
        outside[pixel - width] === 1 ||
        outside[pixel + width] === 1
      if (edge) data[offset] = Math.round(((distance[pixel] - 7) * 255) / 15)
    }
  }

  let x0 = width
  let y0 = height
  let x1 = 0
  let y1 = 0
  for (let pixel = 0; pixel < pixels; pixel++) {
    if (data[pixel * 4 + 3] < 45) continue
    const x = pixel % width
    const y = Math.floor(pixel / width)
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  if (x1 <= x0 || y1 <= y0) throw new Error('Product silhouette is unavailable')
  canvas.width = x1 - x0 + 9
  canvas.height = y1 - y0 + 9
  ctx.putImageData(frame, 4 - x0, 4 - y0, x0, y0, x1 - x0 + 1, y1 - y0 + 1)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('PNG unavailable'))
    }, 'image/png')
  })
}
