import { Badge } from './badge'
import { EVENT_STATUSES, TASK_STATUSES, PRIORITIES, APPROVAL_STATUSES } from '@/lib/constants'
import type { StatusColor } from '@/types'

type StatusBadgeProps = {
  type: 'event' | 'task' | 'priority' | 'approval'
  value: string
}

const statusMaps = {
  event: EVENT_STATUSES,
  task: TASK_STATUSES,
  priority: PRIORITIES,
  approval: APPROVAL_STATUSES,
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  const items = statusMaps[type]
  const item = items.find((s) => s.value === value)
  if (!item) return <Badge color="gray">{value}</Badge>
  return <Badge color={item.color as StatusColor}>{item.label}</Badge>
}
