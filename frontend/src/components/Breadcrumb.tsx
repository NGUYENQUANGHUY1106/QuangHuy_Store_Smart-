import { Link } from 'react-router-dom'

export function Breadcrumb({
  items,
}: {
  items: Array<{ label: string; href?: string }>
}) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="breadcrumb-item">
          {item.href ? (
            <Link to={item.href}>{item.label}</Link>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && <span aria-hidden="true">/</span>}
        </span>
      ))}
    </nav>
  )
}
