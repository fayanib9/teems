import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

type AvatarProps = {
  src?: string | null
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

export function Avatar({ src, firstName, lastName, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full bg-primary-100 text-primary-700 font-medium flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {getInitials(firstName, lastName)}
    </div>
  )
}
