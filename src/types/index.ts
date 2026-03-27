export type EventStatus = 'draft' | 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'done' | 'cancelled'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type ApprovalStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled'
export type UserType = 'internal' | 'external'

export type NavItem = {
  label: string
  href: string
  icon: string
  permission?: string
  badge?: number
}

export type NavSection = {
  title: string
  items: NavItem[]
}

export type BreadcrumbItem = {
  label: string
  href?: string
}

export type StatusColor = 'gray' | 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'orange'
