import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />}
            {isLast || !item.href ? (
              <span className={isLast ? 'text-text-primary font-medium' : 'text-text-tertiary'}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-text-secondary hover:text-primary-500 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
