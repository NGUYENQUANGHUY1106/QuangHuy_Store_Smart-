import { ImageOff } from 'lucide-react'
import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'
import { transparentPhoto } from './transparentPhoto'

const placeholder = '/images/product-placeholder.svg'

export function ShowcaseImage({
  src,
  loading,
  fetchPriority,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const target = useRef<HTMLSpanElement>(null)
  const [result, setResult] = useState<{ src: string; url?: string }>()

  useEffect(() => {
    if (!src || src.endsWith(placeholder)) return
    let active = true
    let objectUrl: string | undefined
    function load(source: string) {
      transparentPhoto(source, fetchPriority)
        .then((blob) => {
          if (!active) return
          objectUrl = URL.createObjectURL(blob)
          setResult({ src: source, url: objectUrl })
        })
        .catch(() => {
          if (active) setResult({ src: source })
        })
    }

    let observer: IntersectionObserver | undefined
    if (
      loading === 'lazy' &&
      target.current &&
      typeof IntersectionObserver !== 'undefined'
    ) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          observer?.disconnect()
          load(src)
        },
        { rootMargin: '500px' },
      )
      observer.observe(target.current)
    } else load(src)

    return () => {
      active = false
      observer?.disconnect()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src, loading, fetchPriority])

  const url = result?.src === src ? result?.url : undefined
  const failed = (result?.src === src && !url) || src?.endsWith(placeholder)
  if (!url)
    return (
      <span
        ref={target}
        className={`${props.className ?? ''} showcase-photo-pending`}
        role={failed && props.alt ? 'img' : undefined}
        aria-label={
          failed && props.alt ? `Chưa có ảnh cho ${props.alt}` : undefined
        }
        aria-hidden={failed && props.alt ? undefined : true}
      >
        {failed && <ImageOff size={22} aria-hidden="true" />}
      </span>
    )
  return <img {...props} src={url} decoding="async" />
}
