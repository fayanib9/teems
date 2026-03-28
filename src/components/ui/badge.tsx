import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      color: {
        // Updated colors for WCAG AA contrast compliance (4.5:1 ratio)
        gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        blue: 'bg-blue-50 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
        purple: 'bg-primary-50 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200',
        amber: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
        green: 'bg-green-50 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        red: 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200',
        orange: 'bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200',
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
