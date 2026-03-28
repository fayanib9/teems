export const EVENT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'planning', label: 'Planning', color: 'blue' },
  { value: 'confirmed', label: 'Confirmed', color: 'purple' },
  { value: 'in_progress', label: 'In Progress', color: 'amber' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'postponed', label: 'Postponed', color: 'orange' },
] as const

export const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: 'gray' },
  { value: 'in_progress', label: 'In Progress', color: 'blue' },
  { value: 'in_review', label: 'In Review', color: 'purple' },
  { value: 'blocked', label: 'Blocked', color: 'red' },
  { value: 'done', label: 'Done', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
] as const

export const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'gray' },
  { value: 'medium', label: 'Medium', color: 'blue' },
  { value: 'high', label: 'High', color: 'amber' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
] as const

export const APPROVAL_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'amber' },
  { value: 'in_review', label: 'In Review', color: 'blue' },
  { value: 'approved', label: 'Approved', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
] as const

export const VENDOR_CATEGORIES = [
  'catering',
  'av_equipment',
  'decoration',
  'security',
  'transportation',
  'photography',
  'printing',
  'venue',
  'entertainment',
  'other',
] as const

export const SPEAKER_ROLES = [
  { value: 'keynote', label: 'Keynote Speaker' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'panelist', label: 'Panelist' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'mc', label: 'MC / Host' },
] as const

export const SESSION_TYPES = [
  { value: 'keynote', label: 'Keynote' },
  { value: 'panel', label: 'Panel Discussion' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'break', label: 'Break' },
  { value: 'networking', label: 'Networking' },
  { value: 'ceremony', label: 'Ceremony' },
  { value: 'other', label: 'Other' },
] as const

export const DOCUMENT_CATEGORIES = [
  { value: 'contract', label: 'Contract' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'floor_plan', label: 'Floor Plan' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'permit', label: 'Permit' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'other', label: 'Other' },
] as const

export const EVENT_ROLES = [
  { value: 'lead', label: 'Event Lead' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'support', label: 'Support' },
  { value: 'observer', label: 'Observer' },
] as const

export const BOOTH_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'custom', label: 'Custom' },
] as const

export const PACKAGE_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'custom', label: 'Custom' },
] as const

// ─── Tools Constants ──────────────────────────────────────────────

export const EVENT_CATEGORIES = ['conference', 'exhibition', 'gala', 'corporate', 'activation']

export const SERVICES = [
  { key: 'production', label: 'Production', icon: 'Film', description: 'AV, staging, lighting, and sound' },
  { key: 'content', label: 'Content', icon: 'FileText', description: 'Content creation, presentations, and media' },
  { key: 'registration', label: 'Registration', icon: 'UserCheck', description: 'Registration platform and check-in' },
  { key: 'catering', label: 'Catering', icon: 'UtensilsCrossed', description: 'Food, beverages, and dining' },
  { key: 'branding', label: 'Branding', icon: 'Palette', description: 'Visual identity, signage, and print' },
  { key: 'logistics', label: 'Logistics', icon: 'Truck', description: 'Transport, shipping, and setup' },
  { key: 'staffing', label: 'Staffing', icon: 'Users', description: 'Event staff, ushers, and support' },
  { key: 'marketing', label: 'Marketing', icon: 'Megaphone', description: 'Promotion, PR, and campaigns' },
]

export const BUDGET_RANGES = [
  { key: 'under_500k', label: 'Under 500K SAR', min: 0, max: 50000000 },
  { key: '500k_2m', label: '500K – 2M SAR', min: 50000000, max: 200000000 },
  { key: '2m_10m', label: '2M – 10M SAR', min: 200000000, max: 1000000000 },
  { key: 'over_10m', label: '10M+ SAR', min: 1000000000, max: null },
]

export const AUDIENCE_TYPES = ['vip', 'public', 'internal', 'mixed']

export const VENUE_TYPES = ['indoor', 'outdoor', 'hybrid']

export const URGENCY_LEVELS = [
  { key: 'normal', label: 'Normal', color: '#059669', description: 'Standard timeline' },
  { key: 'fast_track', label: 'Fast Track', color: '#D97706', description: '30% compressed timeline' },
  { key: 'critical', label: 'Critical', color: '#DC2626', description: '50% compressed, high risk' },
]

export const RISK_LEVELS = ['low', 'medium', 'high', 'critical']

export const PLAN_STATUSES = ['generated', 'active', 'completed', 'archived']

export const PLAN_TASK_STATUSES = ['pending', 'in_progress', 'completed', 'skipped']

export const PLAN_PHASES = [
  { name: 'Strategy', color: '#312C6A', icon: 'Target' },
  { name: 'Planning', color: '#2563EB', icon: 'ClipboardList' },
  { name: 'Procurement', color: '#059669', icon: 'ShoppingCart' },
  { name: 'Execution', color: '#D97706', icon: 'Rocket' },
  { name: 'Closure', color: '#6B7280', icon: 'CheckCircle' },
]
