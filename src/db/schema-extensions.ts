import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users, events, event_types, tasks, vendors, event_vendors, booths, sessions, event_checklist_items } from './schema'

// ─── Attendees & Registration ──────────────────────────────

export const attendees = pgTable('attendees', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  first_name: varchar('first_name', { length: 100 }).notNull(),
  last_name: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  organization: varchar('organization', { length: 200 }),
  title: varchar('title', { length: 200 }),
  registration_type: varchar('registration_type', { length: 30 }).default('general'), // general, vip, speaker, exhibitor, media, staff
  dietary_requirements: text('dietary_requirements'),
  accessibility_needs: text('accessibility_needs'),
  status: varchar('status', { length: 20 }).default('registered'), // registered, confirmed, checked_in, cancelled, no_show
  checked_in_at: timestamp('checked_in_at'),
  checked_in_by: integer('checked_in_by').references(() => users.id),
  badge_printed: boolean('badge_printed').default(false),
  qr_code: varchar('qr_code', { length: 100 }).unique(),
  notes: text('notes'),
  registered_at: timestamp('registered_at').defaultNow(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('attendees_event_idx').on(table.event_id),
  index('attendees_email_idx').on(table.email),
  index('attendees_status_idx').on(table.status),
])

// ─── Sponsors ──────────────────────────────────────────────

export const sponsors = pgTable('sponsors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  contact_name: varchar('contact_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  website: varchar('website', { length: 255 }),
  logo_path: text('logo_path'),
  industry: varchar('industry', { length: 100 }),
  notes: text('notes'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

export const event_sponsors = pgTable('event_sponsors', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  sponsor_id: integer('sponsor_id').notNull().references(() => sponsors.id),
  tier: varchar('tier', { length: 30 }).notNull().default('silver'), // platinum, gold, silver, bronze, custom
  commitment_amount: integer('commitment_amount'), // in halalas
  paid_amount: integer('paid_amount').default(0),
  deliverables: text('deliverables'), // JSON array of deliverables
  deliverables_completed: text('deliverables_completed'), // JSON array of completed items
  logo_placement: text('logo_placement'),
  status: varchar('status', { length: 20 }).default('pending'), // pending, confirmed, active, completed
  contract_path: text('contract_path'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('event_sponsors_event_idx').on(table.event_id),
  index('event_sponsors_sponsor_idx').on(table.sponsor_id),
])

// ─── Catering / Meals ──────────────────────────────────────

export const event_meals = pgTable('event_meals', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(), // e.g., "Day 1 Lunch"
  meal_type: varchar('meal_type', { length: 30 }).notNull(), // breakfast, lunch, dinner, snack, coffee_break
  date: timestamp('date').notNull(),
  start_time: varchar('start_time', { length: 5 }),
  end_time: varchar('end_time', { length: 5 }),
  location: varchar('location', { length: 200 }),
  expected_headcount: integer('expected_headcount'),
  actual_headcount: integer('actual_headcount'),
  vendor_id: integer('vendor_id').references(() => vendors.id),
  menu_description: text('menu_description'),
  dietary_options: text('dietary_options'), // JSON: { vegetarian: count, vegan: count, halal: count, ... }
  cost_per_person: integer('cost_per_person'), // halalas
  total_cost: integer('total_cost'), // halalas
  status: varchar('status', { length: 20 }).default('planned'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('event_meals_event_idx').on(table.event_id),
])

// ─── Expenses & Budget Actuals ─────────────────────────────

export const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 50 }).notNull(), // venue, catering, production, marketing, etc.
  description: varchar('description', { length: 300 }).notNull(),
  amount: integer('amount').notNull(), // halalas
  currency: varchar('currency', { length: 3 }).default('SAR'),
  vendor_id: integer('vendor_id').references(() => vendors.id),
  invoice_number: varchar('invoice_number', { length: 100 }),
  invoice_date: timestamp('invoice_date'),
  invoice_path: text('invoice_path'),
  po_number: varchar('po_number', { length: 100 }),
  payment_status: varchar('payment_status', { length: 20 }).default('pending'), // pending, approved, paid, overdue
  payment_date: timestamp('payment_date'),
  payment_method: varchar('payment_method', { length: 30 }),
  approved_by: integer('approved_by').references(() => users.id),
  approved_at: timestamp('approved_at'),
  notes: text('notes'),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('expenses_event_idx').on(table.event_id),
  index('expenses_category_idx').on(table.category),
  index('expenses_vendor_idx').on(table.vendor_id),
  index('expenses_payment_status_idx').on(table.payment_status),
])

// ─── Vendor Payments ───────────────────────────────────────

export const vendor_payments = pgTable('vendor_payments', {
  id: serial('id').primaryKey(),
  event_vendor_id: integer('event_vendor_id').notNull().references(() => event_vendors.id, { onDelete: 'cascade' }),
  milestone_name: varchar('milestone_name', { length: 200 }).notNull(),
  amount: integer('amount').notNull(), // halalas
  percentage: integer('percentage'), // of total contract
  due_date: timestamp('due_date'),
  payment_type: varchar('payment_type', { length: 30 }).notNull(), // advance, milestone, final
  status: varchar('status', { length: 20 }).default('pending'), // pending, invoiced, approved, paid
  invoice_number: varchar('invoice_number', { length: 100 }),
  invoice_path: text('invoice_path'),
  paid_date: timestamp('paid_date'),
  approved_by: integer('approved_by').references(() => users.id),
  notes: text('notes'),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('vendor_payments_ev_idx').on(table.event_vendor_id),
])

// ─── Travel & Accommodation ───────────────────────────────

export const travel_arrangements = pgTable('travel_arrangements', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  user_id: integer('user_id').references(() => users.id), // internal user or null
  guest_name: varchar('guest_name', { length: 200 }),
  guest_type: varchar('guest_type', { length: 30 }), // speaker, exhibitor, vip, staff
  // Flight
  flight_arrival: text('flight_arrival'), // JSON: { airline, flight_no, departure, arrival, date }
  flight_departure: text('flight_departure'),
  flight_status: varchar('flight_status', { length: 20 }).default('pending'), // pending, booked, confirmed, cancelled
  flight_booking_ref: varchar('flight_booking_ref', { length: 100 }),
  // Hotel
  hotel_name: varchar('hotel_name', { length: 200 }),
  hotel_check_in: timestamp('hotel_check_in'),
  hotel_check_out: timestamp('hotel_check_out'),
  hotel_confirmation: varchar('hotel_confirmation', { length: 100 }),
  hotel_room_type: varchar('hotel_room_type', { length: 50 }),
  hotel_status: varchar('hotel_status', { length: 20 }).default('pending'),
  // Transfer
  airport_transfer: boolean('airport_transfer').default(false),
  transfer_details: text('transfer_details'),
  // Visa
  visa_required: boolean('visa_required').default(false),
  visa_status: varchar('visa_status', { length: 20 }).default('not_required'), // not_required, pending, applied, approved, denied
  visa_number: varchar('visa_number', { length: 100 }),
  // Per diem
  per_diem_rate: integer('per_diem_rate'), // halalas per day
  per_diem_days: integer('per_diem_days'),
  total_cost: integer('total_cost'), // halalas
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('travel_event_idx').on(table.event_id),
  index('travel_user_idx').on(table.user_id),
])

// ─── Stakeholder Management ───────────────────────────────

export const stakeholders = pgTable('stakeholders', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  title: varchar('title', { length: 200 }),
  organization: varchar('organization', { length: 200 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 30 }),
  influence_level: varchar('influence_level', { length: 10 }).default('medium'), // low, medium, high
  interest_level: varchar('interest_level', { length: 10 }).default('medium'), // low, medium, high
  communication_channel: varchar('communication_channel', { length: 50 }), // email, phone, meeting, portal
  engagement_strategy: text('engagement_strategy'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('stakeholders_event_idx').on(table.event_id),
])

// ─── Exhibitor Services ───────────────────────────────────

export const exhibitor_services = pgTable('exhibitor_services', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // power, wifi, furniture, signage, catering
  unit_price: integer('unit_price').notNull(), // halalas
  unit: varchar('unit', { length: 30 }).default('unit'), // unit, per_day, per_sqm
  is_available: boolean('is_available').default(true),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
})

export const exhibitor_service_orders = pgTable('exhibitor_service_orders', {
  id: serial('id').primaryKey(),
  exhibitor_service_id: integer('exhibitor_service_id').notNull().references(() => exhibitor_services.id),
  event_exhibitor_id: integer('event_exhibitor_id').notNull(), // FK to event_exhibitors
  quantity: integer('quantity').notNull().default(1),
  total_price: integer('total_price').notNull(), // halalas
  status: varchar('status', { length: 20 }).default('pending'), // pending, confirmed, delivered
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
})

// ─── Stage Gates / Governance ──────────────────────────────

export const stage_gates = pgTable('stage_gates', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  gate_name: varchar('gate_name', { length: 200 }).notNull(),
  phase: varchar('phase', { length: 50 }).notNull(), // initiation, planning, execution, closure
  required_deliverables: text('required_deliverables'), // JSON array
  reviewer_id: integer('reviewer_id').references(() => users.id),
  status: varchar('status', { length: 20 }).default('pending'), // pending, passed, failed, waived
  review_date: timestamp('review_date'),
  review_notes: text('review_notes'),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('stage_gates_event_idx').on(table.event_id),
])

// ─── Quality Management ───────────────────────────────────

export const quality_criteria = pgTable('quality_criteria', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  criterion: varchar('criterion', { length: 300 }).notNull(),
  measurement: text('measurement'),
  target_value: varchar('target_value', { length: 100 }),
  actual_value: varchar('actual_value', { length: 100 }),
  status: varchar('status', { length: 20 }).default('pending'), // pending, met, not_met, exceeded
  verified_by: integer('verified_by').references(() => users.id),
  verified_at: timestamp('verified_at'),
  notes: text('notes'),
  sort_order: integer('sort_order').default(0),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('quality_criteria_event_idx').on(table.event_id),
])

// ─── Event Success Metrics / Benefits Realization ──────────

export const event_success_metrics = pgTable('event_success_metrics', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  metric_name: varchar('metric_name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }), // attendance, satisfaction, revenue, engagement
  target_value: varchar('target_value', { length: 100 }).notNull(),
  actual_value: varchar('actual_value', { length: 100 }),
  unit: varchar('unit', { length: 30 }), // count, percentage, SAR, rating
  achieved: boolean('achieved'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('event_success_event_idx').on(table.event_id),
])

// ─── Client Feedback / Surveys ─────────────────────────────

export const event_feedback = pgTable('event_feedback', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  respondent_type: varchar('respondent_type', { length: 30 }).notNull(), // client, attendee, speaker, exhibitor
  respondent_id: integer('respondent_id'),
  respondent_name: varchar('respondent_name', { length: 200 }),
  respondent_email: varchar('respondent_email', { length: 255 }),
  nps_score: integer('nps_score'), // 0-10
  overall_rating: integer('overall_rating'), // 1-5
  ratings: text('ratings'), // JSON: { venue: 4, catering: 3, organization: 5, ... }
  comments: text('comments'),
  suggestions: text('suggestions'),
  would_recommend: boolean('would_recommend'),
  submitted_at: timestamp('submitted_at').defaultNow(),
}, (table) => [
  index('event_feedback_event_idx').on(table.event_id),
])

// ─── Checklist Templates ──────────────────────────────────

export const checklist_templates = pgTable('checklist_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  event_type: varchar('event_type', { length: 50 }),
  description: text('description'),
  is_default: boolean('is_default').default(false),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
})

export const checklist_template_items = pgTable('checklist_template_items', {
  id: serial('id').primaryKey(),
  template_id: integer('template_id').notNull().references(() => checklist_templates.id, { onDelete: 'cascade' }),
  stage: varchar('stage', { length: 50 }).notNull(),
  item_name: varchar('item_name', { length: 255 }).notNull(),
  is_required: boolean('is_required').default(true),
  sort_order: integer('sort_order').default(0),
})

// ─── Portal Messages ──────────────────────────────────────

export const portal_messages = pgTable('portal_messages', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  sender_id: integer('sender_id').notNull().references(() => users.id),
  recipient_id: integer('recipient_id').references(() => users.id), // null = broadcast to event team
  subject: varchar('subject', { length: 300 }),
  content: text('content').notNull(),
  is_read: boolean('is_read').default(false),
  read_at: timestamp('read_at'),
  attachment_path: text('attachment_path'),
  parent_id: integer('parent_id'), // for reply threading
  created_at: timestamp('created_at').defaultNow(),
}, (table) => [
  index('portal_messages_event_idx').on(table.event_id),
  index('portal_messages_sender_idx').on(table.sender_id),
  index('portal_messages_recipient_idx').on(table.recipient_id),
])

// ─── Event Templates (for cloning) ────────────────────────

export const event_templates = pgTable('event_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  event_type_id: integer('event_type_id').references(() => event_types.id),
  source_event_id: integer('source_event_id').references(() => events.id),
  template_data: text('template_data').notNull(), // JSON string with tasks, vendors, sessions, checklist items
  created_by: integer('created_by').references(() => users.id),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
})

// ─── Timesheets ──────────────────────────────────────────

export const timesheets = pgTable('timesheets', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id),
  event_id: integer('event_id').references(() => events.id, { onDelete: 'cascade' }),
  task_id: integer('task_id').references(() => tasks.id),
  date: timestamp('date').notNull(),
  hours: integer('hours').notNull(), // in minutes for precision
  description: text('description'),
  billable: boolean('billable').default(true),
  status: varchar('status', { length: 20 }).default('draft'), // draft, submitted, approved, rejected
  approved_by: integer('approved_by').references(() => users.id),
  approved_at: timestamp('approved_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('timesheets_user_idx').on(table.user_id),
  index('timesheets_event_idx').on(table.event_id),
  index('timesheets_date_idx').on(table.date),
])

// ─── Survey Templates ────────────────────────────────────

export const survey_templates = pgTable('survey_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  target_audience: varchar('target_audience', { length: 30 }).notNull(), // client, attendee, speaker, exhibitor
  questions: text('questions').notNull(), // JSON array of { id, text, type, options?, required? }
  is_active: boolean('is_active').default(true),
  created_by: integer('created_by').references(() => users.id),
  created_at: timestamp('created_at').defaultNow(),
})

export const survey_responses = pgTable('survey_responses', {
  id: serial('id').primaryKey(),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  template_id: integer('template_id').references(() => survey_templates.id),
  respondent_name: varchar('respondent_name', { length: 200 }),
  respondent_email: varchar('respondent_email', { length: 255 }),
  respondent_type: varchar('respondent_type', { length: 30 }),
  answers: text('answers').notNull(), // JSON object { questionId: answer }
  nps_score: integer('nps_score'), // 0-10
  submitted_at: timestamp('submitted_at').defaultNow(),
}, (table) => [
  index('survey_responses_event_idx').on(table.event_id),
])

// ─── Document Visibility ──────────────────────────────────
// Added as a column extension — documents table gets `visibility` column
// This is handled via ALTER TABLE or schema update

// ─── Vendor Ratings (post-event) ───────────────────────────

export const vendor_ratings = pgTable('vendor_ratings', {
  id: serial('id').primaryKey(),
  event_vendor_id: integer('event_vendor_id').notNull().references(() => event_vendors.id),
  event_id: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  vendor_id: integer('vendor_id').notNull().references(() => vendors.id),
  quality_rating: integer('quality_rating'), // 1-5
  timeliness_rating: integer('timeliness_rating'), // 1-5
  communication_rating: integer('communication_rating'), // 1-5
  value_rating: integer('value_rating'), // 1-5
  overall_rating: integer('overall_rating'), // 1-5
  comments: text('comments'),
  would_rehire: boolean('would_rehire'),
  rated_by: integer('rated_by').references(() => users.id),
  rated_at: timestamp('rated_at').defaultNow(),
}, (table) => [
  index('vendor_ratings_event_idx').on(table.event_id),
  index('vendor_ratings_vendor_idx').on(table.vendor_id),
  uniqueIndex('vendor_ratings_unique_idx').on(table.event_vendor_id, table.rated_by),
])
