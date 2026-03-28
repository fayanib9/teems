import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core'

// ─── Core Identity ──────────────────────────────────────────────

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  display_name: varchar('display_name', { length: 100 }).notNull(),
  description: text('description'),
  is_system: boolean('is_system').default(false),
  created_at: timestamp('created_at').defaultNow(),
})

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  avatar_path: text('avatar_path'),
  role_id: integer('role_id').references(() => roles.id),
  user_type: varchar('user_type', { length: 20 }).notNull().default('internal'),
  is_active: boolean('is_active').default(true),
  last_login_at: timestamp('last_login_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('users_role_idx').on(table.role_id),
  index('users_type_idx').on(table.user_type),
])

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  module: varchar('module', { length: 50 }).notNull(),
  action: varchar('action', { length: 20 }).notNull(),
  description: text('description'),
}, (table) => [
  uniqueIndex('permissions_module_action_idx').on(table.module, table.action),
])

export const role_permissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  role_id: integer('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permission_id: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
}, (table) => [
  uniqueIndex('role_perm_unique_idx').on(table.role_id, table.permission_id),
])

// ─── Teams ──────────────────────────────────────────────────────

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  lead_id: integer('lead_id').references(() => users.id),
  color: varchar('color', { length: 7 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
})

export const team_members = pgTable('team_members', {
  id: serial('id').primaryKey(),
  team_id: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joined_at: timestamp('joined_at').defaultNow(),
}, (table) => [
  uniqueIndex('team_member_unique_idx').on(table.team_id, table.user_id),
])

// ─── Events Core ────────────────────────────────────────────────

export const event_types = pgTable('event_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
})

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  contact_name: varchar('contact_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  website: varchar('website', { length: 255 }),
  logo_path: text('logo_path'),
  notes: text('notes'),
  user_id: integer('user_id').references(() => users.id),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 300 }).notNull(),
  slug: varchar('slug', { length: 300 }).notNull().unique(),
  description: text('description'),
  event_type_id: integer('event_type_id').references(() => event_types.id),
  client_id: integer('client_id').references(() => clients.id),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  priority: varchar('priority', { length: 10 }).default('medium'),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Riyadh'),
  venue_name: varchar('venue_name', { length: 200 }),
  venue_address: text('venue_address'),
  venue_city: varchar('venue_city', { length: 100 }),
  venue_country: varchar('venue_country', { length: 100 }),
  expected_attendees: integer('expected_attendees'),
  actual_attendees: integer('actual_attendees'),
  budget_estimated: integer('budget_estimated'),
  budget_actual: integer('budget_actual'),
  currency: varchar('currency', { length: 3 }).default('SAR'),
  notes: text('notes'),
  cover_image_path: text('cover_image_path'),
  health_score: varchar('health_score', { length: 10 }).default('green'), // green, amber, red
  completion_percentage: integer('completion_percentage').default(0),
  created_by: integer('created_by').references(() => users.id),
  updated_by: integer('updated_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('events_status_idx').on(table.status),
  index('events_client_idx').on(table.client_id),
  index('events_dates_idx').on(table.start_date, table.end_date),
])

export const event_assignments = pgTable('event_assignments', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => users.id),
  role_in_event: varchar('role_in_event', { length: 30 }).default('support'),
  assigned_by: integer('assigned_by').references(() => users.id),
  assigned_at: timestamp('assigned_at').defaultNow(),
}, (table) => [
  uniqueIndex('event_assignment_unique_idx').on(table.event_id, table.user_id),
])

export const event_teams = pgTable('event_teams', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  team_id: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  assigned_at: timestamp('assigned_at').defaultNow(),
}, (table) => [
  uniqueIndex('event_team_unique_idx').on(table.event_id, table.team_id),
])

// ─── Tasks & Milestones ─────────────────────────────────────────

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  due_date: timestamp('due_date').notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('milestones_event_idx').on(table.event_id),
])

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  milestone_id: integer('milestone_id').references(() => milestones.id),
  parent_task_id: integer('parent_task_id'),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('todo'),
  priority: varchar('priority', { length: 10 }).default('medium'),
  assigned_to: integer('assigned_to').references(() => users.id),
  assigned_team_id: integer('assigned_team_id').references(() => teams.id),
  due_date: timestamp('due_date'),
  start_date: timestamp('start_date'),
  completed_at: timestamp('completed_at'),
  estimated_hours: integer('estimated_hours'),
  actual_hours: integer('actual_hours'),
  sort_order: integer('sort_order').default(0),
  version: integer('version').notNull().default(1), // optimistic locking
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('tasks_event_idx').on(table.event_id),
  index('tasks_assignee_idx').on(table.assigned_to),
  index('tasks_status_idx').on(table.status),
  index('tasks_due_idx').on(table.due_date),
])

export const task_comments = pgTable('task_comments', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  attachment_path: text('attachment_path'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('task_comments_task_idx').on(table.task_id),
])

export const task_dependencies = pgTable('task_dependencies', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  depends_on_task_id: integer('depends_on_task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
}, (table) => [
  uniqueIndex('task_dep_unique_idx').on(table.task_id, table.depends_on_task_id),
])

// ─── Vendors ────────────────────────────────────────────────────

export const vendors = pgTable('vendors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }),
  contact_name: varchar('contact_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  website: varchar('website', { length: 255 }),
  logo_path: text('logo_path'),
  tax_number: varchar('tax_number', { length: 50 }),
  bank_details: text('bank_details'),
  rating: integer('rating'),
  notes: text('notes'),
  user_id: integer('user_id').references(() => users.id),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const event_vendors = pgTable('event_vendors', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  vendor_id: integer('vendor_id').notNull().references(() => vendors.id),
  service_description: text('service_description'),
  contract_amount: integer('contract_amount'),
  status: varchar('status', { length: 20 }).default('pending'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('event_vendors_event_idx').on(table.event_id),
  index('event_vendors_vendor_idx').on(table.vendor_id),
])

// ─── Speakers ───────────────────────────────────────────────────

export const speakers = pgTable('speakers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  title: varchar('title', { length: 200 }),
  organization: varchar('organization', { length: 200 }),
  bio: text('bio'),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  photo_path: text('photo_path'),
  website: varchar('website', { length: 255 }),
  social_links: text('social_links'),
  user_id: integer('user_id').references(() => users.id),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  session_type: varchar('session_type', { length: 30 }),
  date: timestamp('date').notNull(),
  start_time: varchar('start_time', { length: 5 }).notNull(),
  end_time: varchar('end_time', { length: 5 }).notNull(),
  location: varchar('location', { length: 200 }),
  capacity: integer('capacity'),
  sort_order: integer('sort_order').default(0),
  status: varchar('status', { length: 20 }).default('scheduled'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('sessions_event_idx').on(table.event_id),
])

export const event_speakers = pgTable('event_speakers', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  speaker_id: integer('speaker_id').notNull().references(() => speakers.id),
  session_id: integer('session_id').references(() => sessions.id),
  role: varchar('role', { length: 20 }).default('speaker'),
  fee: integer('fee'),
  status: varchar('status', { length: 20 }).default('invited'),
  travel_required: boolean('travel_required').default(false),
  accommodation_notes: text('accommodation_notes'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('event_speakers_event_idx').on(table.event_id),
  index('event_speakers_speaker_idx').on(table.speaker_id),
])

// ─── Exhibitors & Booths ───────────────────────────────────────

export const exhibitors = pgTable('exhibitors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  contact_name: varchar('contact_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  website: varchar('website', { length: 255 }),
  logo_path: text('logo_path'),
  industry: varchar('industry', { length: 100 }),
  notes: text('notes'),
  user_id: integer('user_id').references(() => users.id),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const booths = pgTable('booths', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  booth_number: varchar('booth_number', { length: 20 }).notNull(),
  size: varchar('size', { length: 20 }),
  dimensions: varchar('dimensions', { length: 20 }),
  location_zone: varchar('location_zone', { length: 100 }),
  price: integer('price'),
  amenities: text('amenities'),
  status: varchar('status', { length: 20 }).default('available'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('booths_event_idx').on(table.event_id),
])

export const event_exhibitors = pgTable('event_exhibitors', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  exhibitor_id: integer('exhibitor_id').notNull().references(() => exhibitors.id),
  booth_id: integer('booth_id').references(() => booths.id),
  package_type: varchar('package_type', { length: 20 }),
  contract_amount: integer('contract_amount'),
  status: varchar('status', { length: 20 }).default('pending'),
  special_requirements: text('special_requirements'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('event_exhibitors_event_idx').on(table.event_id),
  index('event_exhibitors_exhibitor_idx').on(table.exhibitor_id),
])

// ─── Documents ──────────────────────────────────────────────────

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').references(() => events.id),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  file_path: text('file_path').notNull(),
  file_name: varchar('file_name', { length: 300 }).notNull(),
  file_size: integer('file_size'),
  mime_type: varchar('mime_type', { length: 100 }),
  category: varchar('category', { length: 30 }),
  visibility: varchar('visibility', { length: 20 }).default('internal'), // internal, client, all
  version: integer('version').default(1),
  parent_document_id: integer('parent_document_id'),
  folder: varchar('folder', { length: 200 }),
  uploaded_by: integer('uploaded_by').references(() => users.id),
  is_archived: boolean('is_archived').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('documents_event_idx').on(table.event_id),
  index('documents_visibility_idx').on(table.visibility),
])

// ─── Approvals ──────────────────────────────────────────────────

export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').references(() => events.id),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 30 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  reference_type: varchar('reference_type', { length: 30 }),
  reference_id: integer('reference_id'),
  requested_by: integer('requested_by').references(() => users.id),
  resolved_at: timestamp('resolved_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('approvals_event_idx').on(table.event_id),
  index('approvals_status_idx').on(table.status),
])

export const approval_steps = pgTable('approval_steps', {
  id: serial('id').primaryKey(),
  approval_id: integer('approval_id').notNull().references(() => approvals.id, { onDelete: 'cascade' }),
  step_order: integer('step_order').notNull(),
  approver_id: integer('approver_id').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending'),
  comment: text('comment'),
  decided_at: timestamp('decided_at'),
  version: integer('version').notNull().default(1), // optimistic locking
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('approval_steps_approval_idx').on(table.approval_id),
])

// ─── Tags & Categories ──────────────────────────────────────────

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  parent_id: integer('parent_id'),
  color: varchar('color', { length: 7 }),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
})

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  color: varchar('color', { length: 7 }),
  created_at: timestamp('created_at').defaultNow(),
})

export const taggables = pgTable('taggables', {
  id: serial('id').primaryKey(),
  tag_id: integer('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  taggable_type: varchar('taggable_type', { length: 30 }).notNull(),
  taggable_id: integer('taggable_id').notNull(),
}, (table) => [
  index('taggables_type_id_idx').on(table.taggable_type, table.taggable_id),
])

// ─── Event-Day Operations ───────────────────────────────────────

export const run_sheet_items = pgTable('run_sheet_items', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  scheduled_time: timestamp('scheduled_time'),
  duration_minutes: integer('duration_minutes'),
  location: varchar('location', { length: 200 }),
  responsible_user_id: integer('responsible_user_id').references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending'), // pending, in_progress, completed, skipped
  sort_order: integer('sort_order').default(0),
  notes: text('notes'),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('run_sheet_event_idx').on(table.event_id),
])

export const event_issues = pgTable('event_issues', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 300 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 20 }).default('medium'), // low, medium, high, critical
  status: varchar('status', { length: 20 }).default('open'), // open, in_progress, resolved
  reported_by: integer('reported_by').references(() => users.id),
  assigned_to: integer('assigned_to').references(() => users.id),
  resolution: text('resolution'),
  resolved_at: timestamp('resolved_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('event_issues_event_idx').on(table.event_id),
])

// ─── Activity & Notifications ───────────────────────────────────

export const activity_logs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id),
  event_id: integer('event_id').references(() => events.id),
  action: varchar('action', { length: 30 }).notNull(),
  resource: varchar('resource', { length: 30 }).notNull(),
  resource_id: integer('resource_id'),
  details: text('details'),
  ip_address: varchar('ip_address', { length: 45 }),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('activity_user_idx').on(table.user_id),
  index('activity_event_idx').on(table.event_id),
  index('activity_created_idx').on(table.created_at),
])

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  link: text('link'),
  reference_type: varchar('reference_type', { length: 30 }),
  reference_id: integer('reference_id'),
  is_read: boolean('is_read').default(false),
  is_emailed: boolean('is_emailed').default(false),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('notif_user_read_idx').on(table.user_id, table.is_read),
])

// ─── Settings ───────────────────────────────────────────────────

export const settings = pgTable('settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const email_templates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  subject: varchar('subject', { length: 300 }).notNull(),
  body: text('body').notNull(),
  is_active: boolean('is_active').default(true),
  updated_at: timestamp('updated_at').defaultNow(),
})

// ─── Tools: Plan Generator ─────────────────────────────────────

export const plan_roles = pgTable('plan_roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 7 }),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
})

export const plan_templates = pgTable('plan_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  event_type: varchar('event_type', { length: 50 }),
  min_attendees: integer('min_attendees'),
  max_attendees: integer('max_attendees'),
  is_default: boolean('is_default').default(false),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const plan_template_phases = pgTable('plan_template_phases', {
  id: serial('id').primaryKey(),
  template_id: integer('template_id').notNull().references(() => plan_templates.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  sort_order: integer('sort_order').notNull(),
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('plan_template_phases_template_idx').on(table.template_id),
])

export const plan_template_tasks = pgTable('plan_template_tasks', {
  id: serial('id').primaryKey(),
  phase_id: integer('phase_id').notNull().references(() => plan_template_phases.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 300 }).notNull(),
  duration_days: integer('duration_days').notNull().default(5),
  role: varchar('role', { length: 100 }),
  is_optional: boolean('is_optional').default(false),
  dependencies: text('dependencies'),
  sort_order: integer('sort_order').notNull(),
  description: text('description'),
}, (table) => [
  index('plan_template_tasks_phase_idx').on(table.phase_id),
])

export const plan_rules = pgTable('plan_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(),
  condition: text('condition').notNull(),
  actions: text('actions').notNull(),
  priority: integer('priority').notNull().default(100),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('plan_rules_category_idx').on(table.category),
  index('plan_rules_active_idx').on(table.is_active),
])

export const generated_plans = pgTable('generated_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 300 }).notNull(),
  client_name: varchar('client_name', { length: 200 }).notNull(),
  event_id: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
  form_data: text('form_data').notNull(),
  template_used: varchar('template_used', { length: 200 }),
  complexity_score: integer('complexity_score'),
  plan_data: text('plan_data'),
  risks: text('risks'),
  recommendations: text('recommendations'),
  version: integer('version').notNull().default(1),
  status: varchar('status', { length: 20 }).default('generated'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('generated_plans_event_idx').on(table.event_id),
  index('generated_plans_creator_idx').on(table.created_by),
  index('generated_plans_status_idx').on(table.status),
])

export const generated_plan_tasks = pgTable('generated_plan_tasks', {
  id: serial('id').primaryKey(),
  plan_id: integer('plan_id').notNull().references(() => generated_plans.id, { onDelete: 'cascade' }),
  phase_name: varchar('phase_name', { length: 200 }).notNull(),
  phase_color: varchar('phase_color', { length: 7 }),
  phase_order: integer('phase_order'),
  task_name: varchar('task_name', { length: 300 }).notNull(),
  description: text('description'),
  duration_days: integer('duration_days').notNull(),
  start_date: timestamp('start_date'),
  end_date: timestamp('end_date'),
  role: varchar('role', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending'),
  dependencies: text('dependencies'),
  is_critical_path: boolean('is_critical_path').default(false),
  is_optional: boolean('is_optional').default(false),
  sort_order: integer('sort_order').notNull(),
  source: varchar('source', { length: 20 }),
}, (table) => [
  index('generated_plan_tasks_plan_idx').on(table.plan_id),
])

// ─── Tools: Budget Calculator ───────────────────────────────────

export const budget_calculations = pgTable('budget_calculations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 300 }).notNull(),
  event_id: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
  form_data: text('form_data').notNull(),
  total_estimated: integer('total_estimated').notNull(),
  breakdown: text('breakdown').notNull(),
  benchmarks: text('benchmarks'),
  currency: varchar('currency', { length: 3 }).default('SAR'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('budget_calculations_event_idx').on(table.event_id),
])

export const budget_category_defaults = pgTable('budget_category_defaults', {
  id: serial('id').primaryKey(),
  category: varchar('category', { length: 50 }).notNull(),
  label: varchar('label', { length: 100 }).notNull(),
  base_cost_per_person: integer('base_cost_per_person').notNull(),
  min_percentage: integer('min_percentage'),
  max_percentage: integer('max_percentage'),
  is_active: boolean('is_active').default(true),
})

// ─── Tools: Vendor Matcher ──────────────────────────────────────

export const vendor_match_results = pgTable('vendor_match_results', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
  criteria: text('criteria').notNull(),
  matches: text('matches').notNull(),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
})

export const vendor_match_weights = pgTable('vendor_match_weights', {
  id: serial('id').primaryKey(),
  criterion: varchar('criterion', { length: 100 }).notNull().unique(),
  weight: integer('weight').notNull().default(50),
  is_active: boolean('is_active').default(true),
  description: text('description'),
})

// ─── Tools: Risk Assessor ───────────────────────────────────────

export const risk_assessments = pgTable('risk_assessments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 300 }).notNull(),
  event_id: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
  form_data: text('form_data').notNull(),
  overall_risk_level: varchar('overall_risk_level', { length: 20 }).notNull(),
  risks: text('risks').notNull(),
  mitigations: text('mitigations'),
  score: integer('score'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('risk_assessments_event_idx').on(table.event_id),
])

export const risk_rules = pgTable('risk_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  condition: text('condition').notNull(),
  risk_output: text('risk_output').notNull(),
  priority: integer('priority').notNull().default(100),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

// ─── Invite Tokens ─────────────────────────────────────────────

export const invite_tokens = pgTable('invite_tokens', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  role_id: integer('role_id').references(() => roles.id),
  event_id: integer('event_id').references(() => events.id),
  invited_by: integer('invited_by').references(() => users.id),
  expires_at: timestamp('expires_at').notNull(),
  accepted_at: timestamp('accepted_at'),
  is_used: boolean('is_used').default(false),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('invite_tokens_email_idx').on(table.email),
  index('invite_tokens_invited_by_idx').on(table.invited_by),
])

// ─── Change Requests ───────────────────────────────────────────

export const change_requests = pgTable('change_requests', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  change_type: varchar('change_type', { length: 50 }).notNull(),
  impact_assessment: text('impact_assessment'),
  requested_by: integer('requested_by').references(() => users.id),
  status: varchar('status', { length: 50 }).default('pending'),
  approved_by: integer('approved_by').references(() => users.id),
  approved_at: timestamp('approved_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('change_requests_event_idx').on(table.event_id),
  index('change_requests_status_idx').on(table.status),
  index('change_requests_requested_by_idx').on(table.requested_by),
])

// ─── Lessons Learned ───────────────────────────────────────────

export const lessons_learned = pgTable('lessons_learned', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  impact: varchar('impact', { length: 50 }),
  recommendation: text('recommendation'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('lessons_learned_event_idx').on(table.event_id),
  index('lessons_learned_category_idx').on(table.category),
])

// ─── Time Entries ─────────────────────────────────────────────

export const time_entries = pgTable('time_entries', {
  id: serial('id').primaryKey(),
  task_id: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => users.id),
  hours: integer('hours').notNull(), // stored as minutes for precision
  description: text('description'),
  date: timestamp('date').notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('time_entries_task_idx').on(table.task_id),
  index('time_entries_user_idx').on(table.user_id),
])

// ─── Task Baselines ──────────────────────────────────────────

export const task_baselines = pgTable('task_baselines', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  task_id: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  baseline_start_date: timestamp('baseline_start_date'),
  baseline_end_date: timestamp('baseline_end_date'),
  baseline_number: integer('baseline_number').notNull().default(1),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('task_baselines_event_idx').on(table.event_id),
  index('task_baselines_task_idx').on(table.task_id),
])

// ─── RACI Assignments ─────────────────────────────────────────

export const raci_assignments = pgTable('raci_assignments', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  task_id: integer('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').notNull().references(() => users.id),
  raci_type: varchar('raci_type', { length: 20 }).notNull(), // responsible, accountable, consulted, informed
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  uniqueIndex('raci_unique_idx').on(table.event_id, table.task_id, table.user_id),
  index('raci_event_idx').on(table.event_id),
])

// ─── Event Checklists ──────────────────────────────────────────

export const event_checklist_items = pgTable('event_checklist_items', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  stage: varchar('stage', { length: 50 }).notNull(),
  item_name: varchar('item_name', { length: 255 }).notNull(),
  is_completed: boolean('is_completed').default(false),
  completed_by: integer('completed_by').references(() => users.id),
  completed_at: timestamp('completed_at'),
  is_required: boolean('is_required').default(true),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('checklist_items_event_idx').on(table.event_id),
  index('checklist_items_stage_idx').on(table.stage),
])

// ─── User Preferences ──────────────────────────────────────────

export const user_preferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  items_per_page: integer('items_per_page').default(25),
  date_format: varchar('date_format', { length: 20 }).default('dd/mm/yyyy'),
  notify_task_assigned: boolean('notify_task_assigned').default(true),
  notify_approval_needed: boolean('notify_approval_needed').default(true),
  notify_deadline: boolean('notify_deadline').default(true),
  theme: varchar('theme', { length: 20 }).default('light'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

// ─── Recently Viewed ───────────────────────────────────────────

export const recently_viewed = pgTable('recently_viewed', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  resource_type: varchar('resource_type', { length: 50 }).notNull(),
  resource_id: integer('resource_id').notNull(),
  resource_name: varchar('resource_name', { length: 255 }).notNull(),
  viewed_at: timestamp('viewed_at').defaultNow(),
}, (table) => [
  index('recently_viewed_user_idx').on(table.user_id),
  index('recently_viewed_resource_idx').on(table.resource_type, table.resource_id),
])
