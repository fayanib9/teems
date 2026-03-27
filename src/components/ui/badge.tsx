import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      color: {
        gray: 'bg-gray-100 text-gray-700',
        blue: 'bg-blue-50 text-blue-700',
        purple: 'bg-primary-50 text-primary-700',
        amber: 'bg-amber-50 text-amber-700',
        green: 'bg-green-50 text-green-700',
        red: 'bg-red-50 text-red-700',
        orange: 'bg-orange-50 text-orange-700',
      },
    },
    defaultVariants: {
      color: 'gray',
    },
  }
)

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, color, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ color, className }))} {...props} />
}
