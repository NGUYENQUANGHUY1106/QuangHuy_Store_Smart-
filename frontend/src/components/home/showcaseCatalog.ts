import type { Product } from '../ProductCard'

export type CatalogCategory = {
  id: string
  slug: string
  name: string
  parent_id?: string | null
}

export function categorySlugs(categories: CatalogCategory[], roots: string[]) {
  const selected = new Set(
    categories.filter(({ slug }) => roots.includes(slug)).map(({ id }) => id),
  )
  for (const category of categories) {
    let parent = category.parent_id
    const visited = new Set<string>()
    while (parent && !visited.has(parent)) {
      if (selected.has(parent)) {
        selected.add(category.id)
        break
      }
      visited.add(parent)
      parent = categories.find(({ id }) => id === parent)?.parent_id
    }
  }
  return categories.filter(({ id }) => selected.has(id)).map(({ slug }) => slug)
}

// Side-profile thumbnails verified against the catalog. Keys only override that exact image.
const photoAngles: Record<string, number> = {
  '4e72a069-96b6-487c-b92f-fb6adeaa3e9f': -90,
  'f25d71e9-6b6b-44f1-9163-3367ac14024d': -90,
  'a6b1d5df-4c08-442e-b6ec-a71761062eca': -90,
  '433aa6dd-c3f3-4eb1-afed-9d4d0648a315': -90,
  'f30adff8-5579-4bb1-87be-290c9c396998': -90,
  'f8f94186-ee9c-4ddf-9b91-1bca2a4ae94c': -90,
  '98c01db7-0561-47b2-a38e-ee984b7ba073': -90,
  'b6d6c441-c11d-46d7-9728-ef0b08e97748': -90,
  'fdd7d9eb-641f-4e09-b6b8-60cdfe39759d': -90,
  '15f6b5f6-a6ea-47be-9c1d-e449928cce37': 90,
  'f429ca11-503d-45fa-8b0b-9704039f1877': 90,
  '3da44eaf-cead-4adb-85db-766a06837576': 90,
  '3a1c471e-7da8-49d4-8d4e-9fe77e97cc21': 90,
  '7c180ec6-a385-4464-acf5-b19149ee1339': -90,
  '7f1aafb7-e889-4506-8b4f-175fa16bd79f': 90,
  '7c3261b4-eb03-4d5d-85a3-6f49402a9d2c': -90,
}

function photoKey(url: string) {
  return url.split(/[?#]/, 1)[0].split('/').at(-1) ?? ''
}

export function bootAngle(
  url: string,
  width: number,
  height: number,
  metadata?: number,
) {
  return (
    photoAngles[photoKey(url)] ??
    (typeof metadata === 'number' && Number.isFinite(metadata)
      ? metadata
      : width > height
        ? 90
        : 0)
  )
}

export function showcaseBoots(products: Product[]) {
  const groups = new Map<string, Product[]>()
  for (const product of products) {
    if (
      product.inStock === false ||
      !product.image ||
      product.image.endsWith('/product-placeholder.svg') ||
      photoKey(product.image) === '254e41df-d89a-4a24-a619-be95eac5d105'
    )
      continue
    const brand = groups.get(product.brand)
    if (brand) brand.push(product)
    else groups.set(product.brand, [product])
  }
  const selected: Product[] = []
  for (let round = 0; round < 8 && selected.length < 8; round++) {
    for (const brand of groups.values()) {
      if (brand[round]) selected.push(brand[round])
      if (selected.length === 8) break
    }
  }
  return selected
}
