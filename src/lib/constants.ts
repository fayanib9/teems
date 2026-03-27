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
