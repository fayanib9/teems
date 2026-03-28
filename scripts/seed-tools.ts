import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../src/db/schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://teems:teems@localhost:5432/teems',
})

const db = drizzle(pool, { schema })

async function seedTools() {
  console.log('Seeding tools data...')

  // --- Plan Roles ---
  console.log('  Creating plan roles...')
  const planRoles = [
    { name: 'Project Manager', color: '#312C6A', description: 'Overall project coordination and timeline management' },
    { name: 'Operations Manager', color: '#2563EB', description: 'Venue, logistics, and on-site operations' },
    { name: 'Creative Director', color: '#7C3AED', description: 'Design, branding, and creative execution' },
    { name: 'Procurement Officer', color: '#059669', description: 'Vendor sourcing, contracts, and purchasing' },
    { name: 'Marketing Lead', color: '#D97706', description: 'Marketing campaigns, PR, and communications' },
    { name: 'Technical Lead', color: '#DC2626', description: 'AV, IT systems, and technical infrastructure' },
    { name: 'Logistics Coordinator', color: '#0891B2', description: 'Transport, shipping, and material handling' },
  ]
  for (const role of planRoles) {
    try {
      await db.insert(schema.plan_roles).values(role)
    } catch { /* skip if exists */ }
  }

  // --- Plan Templates ---
  console.log('  Creating plan templates...')

  // Template 1: Conference
  const [confTemplate] = await db.insert(schema.plan_templates).values({
    name: 'Conference',
    description: 'Standard conference template with 5 phases',
    event_type: 'conference',
    min_attendees: 100,
    max_attendees: 10000,
    is_default: true,
  }).returning({ id: schema.plan_templates.id })

  const confPhases = [
    { template_id: confTemplate.id, name: 'Strategy & Concept', sort_order: 1, color: '#312C6A', icon: 'Target' },
    { template_id: confTemplate.id, name: 'Planning & Design', sort_order: 2, color: '#2563EB', icon: 'ClipboardList' },
    { template_id: confTemplate.id, name: 'Procurement & Contracting', sort_order: 3, color: '#059669', icon: 'ShoppingCart' },
    { template_id: confTemplate.id, name: 'Execution & Production', sort_order: 4, color: '#D97706', icon: 'Rocket' },
    { template_id: confTemplate.id, name: 'Post-Event & Closure', sort_order: 5, color: '#6B7280', icon: 'CheckCircle' },
  ]
  const confPhaseIds: number[] = []
  for (const phase of confPhases) {
    const [p] = await db.insert(schema.plan_template_phases).values(phase).returning({ id: schema.plan_template_phases.id })
    confPhaseIds.push(p.id)
  }

  // Conference tasks per phase
  const confTasks = [
    // Strategy
    { phase_id: confPhaseIds[0], name: 'Define event objectives and KPIs', duration_days: 3, role: 'Project Manager', sort_order: 1 },
    { phase_id: confPhaseIds[0], name: 'Develop event concept and theme', duration_days: 5, role: 'Creative Director', sort_order: 2 },
    { phase_id: confPhaseIds[0], name: 'Identify target audience segments', duration_days: 3, role: 'Marketing Lead', sort_order: 3 },
    { phase_id: confPhaseIds[0], name: 'Create preliminary budget', duration_days: 3, role: 'Project Manager', sort_order: 4 },
    { phase_id: confPhaseIds[0], name: 'Stakeholder alignment meeting', duration_days: 1, role: 'Project Manager', sort_order: 5 },
    // Planning
    { phase_id: confPhaseIds[1], name: 'Develop detailed project plan', duration_days: 5, role: 'Project Manager', sort_order: 1 },
    { phase_id: confPhaseIds[1], name: 'Design venue layout and floor plan', duration_days: 7, role: 'Operations Manager', sort_order: 2 },
    { phase_id: confPhaseIds[1], name: 'Create content and agenda framework', duration_days: 7, role: 'Creative Director', sort_order: 3 },
    { phase_id: confPhaseIds[1], name: 'Plan registration workflow', duration_days: 5, role: 'Technical Lead', sort_order: 4 },
    { phase_id: confPhaseIds[1], name: 'Develop branding guidelines', duration_days: 5, role: 'Creative Director', sort_order: 5 },
    { phase_id: confPhaseIds[1], name: 'Create marketing campaign plan', duration_days: 5, role: 'Marketing Lead', sort_order: 6 },
    // Procurement
    { phase_id: confPhaseIds[2], name: 'Issue venue RFP and negotiate', duration_days: 10, role: 'Procurement Officer', sort_order: 1 },
    { phase_id: confPhaseIds[2], name: 'Source and contract AV vendor', duration_days: 7, role: 'Procurement Officer', sort_order: 2 },
    { phase_id: confPhaseIds[2], name: 'Contract catering provider', duration_days: 7, role: 'Procurement Officer', sort_order: 3 },
    { phase_id: confPhaseIds[2], name: 'Confirm speaker agreements', duration_days: 10, role: 'Project Manager', sort_order: 4 },
    { phase_id: confPhaseIds[2], name: 'Procure print and branding materials', duration_days: 7, role: 'Procurement Officer', sort_order: 5 },
    // Execution
    { phase_id: confPhaseIds[3], name: 'Venue setup and walkthrough', duration_days: 3, role: 'Operations Manager', sort_order: 1 },
    { phase_id: confPhaseIds[3], name: 'AV and technical rehearsal', duration_days: 2, role: 'Technical Lead', sort_order: 2 },
    { phase_id: confPhaseIds[3], name: 'Install branding and signage', duration_days: 2, role: 'Creative Director', sort_order: 3 },
    { phase_id: confPhaseIds[3], name: 'Staff briefing and deployment', duration_days: 1, role: 'Operations Manager', sort_order: 4 },
    { phase_id: confPhaseIds[3], name: 'Registration desk setup', duration_days: 1, role: 'Technical Lead', sort_order: 5 },
    { phase_id: confPhaseIds[3], name: 'Event day operations management', duration_days: 1, role: 'Operations Manager', sort_order: 6 },
    // Closure
    { phase_id: confPhaseIds[4], name: 'Venue teardown and asset return', duration_days: 2, role: 'Logistics Coordinator', sort_order: 1 },
    { phase_id: confPhaseIds[4], name: 'Collect attendee feedback', duration_days: 3, role: 'Marketing Lead', sort_order: 2 },
    { phase_id: confPhaseIds[4], name: 'Final vendor reconciliation', duration_days: 5, role: 'Procurement Officer', sort_order: 3 },
    { phase_id: confPhaseIds[4], name: 'Post-event report and KPI review', duration_days: 5, role: 'Project Manager', sort_order: 4 },
  ]
  for (const task of confTasks) {
    await db.insert(schema.plan_template_tasks).values(task)
  }

  // Template 2: Exhibition
  const [exhTemplate] = await db.insert(schema.plan_templates).values({
    name: 'Exhibition',
    description: 'Exhibition template with booth management and exhibitor coordination',
    event_type: 'exhibition',
    min_attendees: 500,
    max_attendees: 50000,
  }).returning({ id: schema.plan_templates.id })

  const exhPhases = [
    { template_id: exhTemplate.id, name: 'Strategy & Concept', sort_order: 1, color: '#312C6A', icon: 'Target' },
    { template_id: exhTemplate.id, name: 'Planning & Design', sort_order: 2, color: '#2563EB', icon: 'ClipboardList' },
    { template_id: exhTemplate.id, name: 'Procurement & Contracting', sort_order: 3, color: '#059669', icon: 'ShoppingCart' },
    { template_id: exhTemplate.id, name: 'Build & Production', sort_order: 4, color: '#D97706', icon: 'Rocket' },
    { template_id: exhTemplate.id, name: 'Post-Event & Closure', sort_order: 5, color: '#6B7280', icon: 'CheckCircle' },
  ]
  const exhPhaseIds: number[] = []
  for (const phase of exhPhases) {
    const [p] = await db.insert(schema.plan_template_phases).values(phase).returning({ id: schema.plan_template_phases.id })
    exhPhaseIds.push(p.id)
  }

  const exhTasks = [
    { phase_id: exhPhaseIds[0], name: 'Define exhibition concept', duration_days: 5, role: 'Project Manager', sort_order: 1 },
    { phase_id: exhPhaseIds[0], name: 'Exhibitor prospecting strategy', duration_days: 5, role: 'Marketing Lead', sort_order: 2 },
    { phase_id: exhPhaseIds[0], name: 'Floor plan zoning and layout', duration_days: 5, role: 'Operations Manager', sort_order: 3 },
    { phase_id: exhPhaseIds[0], name: 'Revenue and sponsorship targets', duration_days: 3, role: 'Project Manager', sort_order: 4 },
    { phase_id: exhPhaseIds[1], name: 'Exhibitor packages and pricing', duration_days: 5, role: 'Marketing Lead', sort_order: 1 },
    { phase_id: exhPhaseIds[1], name: 'Booth design standards', duration_days: 7, role: 'Creative Director', sort_order: 2 },
    { phase_id: exhPhaseIds[1], name: 'Visitor journey mapping', duration_days: 5, role: 'Operations Manager', sort_order: 3 },
    { phase_id: exhPhaseIds[1], name: 'Digital platform setup', duration_days: 7, role: 'Technical Lead', sort_order: 4 },
    { phase_id: exhPhaseIds[1], name: 'Marketing campaign launch', duration_days: 5, role: 'Marketing Lead', sort_order: 5 },
    { phase_id: exhPhaseIds[1], name: 'Exhibitor manual creation', duration_days: 5, role: 'Operations Manager', sort_order: 6 },
    { phase_id: exhPhaseIds[2], name: 'Venue contract negotiation', duration_days: 10, role: 'Procurement Officer', sort_order: 1 },
    { phase_id: exhPhaseIds[2], name: 'Stand builder contracting', duration_days: 10, role: 'Procurement Officer', sort_order: 2 },
    { phase_id: exhPhaseIds[2], name: 'AV and utilities contracting', duration_days: 7, role: 'Procurement Officer', sort_order: 3 },
    { phase_id: exhPhaseIds[2], name: 'Security and crowd management', duration_days: 5, role: 'Operations Manager', sort_order: 4 },
    { phase_id: exhPhaseIds[2], name: 'Catering contracts', duration_days: 5, role: 'Procurement Officer', sort_order: 5 },
    { phase_id: exhPhaseIds[2], name: 'Freight and logistics setup', duration_days: 7, role: 'Logistics Coordinator', sort_order: 6 },
    { phase_id: exhPhaseIds[3], name: 'Shell scheme and booth build', duration_days: 5, role: 'Operations Manager', sort_order: 1 },
    { phase_id: exhPhaseIds[3], name: 'Exhibitor move-in coordination', duration_days: 3, role: 'Logistics Coordinator', sort_order: 2 },
    { phase_id: exhPhaseIds[3], name: 'Branding and wayfinding install', duration_days: 3, role: 'Creative Director', sort_order: 3 },
    { phase_id: exhPhaseIds[3], name: 'Technical systems testing', duration_days: 2, role: 'Technical Lead', sort_order: 4 },
    { phase_id: exhPhaseIds[3], name: 'Exhibition day operations', duration_days: 3, role: 'Operations Manager', sort_order: 5 },
    { phase_id: exhPhaseIds[3], name: 'Daily exhibitor support', duration_days: 3, role: 'Operations Manager', sort_order: 6 },
    { phase_id: exhPhaseIds[4], name: 'Exhibitor move-out', duration_days: 2, role: 'Logistics Coordinator', sort_order: 1 },
    { phase_id: exhPhaseIds[4], name: 'Venue handback', duration_days: 2, role: 'Operations Manager', sort_order: 2 },
    { phase_id: exhPhaseIds[4], name: 'Lead data and analytics report', duration_days: 5, role: 'Technical Lead', sort_order: 3 },
    { phase_id: exhPhaseIds[4], name: 'Financial reconciliation', duration_days: 7, role: 'Project Manager', sort_order: 4 },
    { phase_id: exhPhaseIds[4], name: 'Exhibitor satisfaction survey', duration_days: 5, role: 'Marketing Lead', sort_order: 5 },
    { phase_id: exhPhaseIds[4], name: 'Lessons learned workshop', duration_days: 2, role: 'Project Manager', sort_order: 6 },
  ]
  for (const task of exhTasks) {
    await db.insert(schema.plan_template_tasks).values(task)
  }

  // Template 3: Corporate Event
  const [corpTemplate] = await db.insert(schema.plan_templates).values({
    name: 'Corporate Event',
    description: 'Corporate event template for meetings, galas, and activations',
    event_type: 'corporate',
    min_attendees: 50,
    max_attendees: 5000,
  }).returning({ id: schema.plan_templates.id })

  const corpPhases = [
    { template_id: corpTemplate.id, name: 'Planning & Design', sort_order: 1, color: '#2563EB', icon: 'ClipboardList' },
    { template_id: corpTemplate.id, name: 'Procurement & Setup', sort_order: 2, color: '#059669', icon: 'ShoppingCart' },
    { template_id: corpTemplate.id, name: 'Execution & Closure', sort_order: 3, color: '#D97706', icon: 'Rocket' },
  ]
  const corpPhaseIds: number[] = []
  for (const phase of corpPhases) {
    const [p] = await db.insert(schema.plan_template_phases).values(phase).returning({ id: schema.plan_template_phases.id })
    corpPhaseIds.push(p.id)
  }

  const corpTasks = [
    { phase_id: corpPhaseIds[0], name: 'Event brief and objectives', duration_days: 3, role: 'Project Manager', sort_order: 1 },
    { phase_id: corpPhaseIds[0], name: 'Venue selection and booking', duration_days: 5, role: 'Operations Manager', sort_order: 2 },
    { phase_id: corpPhaseIds[0], name: 'Theme and design concept', duration_days: 5, role: 'Creative Director', sort_order: 3 },
    { phase_id: corpPhaseIds[0], name: 'Guest list and invitations', duration_days: 5, role: 'Marketing Lead', sort_order: 4 },
    { phase_id: corpPhaseIds[0], name: 'Run of show development', duration_days: 3, role: 'Project Manager', sort_order: 5 },
    { phase_id: corpPhaseIds[1], name: 'Vendor sourcing and contracts', duration_days: 7, role: 'Procurement Officer', sort_order: 1 },
    { phase_id: corpPhaseIds[1], name: 'Branding production', duration_days: 7, role: 'Creative Director', sort_order: 2 },
    { phase_id: corpPhaseIds[1], name: 'AV and tech setup plan', duration_days: 5, role: 'Technical Lead', sort_order: 3 },
    { phase_id: corpPhaseIds[1], name: 'Catering menu finalization', duration_days: 3, role: 'Operations Manager', sort_order: 4 },
    { phase_id: corpPhaseIds[2], name: 'Venue setup and rehearsal', duration_days: 2, role: 'Operations Manager', sort_order: 1 },
    { phase_id: corpPhaseIds[2], name: 'Event day management', duration_days: 1, role: 'Project Manager', sort_order: 2 },
    { phase_id: corpPhaseIds[2], name: 'Teardown and vendor reconciliation', duration_days: 2, role: 'Logistics Coordinator', sort_order: 3 },
    { phase_id: corpPhaseIds[2], name: 'Thank you communications', duration_days: 2, role: 'Marketing Lead', sort_order: 4 },
    { phase_id: corpPhaseIds[2], name: 'Event summary report', duration_days: 3, role: 'Project Manager', sort_order: 5 },
  ]
  for (const task of corpTasks) {
    await db.insert(schema.plan_template_tasks).values(task)
  }

  // --- Plan Rules ---
  console.log('  Creating plan rules...')
  const planRules = [
    // Template selection rules
    { name: 'Conference Template', category: 'template_selection', condition: JSON.stringify({ type: 'comparison', field: 'event_type', operator: 'eq', value: 'conference' }), actions: JSON.stringify([{ type: 'select_template', template_name: 'Conference' }]), priority: 1 },
    { name: 'Exhibition Template', category: 'template_selection', condition: JSON.stringify({ type: 'comparison', field: 'event_type', operator: 'eq', value: 'exhibition' }), actions: JSON.stringify([{ type: 'select_template', template_name: 'Exhibition' }]), priority: 1 },
    { name: 'Corporate Template', category: 'template_selection', condition: JSON.stringify({ type: 'or', conditions: [{ type: 'comparison', field: 'event_type', operator: 'eq', value: 'corporate' }, { type: 'comparison', field: 'event_type', operator: 'eq', value: 'gala' }, { type: 'comparison', field: 'event_type', operator: 'eq', value: 'activation' }] }), actions: JSON.stringify([{ type: 'select_template', template_name: 'Corporate Event' }]), priority: 2 },
    // Service injection rules
    { name: 'Production Service Tasks', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'services', operator: 'contains', value: 'production' }), actions: JSON.stringify([{ type: 'add_task', phase: 'Execution & Production', task: { name: 'AV equipment testing and calibration', duration_days: 2, role: 'Technical Lead' } }, { type: 'add_task', phase: 'Planning & Design', task: { name: 'Production technical requirements document', duration_days: 3, role: 'Technical Lead' } }]), priority: 50 },
    { name: 'Registration Service Tasks', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'services', operator: 'contains', value: 'registration' }), actions: JSON.stringify([{ type: 'add_task', phase: 'Planning & Design', task: { name: 'Registration platform configuration', duration_days: 5, role: 'Technical Lead' } }, { type: 'add_task', phase: 'Execution & Production', task: { name: 'Registration desk and kiosk setup', duration_days: 1, role: 'Technical Lead' } }]), priority: 50 },
    { name: 'Catering Service Tasks', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'services', operator: 'contains', value: 'catering' }), actions: JSON.stringify([{ type: 'add_task', phase: 'Procurement & Contracting', task: { name: 'Catering menu tasting and selection', duration_days: 3, role: 'Operations Manager' } }]), priority: 50 },
    { name: 'Branding Service Tasks', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'services', operator: 'contains', value: 'branding' }), actions: JSON.stringify([{ type: 'add_task', phase: 'Planning & Design', task: { name: 'Brand identity design and guidelines', duration_days: 7, role: 'Creative Director' } }, { type: 'add_task', phase: 'Procurement & Contracting', task: { name: 'Print production and signage manufacturing', duration_days: 10, role: 'Procurement Officer' } }]), priority: 50 },
    { name: 'Marketing Service Tasks', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'services', operator: 'contains', value: 'marketing' }), actions: JSON.stringify([{ type: 'add_task', phase: 'Planning & Design', task: { name: 'Digital marketing campaign setup', duration_days: 5, role: 'Marketing Lead' } }, { type: 'add_task', phase: 'Execution & Production', task: { name: 'Social media coverage and live updates', duration_days: 1, role: 'Marketing Lead' } }]), priority: 50 },
    { name: 'Logistics Service Tasks', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'services', operator: 'contains', value: 'logistics' }), actions: JSON.stringify([{ type: 'add_task', phase: 'Procurement & Contracting', task: { name: 'Freight and transport logistics planning', duration_days: 5, role: 'Logistics Coordinator' } }]), priority: 50 },
    { name: 'Staffing Service Tasks', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'services', operator: 'contains', value: 'staffing' }), actions: JSON.stringify([{ type: 'add_task', phase: 'Planning & Design', task: { name: 'Staffing plan and role assignments', duration_days: 3, role: 'Operations Manager' } }, { type: 'add_task', phase: 'Execution & Production', task: { name: 'Staff onboarding and briefing', duration_days: 2, role: 'Operations Manager' } }]), priority: 50 },
    { name: 'Content Service Tasks', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'services', operator: 'contains', value: 'content' }), actions: JSON.stringify([{ type: 'add_task', phase: 'Planning & Design', task: { name: 'Content strategy and speaker coordination', duration_days: 7, role: 'Creative Director' } }]), priority: 50 },
    // Complexity rules
    { name: 'Large Scale Complexity', category: 'complexity', condition: JSON.stringify({ type: 'comparison', field: 'attendees', operator: 'gte', value: 5000 }), actions: JSON.stringify([{ type: 'set_complexity_weight', factor: 'scale', weight: 30, value: 0.9 }]), priority: 80 },
    { name: 'Medium Scale Complexity', category: 'complexity', condition: JSON.stringify({ type: 'and', conditions: [{ type: 'comparison', field: 'attendees', operator: 'gte', value: 1000 }, { type: 'comparison', field: 'attendees', operator: 'lt', value: 5000 }] }), actions: JSON.stringify([{ type: 'set_complexity_weight', factor: 'scale', weight: 30, value: 0.5 }]), priority: 81 },
    { name: 'Many Services Complexity', category: 'complexity', condition: JSON.stringify({ type: 'comparison', field: 'services.length', operator: 'gte', value: 5 }), actions: JSON.stringify([{ type: 'set_complexity_weight', factor: 'services', weight: 25, value: 0.7 }]), priority: 82 },
    // Timeline compression
    { name: 'Fast Track Timeline', category: 'timeline', condition: JSON.stringify({ type: 'comparison', field: 'urgency', operator: 'eq', value: 'fast_track' }), actions: JSON.stringify([{ type: 'modify_duration', target: '*', multiplier: 0.7 }]), priority: 90 },
    { name: 'Critical Timeline', category: 'timeline', condition: JSON.stringify({ type: 'comparison', field: 'urgency', operator: 'eq', value: 'critical' }), actions: JSON.stringify([{ type: 'modify_duration', target: '*', multiplier: 0.5 }]), priority: 90 },
    // Risk detection
    { name: 'Tight Timeline Risk', category: 'risk', condition: JSON.stringify({ type: 'comparison', field: 'days_remaining', operator: 'lt', value: 45 }), actions: JSON.stringify([{ type: 'add_risk', severity: 'high', title: 'Compressed Timeline', description: 'Less than 45 days until event date. Parallel execution and fast-track vendor processes are essential.' }]), priority: 95 },
    { name: 'Government Protocol Risk', category: 'risk', condition: JSON.stringify({ type: 'comparison', field: 'has_government', operator: 'eq', value: true }), actions: JSON.stringify([{ type: 'add_risk', severity: 'medium', title: 'Government Protocol Requirements', description: 'Government involvement requires additional security screening, protocol review, and VIP handling.' }, { type: 'add_task', phase: 'Planning & Design', task: { name: 'Government protocol and security planning', duration_days: 5, role: 'Operations Manager' } }]), priority: 95 },
    // Recommendation
    { name: 'Missing Registration', category: 'recommendation', condition: JSON.stringify({ type: 'and', conditions: [{ type: 'comparison', field: 'attendees', operator: 'gte', value: 200 }, { type: 'comparison', field: 'services', operator: 'not_contains', value: 'registration' }] }), actions: JSON.stringify([{ type: 'add_recommendation', title: 'Add Registration Service', description: 'Events with 200+ attendees benefit from a digital registration system for check-in efficiency and data collection.' }]), priority: 100 },
    // International speakers
    { name: 'International Speakers', category: 'service_injection', condition: JSON.stringify({ type: 'comparison', field: 'has_international_speakers', operator: 'eq', value: true }), actions: JSON.stringify([{ type: 'add_task', phase: 'Planning & Design', task: { name: 'Speaker visa and travel coordination', duration_days: 10, role: 'Operations Manager' } }, { type: 'add_task', phase: 'Procurement & Contracting', task: { name: 'Simultaneous translation equipment', duration_days: 5, role: 'Technical Lead' } }]), priority: 50 },
  ]
  for (const rule of planRules) {
    await db.insert(schema.plan_rules).values(rule)
  }

  // --- Budget Category Defaults ---
  console.log('  Creating budget category defaults...')
  const budgetDefaults = [
    { category: 'venue', label: 'Venue & Space', base_cost_per_person: 5000, min_percentage: 15, max_percentage: 25 },
    { category: 'catering', label: 'Catering & F&B', base_cost_per_person: 4000, min_percentage: 15, max_percentage: 30 },
    { category: 'production', label: 'AV & Production', base_cost_per_person: 3000, min_percentage: 10, max_percentage: 20 },
    { category: 'branding', label: 'Branding & Design', base_cost_per_person: 2000, min_percentage: 5, max_percentage: 15 },
    { category: 'staffing', label: 'Staffing & Labor', base_cost_per_person: 1500, min_percentage: 5, max_percentage: 10 },
    { category: 'marketing', label: 'Marketing & PR', base_cost_per_person: 2500, min_percentage: 5, max_percentage: 15 },
    { category: 'logistics', label: 'Logistics & Transport', base_cost_per_person: 1000, min_percentage: 3, max_percentage: 8 },
    { category: 'technology', label: 'Technology & Systems', base_cost_per_person: 2000, min_percentage: 3, max_percentage: 10 },
  ]
  for (const bd of budgetDefaults) {
    await db.insert(schema.budget_category_defaults).values(bd)
  }

  // --- Vendor Match Weights ---
  console.log('  Creating vendor match weights...')
  const vendorWeights = [
    { criterion: 'category_match', weight: 30, description: 'Service category matches required services' },
    { criterion: 'rating', weight: 25, description: 'Vendor rating and quality score' },
    { criterion: 'budget_fit', weight: 20, description: 'Historical pricing fits budget range' },
    { criterion: 'experience', weight: 15, description: 'Number of past events with this vendor' },
    { criterion: 'availability', weight: 10, description: 'Not booked for conflicting dates' },
  ]
  for (const vw of vendorWeights) {
    try {
      await db.insert(schema.vendor_match_weights).values(vw)
    } catch { /* skip if exists */ }
  }

  // --- Risk Rules ---
  console.log('  Creating risk rules...')
  const riskRules = [
    { name: 'Short Timeline', category: 'timeline', condition: JSON.stringify({ type: 'comparison', field: 'days_remaining', operator: 'lt', value: 30 }), risk_output: JSON.stringify({ level: 'high', title: 'Tight Timeline', description: 'Less than 30 days until event.', mitigation: 'Fast-track vendor contracting, reduce review cycles' }), priority: 10 },
    { name: 'Very Short Timeline', category: 'timeline', condition: JSON.stringify({ type: 'comparison', field: 'days_remaining', operator: 'lt', value: 14 }), risk_output: JSON.stringify({ level: 'critical', title: 'Insufficient Timeline', description: 'Less than 14 days until event.', mitigation: 'Emergency staffing, pre-approved vendor list' }), priority: 5 },
    { name: 'Budget Mismatch', category: 'budget', condition: JSON.stringify({ type: 'and', conditions: [{ type: 'comparison', field: 'budget_range', operator: 'eq', value: 'under_500k' }, { type: 'comparison', field: 'attendees', operator: 'gte', value: 2000 }] }), risk_output: JSON.stringify({ level: 'high', title: 'Budget-Scale Mismatch', description: 'Budget under 500K SAR for 2000+ attendees.', mitigation: 'Negotiate bulk discounts or reduce scope' }), priority: 20 },
    { name: 'Large Outdoor Event', category: 'venue', condition: JSON.stringify({ type: 'and', conditions: [{ type: 'comparison', field: 'venue_type', operator: 'eq', value: 'outdoor' }, { type: 'comparison', field: 'attendees', operator: 'gte', value: 1000 }] }), risk_output: JSON.stringify({ level: 'medium', title: 'Weather & Environment', description: 'Large outdoor events are vulnerable to weather.', mitigation: 'Prepare weather contingency, backup venue' }), priority: 30 },
    { name: 'Government Compliance', category: 'compliance', condition: JSON.stringify({ type: 'comparison', field: 'has_government', operator: 'eq', value: true }), risk_output: JSON.stringify({ level: 'medium', title: 'Regulatory Compliance', description: 'Government involvement requires strict protocol.', mitigation: 'Engage government liaison early' }), priority: 20 },
    { name: 'Scale Without Logistics', category: 'operations', condition: JSON.stringify({ type: 'and', conditions: [{ type: 'comparison', field: 'attendees', operator: 'gte', value: 3000 }, { type: 'comparison', field: 'services', operator: 'not_contains', value: 'logistics' }] }), risk_output: JSON.stringify({ level: 'high', title: 'Missing Logistics', description: 'Events with 3000+ attendees need logistics management.', mitigation: 'Add logistics service to scope' }), priority: 20 },
  ]
  for (const rr of riskRules) {
    await db.insert(schema.risk_rules).values(rr)
  }

  // --- Add tools permissions ---
  console.log('  Adding tools permissions...')
  const { permissions, role_permissions, roles } = schema
  const { eq, and: drizzleAnd } = await import('drizzle-orm')

  // Get admin and manager role IDs
  const allRoles = await db.select().from(roles)
  const adminRoles = allRoles.filter(r => ['super_admin', 'admin', 'event_manager', 'project_manager'].includes(r.name))

  for (const action of ['view', 'create', 'edit', 'delete']) {
    try {
      const [perm] = await db.insert(permissions).values({
        module: 'tools',
        action,
        description: `${action} tools`,
      }).returning({ id: permissions.id })

      for (const role of adminRoles) {
        try {
          await db.insert(role_permissions).values({
            role_id: role.id,
            permission_id: perm.id,
          })
        } catch { /* skip if exists */ }
      }
    } catch { /* skip if exists */ }
  }

  console.log('  Tools data seeded successfully!')
  await pool.end()
}

seedTools().catch((err) => {
  console.error('Tools seed failed:', err)
  process.exit(1)
})
