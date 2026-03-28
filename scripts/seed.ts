import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { hashSync } from 'bcryptjs'
import * as schema from '../src/db/schema'
import * as extSchema from '../src/db/schema-extensions'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://teems:teems@localhost:5432/teems',
})

const db = drizzle(pool, { schema })

const ROLES = [
  { name: 'super_admin', display_name: 'Super Admin', description: 'Full system access', is_system: true },
  { name: 'admin', display_name: 'Admin', description: 'Full operational access', is_system: true },
  { name: 'executive', display_name: 'Executive', description: 'View dashboards and reports', is_system: true },
  { name: 'event_manager', display_name: 'Event Manager', description: 'Manage assigned events fully', is_system: false },
  { name: 'project_manager', display_name: 'Project Manager', description: 'Manage tasks and timelines', is_system: false },
  { name: 'team_member', display_name: 'Team Member', description: 'Work on assigned tasks', is_system: false },
  { name: 'finance_reviewer', display_name: 'Finance Reviewer', description: 'Review budgets and approve finances', is_system: false },
  { name: 'procurement_coordinator', display_name: 'Procurement Coordinator', description: 'Manage vendors', is_system: false },
  { name: 'operations_coordinator', display_name: 'Operations Coordinator', description: 'Manage sessions and booths', is_system: false },
  { name: 'client', display_name: 'Client', description: 'External client portal', is_system: true },
  { name: 'vendor', display_name: 'Vendor', description: 'External vendor portal', is_system: true },
  { name: 'speaker', display_name: 'Speaker', description: 'External speaker portal', is_system: true },
  { name: 'exhibitor', display_name: 'Exhibitor', description: 'External exhibitor portal', is_system: true },
]

const MODULES = [
  'dashboard', 'events', 'tasks', 'calendar', 'clients',
  'vendors', 'speakers', 'exhibitors', 'teams', 'documents',
  'approvals', 'reports', 'users', 'settings', 'activity_logs',
  'tools',
]

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export']

// Which roles get which module permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: MODULES.map(m => ACTIONS.map(a => `${m}:${a}`)).flat(),
  executive: ['dashboard:view', 'events:view', 'events:export', 'tasks:view', 'calendar:view', 'clients:view', 'vendors:view', 'speakers:view', 'exhibitors:view', 'teams:view', 'documents:view', 'approvals:view', 'approvals:approve', 'reports:view', 'users:view'],
  event_manager: ['dashboard:view', 'events:view', 'events:create', 'events:edit', 'events:delete', 'events:export', 'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:delete', 'calendar:view', 'clients:view', 'clients:edit', 'vendors:view', 'vendors:edit', 'speakers:view', 'speakers:create', 'speakers:edit', 'speakers:delete', 'exhibitors:view', 'exhibitors:create', 'exhibitors:edit', 'exhibitors:delete', 'teams:view', 'teams:edit', 'documents:view', 'documents:create', 'documents:edit', 'documents:delete', 'approvals:view', 'approvals:create', 'approvals:edit', 'reports:view', 'activity_logs:view', 'tools:view', 'tools:create', 'tools:edit', 'tools:delete'],
  project_manager: ['dashboard:view', 'events:view', 'events:edit', 'events:export', 'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:delete', 'calendar:view', 'vendors:view', 'speakers:view', 'exhibitors:view', 'teams:view', 'documents:view', 'documents:create', 'documents:edit', 'approvals:view', 'reports:view', 'activity_logs:view', 'tools:view', 'tools:create'],
  team_member: ['dashboard:view', 'events:view', 'tasks:view', 'tasks:edit', 'calendar:view', 'documents:view', 'documents:create', 'approvals:view'],
  finance_reviewer: ['dashboard:view', 'events:view', 'events:export', 'tasks:view', 'calendar:view', 'vendors:view', 'documents:view', 'approvals:view', 'approvals:approve', 'reports:view'],
  procurement_coordinator: ['dashboard:view', 'events:view', 'tasks:view', 'calendar:view', 'vendors:view', 'vendors:create', 'vendors:edit', 'vendors:delete', 'documents:view', 'documents:create', 'approvals:view', 'approvals:approve', 'reports:view'],
  operations_coordinator: ['dashboard:view', 'events:view', 'events:edit', 'events:export', 'tasks:view', 'tasks:create', 'tasks:edit', 'calendar:view', 'speakers:view', 'speakers:edit', 'exhibitors:view', 'exhibitors:create', 'exhibitors:edit', 'exhibitors:delete', 'teams:view', 'documents:view', 'documents:create', 'documents:edit', 'approvals:view', 'approvals:approve', 'reports:view'],
}

const EVENT_TYPES = [
  { name: 'Conference', color: '#312C6A', icon: 'Mic' },
  { name: 'Exhibition', color: '#2563EB', icon: 'Presentation' },
  { name: 'Workshop', color: '#059669', icon: 'BookOpen' },
  { name: 'Gala Dinner', color: '#D97706', icon: 'UtensilsCrossed' },
  { name: 'Forum', color: '#DC2626', icon: 'Users' },
  { name: 'Ceremony', color: '#312C6A', icon: 'Award' },
  { name: 'Corporate Meeting', color: '#6B7280', icon: 'Briefcase' },
]

async function seed() {
  console.log('Seeding TEEMS database...')

  // 1. Roles
  console.log('  Creating roles...')
  const insertedRoles: Record<string, number> = {}
  for (const role of ROLES) {
    const [r] = await db.insert(schema.roles).values(role).returning({ id: schema.roles.id })
    insertedRoles[role.name] = r.id
  }

  // 2. Permissions
  console.log('  Creating permissions...')
  const insertedPerms: Record<string, number> = {}
  for (const mod of MODULES) {
    for (const action of ACTIONS) {
      const [p] = await db.insert(schema.permissions).values({
        module: mod,
        action,
        description: `${action} ${mod}`,
      }).returning({ id: schema.permissions.id })
      insertedPerms[`${mod}:${action}`] = p.id
    }
  }

  // 3. Role-Permission assignments
  console.log('  Assigning permissions to roles...')
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = insertedRoles[roleName]
    for (const perm of perms) {
      const permId = insertedPerms[perm]
      if (roleId && permId) {
        await db.insert(schema.role_permissions).values({
          role_id: roleId,
          permission_id: permId,
        })
      }
    }
  }

  // 4. Event Types
  console.log('  Creating event types...')
  const insertedEventTypes: Record<string, number> = {}
  for (const et of EVENT_TYPES) {
    const [inserted] = await db.insert(schema.event_types).values(et).returning({ id: schema.event_types.id })
    insertedEventTypes[et.name] = inserted.id
  }

  // 5. Default admin user
  console.log('  Creating admin user...')
  const [adminUser] = await db.insert(schema.users).values({
    email: 'admin@toada.com',
    password_hash: hashSync('admin123', 12),
    first_name: 'Hala',
    last_name: 'Admin',
    role_id: insertedRoles['super_admin'],
    user_type: 'internal',
    is_active: true,
  }).returning({ id: schema.users.id })

  // 6. Demo event manager
  const [managerUser] = await db.insert(schema.users).values({
    email: 'manager@toada.com',
    password_hash: hashSync('manager123', 12),
    first_name: 'Sara',
    last_name: 'Event Manager',
    role_id: insertedRoles['event_manager'],
    user_type: 'internal',
    is_active: true,
  }).returning({ id: schema.users.id })

  // 7. Demo team member
  const [teamUser] = await db.insert(schema.users).values({
    email: 'team@toada.com',
    password_hash: hashSync('team123', 12),
    first_name: 'Ahmed',
    last_name: 'Team',
    role_id: insertedRoles['team_member'],
    user_type: 'internal',
    is_active: true,
  }).returning({ id: schema.users.id })

  // ─── Demo Data ───────────────────────────────────────────────────
  console.log('  Creating demo data...')

  // Demo Clients
  console.log('    Creating demo clients...')
  const [aramcoClient] = await db.insert(schema.clients).values({
    name: 'Saudi Aramco',
    contact_name: 'Fahad Al-Otaibi',
    email: 'fahad.otaibi@aramco.com',
    phone: '+966 13 880 1234',
    address: 'Dhahran 31311, Eastern Province',
    city: 'Dhahran',
    country: 'Saudi Arabia',
    website: 'https://www.aramco.com',
    notes: 'Key account — energy sector',
    is_active: true,
  }).returning({ id: schema.clients.id })

  const [neomClient] = await db.insert(schema.clients).values({
    name: 'NEOM',
    contact_name: 'Lama Al-Sulaiman',
    email: 'lama.sulaiman@neom.com',
    phone: '+966 11 200 5678',
    address: 'NEOM, Tabuk Province',
    city: 'NEOM',
    country: 'Saudi Arabia',
    website: 'https://www.neom.com',
    notes: 'Giga-project — future city initiative',
    is_active: true,
  }).returning({ id: schema.clients.id })

  // Demo Event — Future Tech Summit 2026
  console.log('    Creating demo event...')
  const [demoEvent] = await db.insert(schema.events).values({
    title: 'Future Tech Summit 2026',
    slug: 'future-tech-summit-2026',
    description: 'A three-day conference bringing together technology leaders, innovators, and government officials to discuss the future of AI, IoT, and smart cities in the Kingdom.',
    event_type_id: insertedEventTypes['Conference'],
    client_id: aramcoClient.id,
    status: 'in_progress',
    priority: 'high',
    start_date: new Date('2026-05-15T09:00:00+03:00'),
    end_date: new Date('2026-05-17T18:00:00+03:00'),
    timezone: 'Asia/Riyadh',
    venue_name: 'Riyadh Front Exhibition Center',
    venue_address: 'King Khalid International Airport Road',
    venue_city: 'Riyadh',
    venue_country: 'Saudi Arabia',
    expected_attendees: 1500,
    budget_estimated: 50000000, // 500,000 SAR in halalas
    currency: 'SAR',
    health_score: 'green',
    completion_percentage: 35,
    created_by: adminUser.id,
  }).returning({ id: schema.events.id })

  // Assign manager to the event
  await db.insert(schema.event_assignments).values({
    event_id: demoEvent.id,
    user_id: managerUser.id,
    role_in_event: 'lead',
    assigned_by: adminUser.id,
  })

  // Demo Tasks
  console.log('    Creating demo tasks...')
  await db.insert(schema.tasks).values([
    {
      event_id: demoEvent.id,
      title: 'Venue setup and floor plan execution',
      description: 'Complete venue layout, signage installation, and booth placement per approved floor plan.',
      status: 'done',
      priority: 'high',
      assigned_to: teamUser.id,
      due_date: new Date('2026-05-14T18:00:00+03:00'),
      start_date: new Date('2026-05-10T09:00:00+03:00'),
      completed_at: new Date('2026-05-13T16:00:00+03:00'),
      estimated_hours: 40,
      actual_hours: 36,
      sort_order: 1,
      created_by: managerUser.id,
    },
    {
      event_id: demoEvent.id,
      title: 'Speaker coordination and agenda finalization',
      description: 'Confirm all speaker travel, presentations, and session timings. Send final briefing packets.',
      status: 'in_progress',
      priority: 'high',
      assigned_to: managerUser.id,
      due_date: new Date('2026-05-12T18:00:00+03:00'),
      start_date: new Date('2026-04-20T09:00:00+03:00'),
      estimated_hours: 30,
      sort_order: 2,
      created_by: managerUser.id,
    },
    {
      event_id: demoEvent.id,
      title: 'Catering finalization and dietary review',
      description: 'Finalize menu with caterer, confirm headcount, review dietary requirements from registrations.',
      status: 'todo',
      priority: 'medium',
      assigned_to: teamUser.id,
      due_date: new Date('2026-05-10T18:00:00+03:00'),
      start_date: new Date('2026-05-01T09:00:00+03:00'),
      estimated_hours: 16,
      sort_order: 3,
      created_by: managerUser.id,
    },
    {
      event_id: demoEvent.id,
      title: 'AV equipment testing and rehearsal',
      description: 'Test all audio-visual equipment, run full technical rehearsal with production vendor on-site.',
      status: 'in_progress',
      priority: 'high',
      assigned_to: teamUser.id,
      due_date: new Date('2026-05-14T18:00:00+03:00'),
      start_date: new Date('2026-05-08T09:00:00+03:00'),
      estimated_hours: 24,
      sort_order: 4,
      created_by: managerUser.id,
    },
    {
      event_id: demoEvent.id,
      title: 'Registration desk setup and staff briefing',
      description: 'Set up registration counters, test badge printers, brief check-in staff on procedures.',
      status: 'todo',
      priority: 'medium',
      assigned_to: teamUser.id,
      due_date: new Date('2026-05-14T18:00:00+03:00'),
      start_date: new Date('2026-05-12T09:00:00+03:00'),
      estimated_hours: 12,
      sort_order: 5,
      created_by: managerUser.id,
    },
  ])

  // Demo Vendors
  console.log('    Creating demo vendors...')
  const [avVendor] = await db.insert(schema.vendors).values({
    name: 'ProAV Solutions',
    category: 'production',
    contact_name: 'Khalid Al-Rashid',
    email: 'khalid@proav.sa',
    phone: '+966 11 456 7890',
    address: 'Al-Olaya District, Riyadh',
    website: 'https://www.proav.sa',
    tax_number: '300012345600003',
    rating: 5,
    notes: 'Premium AV & production vendor, experienced with large conferences.',
    is_active: true,
  }).returning({ id: schema.vendors.id })

  const [cateringVendor] = await db.insert(schema.vendors).values({
    name: 'Royal Feast Catering',
    category: 'catering',
    contact_name: 'Noura Al-Dosari',
    email: 'noura@royalfeast.sa',
    phone: '+966 11 234 5678',
    address: 'Al-Malqa District, Riyadh',
    website: 'https://www.royalfeast.sa',
    tax_number: '300098765400003',
    rating: 4,
    notes: 'Full-service catering with VIP and corporate event experience.',
    is_active: true,
  }).returning({ id: schema.vendors.id })

  const [decoVendor] = await db.insert(schema.vendors).values({
    name: 'Elegance Event Decor',
    category: 'decoration',
    contact_name: 'Maha Al-Zahrani',
    email: 'maha@elegancedecor.sa',
    phone: '+966 12 678 1234',
    address: 'Al-Rawdah District, Jeddah',
    website: 'https://www.elegancedecor.sa',
    tax_number: '300055667700003',
    rating: 4,
    notes: 'Specializes in large-scale conference and exhibition decor.',
    is_active: true,
  }).returning({ id: schema.vendors.id })

  // Link vendors to event
  console.log('    Linking vendors to event...')
  await db.insert(schema.event_vendors).values([
    {
      event_id: demoEvent.id,
      vendor_id: avVendor.id,
      service_description: 'Full AV production — main stage LED wall, sound system, lighting, and live streaming setup.',
      contract_amount: 12000000, // 120,000 SAR
      status: 'confirmed',
    },
    {
      event_id: demoEvent.id,
      vendor_id: cateringVendor.id,
      service_description: 'Three-day catering — lunch buffets, coffee breaks, and VIP dinner on Day 1.',
      contract_amount: 8500000, // 85,000 SAR
      status: 'confirmed',
    },
    {
      event_id: demoEvent.id,
      vendor_id: decoVendor.id,
      service_description: 'Venue decoration — entrance arch, stage backdrop, branded panels, and floral arrangements.',
      contract_amount: 4500000, // 45,000 SAR
      status: 'pending',
    },
  ])

  // Demo Speakers
  console.log('    Creating demo speakers...')
  const [speaker1] = await db.insert(schema.speakers).values({
    name: 'Dr. Amr Banaja',
    title: 'Chief AI Officer',
    organization: 'SDAIA (Saudi Data & AI Authority)',
    bio: 'Leading Saudi Arabia\'s national AI strategy. Expert in data governance and AI policy for government digital transformation.',
    email: 'amr.banaja@sdaia.gov.sa',
    phone: '+966 11 200 9999',
    is_active: true,
  }).returning({ id: schema.speakers.id })

  const [speaker2] = await db.insert(schema.speakers).values({
    name: 'Eng. Reem Al-Harbi',
    title: 'VP of Smart Cities',
    organization: 'NEOM Tech',
    bio: 'Pioneer in IoT-driven urban planning. Leading the smart infrastructure rollout for NEOM\'s cognitive cities initiative.',
    email: 'reem.harbi@neom.com',
    phone: '+966 11 200 8888',
    website: 'https://www.linkedin.com/in/reemharbi',
    is_active: true,
  }).returning({ id: schema.speakers.id })

  // Link speakers to event
  await db.insert(schema.event_speakers).values([
    {
      event_id: demoEvent.id,
      speaker_id: speaker1.id,
      role: 'keynote',
      fee: 2500000, // 25,000 SAR
      status: 'confirmed',
      travel_required: false,
      notes: 'Opening keynote — "AI-Powered Kingdom: Vision 2030 and Beyond"',
    },
    {
      event_id: demoEvent.id,
      speaker_id: speaker2.id,
      role: 'speaker',
      fee: 1500000, // 15,000 SAR
      status: 'confirmed',
      travel_required: true,
      accommodation_notes: 'Arriving May 14, departing May 18. Suite at Ritz-Carlton.',
      notes: 'Panel session — "Building the Cities of Tomorrow with IoT"',
    },
  ])

  // Demo Sponsors
  console.log('    Creating demo sponsors...')
  const [goldSponsor] = await db.insert(extSchema.sponsors).values({
    name: 'STC (Saudi Telecom Company)',
    contact_name: 'Abdullah Al-Kanhal',
    email: 'abdullah.kanhal@stc.com.sa',
    phone: '+966 11 452 0000',
    website: 'https://www.stc.com.sa',
    industry: 'Telecommunications',
    notes: 'Long-term strategic partner for technology events.',
    is_active: true,
  }).returning({ id: extSchema.sponsors.id })

  const [silverSponsor] = await db.insert(extSchema.sponsors).values({
    name: 'Elm Company',
    contact_name: 'Majed Al-Taweel',
    email: 'majed.taweel@elm.sa',
    phone: '+966 11 288 3333',
    website: 'https://www.elm.sa',
    industry: 'Digital Services',
    notes: 'Government digital services provider, interested in smart city events.',
    is_active: true,
  }).returning({ id: extSchema.sponsors.id })

  // Link sponsors to event
  await db.insert(extSchema.event_sponsors).values([
    {
      event_id: demoEvent.id,
      sponsor_id: goldSponsor.id,
      tier: 'gold',
      commitment_amount: 15000000, // 150,000 SAR
      paid_amount: 7500000, // 75,000 SAR paid so far
      logo_placement: 'Main stage backdrop, entrance banner, all printed materials',
      status: 'active',
    },
    {
      event_id: demoEvent.id,
      sponsor_id: silverSponsor.id,
      tier: 'silver',
      commitment_amount: 7500000, // 75,000 SAR
      paid_amount: 0,
      logo_placement: 'Session rooms, lanyards, event website',
      status: 'confirmed',
    },
  ])

  // Demo Attendees
  console.log('    Creating demo attendees...')
  await db.insert(extSchema.attendees).values([
    {
      event_id: demoEvent.id,
      first_name: 'Mohammed',
      last_name: 'Al-Qahtani',
      email: 'mohammed.qahtani@sabic.com',
      phone: '+966 50 123 4567',
      organization: 'SABIC',
      title: 'Director of Innovation',
      registration_type: 'vip',
      status: 'confirmed',
    },
    {
      event_id: demoEvent.id,
      first_name: 'Aisha',
      last_name: 'Al-Ghamdi',
      email: 'aisha.ghamdi@kaust.edu.sa',
      phone: '+966 55 234 5678',
      organization: 'KAUST',
      title: 'Research Scientist',
      registration_type: 'general',
      status: 'registered',
    },
    {
      event_id: demoEvent.id,
      first_name: 'Turki',
      last_name: 'Al-Shehri',
      email: 'turki.shehri@mcit.gov.sa',
      phone: '+966 54 345 6789',
      organization: 'MCIT',
      title: 'Deputy Minister Advisor',
      registration_type: 'vip',
      status: 'confirmed',
      dietary_requirements: 'No shellfish',
    },
    {
      event_id: demoEvent.id,
      first_name: 'Hanan',
      last_name: 'Al-Mutairi',
      email: 'hanan.mutairi@aramco.com',
      phone: '+966 56 456 7890',
      organization: 'Saudi Aramco',
      title: 'Digital Transformation Lead',
      registration_type: 'general',
      status: 'registered',
    },
    {
      event_id: demoEvent.id,
      first_name: 'Omar',
      last_name: 'Baeshen',
      email: 'omar.baeshen@kacst.edu.sa',
      phone: '+966 59 567 8901',
      organization: 'KACST',
      title: 'Program Manager',
      registration_type: 'general',
      status: 'confirmed',
    },
  ])

  console.log('  Demo data created successfully!')

  // 8. Tools seed data
  await seedTools()

  console.log('\nSeed complete!')
  console.log('  Admin:   admin@toada.com / admin123')
  console.log('  Manager: manager@toada.com / manager123')
  console.log('  Member:  team@toada.com / team123')

  await pool.end()
}

// ─── Tools Seed Data ────────────────────────────────────────────

async function seedTools() {
  console.log('  Seeding tools data...')

  // --- Plan Roles ---
  console.log('    Creating plan roles...')
  const PLAN_ROLES = [
    { name: 'Project Manager', color: '#312C6A' },
    { name: 'Operations Manager', color: '#2563EB' },
    { name: 'Creative Director', color: '#D97706' },
    { name: 'Procurement Officer', color: '#059669' },
    { name: 'Marketing Lead', color: '#DC2626' },
    { name: 'Technical Lead', color: '#7C3AED' },
    { name: 'Logistics Coordinator', color: '#0891B2' },
  ]
  for (const role of PLAN_ROLES) {
    await db.insert(schema.plan_roles).values(role)
  }

  // --- Plan Templates ---
  console.log('    Creating plan templates...')

  // Template 1: Conference
  const [confTemplate] = await db.insert(schema.plan_templates).values({
    name: 'Conference',
    description: 'Full conference planning template with 5 phases',
    event_type: 'Conference',
    is_default: true,
  }).returning({ id: schema.plan_templates.id })

  const confPhases = [
    { name: 'Strategy', color: '#312C6A', icon: 'Target', sort_order: 1 },
    { name: 'Planning', color: '#2563EB', icon: 'ClipboardList', sort_order: 2 },
    { name: 'Procurement', color: '#059669', icon: 'ShoppingCart', sort_order: 3 },
    { name: 'Execution', color: '#D97706', icon: 'Rocket', sort_order: 4 },
    { name: 'Closure', color: '#6B7280', icon: 'CheckCircle', sort_order: 5 },
  ]
  const confPhaseIds: Record<string, number> = {}
  for (const phase of confPhases) {
    const [p] = await db.insert(schema.plan_template_phases).values({
      template_id: confTemplate.id,
      ...phase,
    }).returning({ id: schema.plan_template_phases.id })
    confPhaseIds[phase.name] = p.id
  }

  const confTasks: Array<{ phase: string; name: string; duration_days: number; role: string; sort_order: number }> = [
    // Strategy
    { phase: 'Strategy', name: 'Define event objectives & KPIs', duration_days: 5, role: 'Project Manager', sort_order: 1 },
    { phase: 'Strategy', name: 'Stakeholder alignment meeting', duration_days: 2, role: 'Project Manager', sort_order: 2 },
    { phase: 'Strategy', name: 'Scope document & deliverables', duration_days: 3, role: 'Project Manager', sort_order: 3 },
    { phase: 'Strategy', name: 'Budget framework approval', duration_days: 3, role: 'Project Manager', sort_order: 4 },
    // Planning
    { phase: 'Planning', name: 'Venue selection & contracting', duration_days: 10, role: 'Operations Manager', sort_order: 1 },
    { phase: 'Planning', name: 'Content strategy development', duration_days: 7, role: 'Creative Director', sort_order: 2 },
    { phase: 'Planning', name: 'Speaker identification & outreach', duration_days: 14, role: 'Project Manager', sort_order: 3 },
    { phase: 'Planning', name: 'Branding & design brief', duration_days: 5, role: 'Creative Director', sort_order: 4 },
    { phase: 'Planning', name: 'Procurement plan', duration_days: 5, role: 'Procurement Officer', sort_order: 5 },
    { phase: 'Planning', name: 'Marketing plan', duration_days: 7, role: 'Marketing Lead', sort_order: 6 },
    { phase: 'Planning', name: 'Staffing plan', duration_days: 5, role: 'Operations Manager', sort_order: 7 },
    // Procurement
    { phase: 'Procurement', name: 'AV & production vendor selection', duration_days: 7, role: 'Procurement Officer', sort_order: 1 },
    { phase: 'Procurement', name: 'Print & branding production', duration_days: 10, role: 'Creative Director', sort_order: 2 },
    { phase: 'Procurement', name: 'Logistics vendor contracting', duration_days: 5, role: 'Logistics Coordinator', sort_order: 3 },
    { phase: 'Procurement', name: 'Technology setup & testing', duration_days: 5, role: 'Technical Lead', sort_order: 4 },
    // Execution
    { phase: 'Execution', name: 'Venue setup & decoration', duration_days: 3, role: 'Operations Manager', sort_order: 1 },
    { phase: 'Execution', name: 'Technical rehearsal', duration_days: 2, role: 'Technical Lead', sort_order: 2 },
    { phase: 'Execution', name: 'Speaker briefings', duration_days: 2, role: 'Project Manager', sort_order: 3 },
    { phase: 'Execution', name: 'Staff briefing & training', duration_days: 2, role: 'Operations Manager', sort_order: 4 },
    { phase: 'Execution', name: 'Marketing campaign launch', duration_days: 14, role: 'Marketing Lead', sort_order: 5 },
    { phase: 'Execution', name: 'Final walkthrough', duration_days: 1, role: 'Project Manager', sort_order: 6 },
    // Closure
    { phase: 'Closure', name: 'Post-event survey', duration_days: 3, role: 'Project Manager', sort_order: 1 },
    { phase: 'Closure', name: 'Vendor settlement', duration_days: 5, role: 'Procurement Officer', sort_order: 2 },
    { phase: 'Closure', name: 'Final report preparation', duration_days: 5, role: 'Project Manager', sort_order: 3 },
    { phase: 'Closure', name: 'Budget reconciliation', duration_days: 3, role: 'Project Manager', sort_order: 4 },
    { phase: 'Closure', name: 'Lessons learned session', duration_days: 1, role: 'Project Manager', sort_order: 5 },
  ]
  for (const task of confTasks) {
    await db.insert(schema.plan_template_tasks).values({
      phase_id: confPhaseIds[task.phase],
      name: task.name,
      duration_days: task.duration_days,
      role: task.role,
      sort_order: task.sort_order,
    })
  }

  // Template 2: Exhibition
  const [exhTemplate] = await db.insert(schema.plan_templates).values({
    name: 'Exhibition',
    description: 'Exhibition planning template with 5 phases',
    event_type: 'Exhibition',
  }).returning({ id: schema.plan_templates.id })

  const exhPhases = [
    { name: 'Strategy', color: '#312C6A', icon: 'Target', sort_order: 1 },
    { name: 'Planning', color: '#2563EB', icon: 'ClipboardList', sort_order: 2 },
    { name: 'Procurement', color: '#059669', icon: 'ShoppingCart', sort_order: 3 },
    { name: 'Execution', color: '#D97706', icon: 'Rocket', sort_order: 4 },
    { name: 'Closure', color: '#6B7280', icon: 'CheckCircle', sort_order: 5 },
  ]
  const exhPhaseIds: Record<string, number> = {}
  for (const phase of exhPhases) {
    const [p] = await db.insert(schema.plan_template_phases).values({
      template_id: exhTemplate.id,
      ...phase,
    }).returning({ id: schema.plan_template_phases.id })
    exhPhaseIds[phase.name] = p.id
  }

  const exhTasks: Array<{ phase: string; name: string; duration_days: number; role: string; sort_order: number }> = [
    // Strategy
    { phase: 'Strategy', name: 'Exhibition concept & theme', duration_days: 5, role: 'Creative Director', sort_order: 1 },
    { phase: 'Strategy', name: 'Floor plan & space allocation', duration_days: 7, role: 'Operations Manager', sort_order: 2 },
    { phase: 'Strategy', name: 'Exhibitor package design', duration_days: 5, role: 'Marketing Lead', sort_order: 3 },
    { phase: 'Strategy', name: 'Budget framework', duration_days: 3, role: 'Project Manager', sort_order: 4 },
    // Planning
    { phase: 'Planning', name: 'Venue booking & logistics', duration_days: 10, role: 'Operations Manager', sort_order: 1 },
    { phase: 'Planning', name: 'Exhibitor recruitment & onboarding', duration_days: 21, role: 'Marketing Lead', sort_order: 2 },
    { phase: 'Planning', name: 'Booth design & specifications', duration_days: 10, role: 'Creative Director', sort_order: 3 },
    { phase: 'Planning', name: 'Registration system setup', duration_days: 7, role: 'Technical Lead', sort_order: 4 },
    { phase: 'Planning', name: 'Marketing & PR strategy', duration_days: 10, role: 'Marketing Lead', sort_order: 5 },
    { phase: 'Planning', name: 'Sponsorship management', duration_days: 14, role: 'Project Manager', sort_order: 6 },
    { phase: 'Planning', name: 'Staffing & volunteer plan', duration_days: 5, role: 'Operations Manager', sort_order: 7 },
    // Procurement
    { phase: 'Procurement', name: 'Booth construction vendor', duration_days: 10, role: 'Procurement Officer', sort_order: 1 },
    { phase: 'Procurement', name: 'AV & lighting vendor', duration_days: 7, role: 'Procurement Officer', sort_order: 2 },
    { phase: 'Procurement', name: 'Signage & wayfinding production', duration_days: 7, role: 'Creative Director', sort_order: 3 },
    { phase: 'Procurement', name: 'Security & crowd control', duration_days: 5, role: 'Operations Manager', sort_order: 4 },
    { phase: 'Procurement', name: 'Logistics & freight coordination', duration_days: 7, role: 'Logistics Coordinator', sort_order: 5 },
    // Execution
    { phase: 'Execution', name: 'Venue build-out', duration_days: 5, role: 'Operations Manager', sort_order: 1 },
    { phase: 'Execution', name: 'Exhibitor booth setup support', duration_days: 3, role: 'Logistics Coordinator', sort_order: 2 },
    { phase: 'Execution', name: 'Technical infrastructure setup', duration_days: 3, role: 'Technical Lead', sort_order: 3 },
    { phase: 'Execution', name: 'Exhibitor briefing', duration_days: 1, role: 'Project Manager', sort_order: 4 },
    { phase: 'Execution', name: 'Staff deployment & training', duration_days: 2, role: 'Operations Manager', sort_order: 5 },
    { phase: 'Execution', name: 'Opening ceremony preparation', duration_days: 2, role: 'Creative Director', sort_order: 6 },
    { phase: 'Execution', name: 'Daily operations management', duration_days: 3, role: 'Operations Manager', sort_order: 7 },
    // Closure
    { phase: 'Closure', name: 'Exhibitor teardown coordination', duration_days: 2, role: 'Logistics Coordinator', sort_order: 1 },
    { phase: 'Closure', name: 'Venue restoration', duration_days: 2, role: 'Operations Manager', sort_order: 2 },
    { phase: 'Closure', name: 'Exhibitor feedback survey', duration_days: 3, role: 'Marketing Lead', sort_order: 3 },
    { phase: 'Closure', name: 'Vendor settlement', duration_days: 5, role: 'Procurement Officer', sort_order: 4 },
    { phase: 'Closure', name: 'Post-event report', duration_days: 5, role: 'Project Manager', sort_order: 5 },
    { phase: 'Closure', name: 'ROI analysis', duration_days: 3, role: 'Project Manager', sort_order: 6 },
  ]
  for (const task of exhTasks) {
    await db.insert(schema.plan_template_tasks).values({
      phase_id: exhPhaseIds[task.phase],
      name: task.name,
      duration_days: task.duration_days,
      role: task.role,
      sort_order: task.sort_order,
    })
  }

  // Template 3: Corporate Event (universal fallback)
  const [corpTemplate] = await db.insert(schema.plan_templates).values({
    name: 'Corporate Event',
    description: 'Universal fallback template for corporate events, galas, activations, etc.',
    event_type: null,
  }).returning({ id: schema.plan_templates.id })

  const corpPhases = [
    { name: 'Planning', color: '#2563EB', icon: 'ClipboardList', sort_order: 1 },
    { name: 'Execution', color: '#D97706', icon: 'Rocket', sort_order: 2 },
    { name: 'Closure', color: '#6B7280', icon: 'CheckCircle', sort_order: 3 },
  ]
  const corpPhaseIds: Record<string, number> = {}
  for (const phase of corpPhases) {
    const [p] = await db.insert(schema.plan_template_phases).values({
      template_id: corpTemplate.id,
      ...phase,
    }).returning({ id: schema.plan_template_phases.id })
    corpPhaseIds[phase.name] = p.id
  }

  const corpTasks: Array<{ phase: string; name: string; duration_days: number; role: string; sort_order: number }> = [
    // Planning
    { phase: 'Planning', name: 'Event brief & objectives', duration_days: 3, role: 'Project Manager', sort_order: 1 },
    { phase: 'Planning', name: 'Venue selection', duration_days: 5, role: 'Operations Manager', sort_order: 2 },
    { phase: 'Planning', name: 'Theme & creative concept', duration_days: 5, role: 'Creative Director', sort_order: 3 },
    { phase: 'Planning', name: 'Budget allocation', duration_days: 2, role: 'Project Manager', sort_order: 4 },
    { phase: 'Planning', name: 'Vendor shortlisting', duration_days: 5, role: 'Procurement Officer', sort_order: 5 },
    // Execution
    { phase: 'Execution', name: 'Vendor contracting & coordination', duration_days: 7, role: 'Procurement Officer', sort_order: 1 },
    { phase: 'Execution', name: 'Creative production', duration_days: 10, role: 'Creative Director', sort_order: 2 },
    { phase: 'Execution', name: 'Venue setup & decoration', duration_days: 3, role: 'Operations Manager', sort_order: 3 },
    { phase: 'Execution', name: 'Technical setup & rehearsal', duration_days: 2, role: 'Technical Lead', sort_order: 4 },
    { phase: 'Execution', name: 'Staff briefing', duration_days: 1, role: 'Operations Manager', sort_order: 5 },
    { phase: 'Execution', name: 'Event day management', duration_days: 1, role: 'Project Manager', sort_order: 6 },
    // Closure
    { phase: 'Closure', name: 'Vendor settlement', duration_days: 3, role: 'Procurement Officer', sort_order: 1 },
    { phase: 'Closure', name: 'Event report', duration_days: 3, role: 'Project Manager', sort_order: 2 },
    { phase: 'Closure', name: 'Feedback collection', duration_days: 2, role: 'Project Manager', sort_order: 3 },
  ]
  for (const task of corpTasks) {
    await db.insert(schema.plan_template_tasks).values({
      phase_id: corpPhaseIds[task.phase],
      name: task.name,
      duration_days: task.duration_days,
      role: task.role,
      sort_order: task.sort_order,
    })
  }

  // --- Plan Rules ---
  console.log('    Creating plan rules...')
  const planRules = [
    // Template Selection (priority: 10)
    {
      name: 'Conference Template',
      description: 'Select Conference template for conference events',
      category: 'template_selection',
      condition: JSON.stringify({ field: 'event_type', operator: 'eq', value: 'Conference' }),
      actions: JSON.stringify([{ type: 'select_template', template: 'Conference' }]),
      priority: 10,
    },
    {
      name: 'Exhibition Template',
      description: 'Select Exhibition template for exhibition events',
      category: 'template_selection',
      condition: JSON.stringify({ field: 'event_type', operator: 'eq', value: 'Exhibition' }),
      actions: JSON.stringify([{ type: 'select_template', template: 'Exhibition' }]),
      priority: 10,
    },
    {
      name: 'Corporate Fallback',
      description: 'Select Corporate Event template for other event types',
      category: 'template_selection',
      condition: JSON.stringify({ field: 'event_type', operator: 'in', value: ['Corporate Event', 'Gala Dinner', 'Activation', 'Workshop', 'Networking'] }),
      actions: JSON.stringify([{ type: 'select_template', template: 'Corporate Event' }]),
      priority: 10,
    },
    // Task Injection (priority: 50)
    {
      name: 'Catering Tasks',
      description: 'Add catering-related tasks when catering service is selected',
      category: 'task_injection',
      condition: JSON.stringify({ field: 'services', operator: 'contains', value: 'catering' }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Menu planning', duration_days: 7 },
        { type: 'add_task', phase: 'Procurement', name: 'Catering contract', duration_days: 5 },
        { type: 'add_task', phase: 'Execution', name: 'Catering setup', duration_days: 2 },
      ]),
      priority: 50,
    },
    {
      name: 'Registration Tasks',
      description: 'Add registration tasks when registration service is selected',
      category: 'task_injection',
      condition: JSON.stringify({ field: 'services', operator: 'contains', value: 'registration' }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Registration platform', duration_days: 5 },
        { type: 'add_task', phase: 'Execution', name: 'QR/badge system', duration_days: 3 },
        { type: 'add_task', phase: 'Execution', name: 'On-site check-in setup', duration_days: 2 },
      ]),
      priority: 50,
    },
    {
      name: 'Production Tasks',
      description: 'Add production tasks when production service is selected',
      category: 'task_injection',
      condition: JSON.stringify({ field: 'services', operator: 'contains', value: 'production' }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'AV requirements spec', duration_days: 3 },
        { type: 'add_task', phase: 'Execution', name: 'Production rehearsal', duration_days: 2 },
        { type: 'add_task', phase: 'Execution', name: 'Live production management', duration_days: 1 },
      ]),
      priority: 50,
    },
    {
      name: 'Content Tasks',
      description: 'Add content tasks when content service is selected',
      category: 'task_injection',
      condition: JSON.stringify({ field: 'services', operator: 'contains', value: 'content' }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Content creation & review', duration_days: 10 },
        { type: 'add_task', phase: 'Execution', name: 'Speaker presentations prep', duration_days: 5 },
      ]),
      priority: 50,
    },
    {
      name: 'Branding Tasks',
      description: 'Add branding tasks when branding service is selected',
      category: 'task_injection',
      condition: JSON.stringify({ field: 'services', operator: 'contains', value: 'branding' }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Brand guidelines adaptation', duration_days: 5 },
        { type: 'add_task', phase: 'Procurement', name: 'Signage production', duration_days: 7 },
      ]),
      priority: 50,
    },
    {
      name: 'Logistics Tasks',
      description: 'Add logistics tasks when logistics service is selected',
      category: 'task_injection',
      condition: JSON.stringify({ field: 'services', operator: 'contains', value: 'logistics' }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Transport coordination', duration_days: 5 },
        { type: 'add_task', phase: 'Execution', name: 'On-site logistics management', duration_days: 2 },
      ]),
      priority: 50,
    },
    {
      name: 'Staffing Tasks',
      description: 'Add staffing tasks when staffing service is selected',
      category: 'task_injection',
      condition: JSON.stringify({ field: 'services', operator: 'contains', value: 'staffing' }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Staff recruitment', duration_days: 7 },
        { type: 'add_task', phase: 'Execution', name: 'Staff training session', duration_days: 2 },
      ]),
      priority: 50,
    },
    {
      name: 'Marketing Tasks',
      description: 'Add marketing tasks when marketing service is selected',
      category: 'task_injection',
      condition: JSON.stringify({ field: 'services', operator: 'contains', value: 'marketing' }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Campaign strategy', duration_days: 5 },
        { type: 'add_task', phase: 'Execution', name: 'Digital marketing execution', duration_days: 10 },
        { type: 'add_task', phase: 'Execution', name: 'PR & media outreach', duration_days: 7 },
      ]),
      priority: 50,
    },
    // Complexity (priority: 30)
    {
      name: 'Large Scale',
      description: 'Apply large scale complexity for 5000+ attendees',
      category: 'complexity',
      condition: JSON.stringify({ field: 'attendees', operator: 'gte', value: 5000 }),
      actions: JSON.stringify([
        { type: 'set_complexity_weight', dimension: 'scale', score: 3, weight: 0.9 },
        { type: 'add_task', phase: 'Planning', name: 'Crowd management plan', duration_days: 5 },
        { type: 'add_task', phase: 'Planning', name: 'Emergency evacuation plan', duration_days: 3 },
      ]),
      priority: 30,
    },
    {
      name: 'Medium Scale',
      description: 'Apply medium scale complexity for 500-4999 attendees',
      category: 'complexity',
      condition: JSON.stringify({ operator: 'and', conditions: [
        { field: 'attendees', operator: 'gte', value: 500 },
        { field: 'attendees', operator: 'lt', value: 5000 },
      ]}),
      actions: JSON.stringify([
        { type: 'set_complexity_weight', dimension: 'scale', score: 3, weight: 0.5 },
      ]),
      priority: 30,
    },
    {
      name: 'Small Scale',
      description: 'Apply small scale complexity for under 500 attendees',
      category: 'complexity',
      condition: JSON.stringify({ field: 'attendees', operator: 'lt', value: 500 }),
      actions: JSON.stringify([
        { type: 'set_complexity_weight', dimension: 'scale', score: 3, weight: 0.2 },
      ]),
      priority: 30,
    },
    // Timeline Compression (priority: 60)
    {
      name: 'Fast Track',
      description: 'Compress timeline by 30% for fast-track urgency',
      category: 'timeline',
      condition: JSON.stringify({ field: 'urgency', operator: 'eq', value: 'fast_track' }),
      actions: JSON.stringify([
        { type: 'modify_duration', target: '*', multiplier: 0.7 },
        { type: 'add_risk', level: 'medium', title: 'Compressed Timeline', description: 'Fast-track reduces buffer by 30%' },
      ]),
      priority: 60,
    },
    {
      name: 'Critical Timeline',
      description: 'Compress timeline by 50% for critical urgency',
      category: 'timeline',
      condition: JSON.stringify({ field: 'urgency', operator: 'eq', value: 'critical' }),
      actions: JSON.stringify([
        { type: 'modify_duration', target: '*', multiplier: 0.5 },
        { type: 'add_risk', level: 'high', title: 'Critical Timeline', description: 'Timeline compressed by 50%. Parallel execution required.' },
      ]),
      priority: 60,
    },
    // Risk Detection (priority: 70)
    {
      name: 'Budget-Scale Mismatch',
      description: 'Detect when budget is insufficient for attendee count',
      category: 'risk_detection',
      condition: JSON.stringify({ operator: 'and', conditions: [
        { field: 'budget_range', operator: 'eq', value: 'under_500k' },
        { field: 'attendees', operator: 'gte', value: 1000 },
      ]}),
      actions: JSON.stringify([
        { type: 'add_risk', level: 'high', title: 'Budget-Scale Mismatch', description: 'Budget may be insufficient for 1000+ attendees' },
      ]),
      priority: 70,
    },
    {
      name: 'Government Protocol',
      description: 'Add government protocol tasks and risk when government is involved',
      category: 'risk_detection',
      condition: JSON.stringify({ field: 'has_government', operator: 'eq', value: true }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Government protocol coordination', duration_days: 10 },
        { type: 'add_task', phase: 'Execution', name: 'Security coordination', duration_days: 5 },
        { type: 'add_risk', level: 'medium', title: 'Government Protocol', description: 'Government involvement requires protocol adherence' },
      ]),
      priority: 70,
    },
    {
      name: 'International Speakers',
      description: 'Add travel arrangement tasks for international speakers',
      category: 'risk_detection',
      condition: JSON.stringify({ field: 'has_international_speakers', operator: 'eq', value: true }),
      actions: JSON.stringify([
        { type: 'add_task', phase: 'Planning', name: 'Visa & travel arrangements', duration_days: 14 },
        { type: 'add_task', phase: 'Planning', name: 'Accommodation booking', duration_days: 5 },
      ]),
      priority: 70,
    },
    // Recommendations (priority: 80)
    {
      name: 'Suggest Registration',
      description: 'Recommend registration platform for large events',
      category: 'recommendation',
      condition: JSON.stringify({ operator: 'and', conditions: [
        { field: 'attendees', operator: 'gte', value: 200 },
        { field: 'services', operator: 'not_contains', value: 'registration' },
      ]}),
      actions: JSON.stringify([
        { type: 'add_recommendation', title: 'Consider Registration Platform', description: 'Events with 200+ attendees benefit from a dedicated registration system' },
      ]),
      priority: 80,
    },
  ]
  for (const rule of planRules) {
    await db.insert(schema.plan_rules).values(rule)
  }

  // --- Budget Category Defaults ---
  console.log('    Creating budget category defaults...')
  const budgetDefaults = [
    { category: 'venue', label: 'Venue & Facilities', base_cost_per_person: 5000, min_percentage: 25, max_percentage: 35 },
    { category: 'catering', label: 'Catering & F&B', base_cost_per_person: 8000, min_percentage: 20, max_percentage: 30 },
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
  console.log('    Creating vendor match weights...')
  const vendorWeights = [
    { criterion: 'category_match', weight: 30, description: 'Service category matches required services' },
    { criterion: 'rating', weight: 25, description: 'Vendor rating and quality score' },
    { criterion: 'budget_fit', weight: 20, description: 'Historical pricing fits budget range' },
    { criterion: 'experience', weight: 15, description: 'Number of past events with this vendor' },
    { criterion: 'availability', weight: 10, description: 'Not booked for conflicting dates' },
  ]
  for (const vw of vendorWeights) {
    await db.insert(schema.vendor_match_weights).values(vw)
  }

  // --- Risk Rules ---
  console.log('    Creating risk rules...')
  const riskRules = [
    {
      name: 'Short Timeline',
      category: 'timeline',
      condition: JSON.stringify({ field: 'days_remaining', operator: 'lt', value: 30 }),
      risk_output: JSON.stringify({ level: 'high', title: 'Tight Timeline', description: 'Less than 30 days until event. Prioritize critical path tasks and consider parallel execution.', mitigation: 'Fast-track vendor contracting, reduce review cycles, assign dedicated project manager' }),
      priority: 10,
    },
    {
      name: 'Very Short Timeline',
      category: 'timeline',
      condition: JSON.stringify({ field: 'days_remaining', operator: 'lt', value: 14 }),
      risk_output: JSON.stringify({ level: 'critical', title: 'Insufficient Timeline', description: 'Less than 14 days until event. Many standard processes cannot be completed in time.', mitigation: 'Emergency staffing, pre-approved vendor list, skip non-essential deliverables' }),
      priority: 5,
    },
    {
      name: 'Budget Mismatch',
      category: 'budget',
      condition: JSON.stringify({ operator: 'and', conditions: [
        { field: 'budget_range', operator: 'eq', value: 'under_500k' },
        { field: 'attendees', operator: 'gte', value: 2000 },
      ]}),
      risk_output: JSON.stringify({ level: 'high', title: 'Budget-Scale Mismatch', description: 'Budget under 500K SAR for 2000+ attendees may result in quality compromises.', mitigation: 'Negotiate bulk vendor discounts, reduce scope, or seek sponsorship funding' }),
      priority: 20,
    },
    {
      name: 'Large Outdoor Event',
      category: 'venue',
      condition: JSON.stringify({ operator: 'and', conditions: [
        { field: 'venue_type', operator: 'eq', value: 'outdoor' },
        { field: 'attendees', operator: 'gte', value: 1000 },
      ]}),
      risk_output: JSON.stringify({ level: 'medium', title: 'Weather & Environment', description: 'Large outdoor events are vulnerable to weather disruptions.', mitigation: 'Prepare weather contingency plan, backup indoor venue, tent/shade structures' }),
      priority: 30,
    },
    {
      name: 'Government Compliance',
      category: 'compliance',
      condition: JSON.stringify({ field: 'has_government', operator: 'eq', value: true }),
      risk_output: JSON.stringify({ level: 'medium', title: 'Regulatory Compliance', description: 'Government involvement requires strict protocol and security measures.', mitigation: 'Engage government liaison early, schedule protocol review, plan security screening' }),
      priority: 20,
    },
    {
      name: 'Scale Without Logistics',
      category: 'operations',
      condition: JSON.stringify({ operator: 'and', conditions: [
        { field: 'attendees', operator: 'gte', value: 3000 },
        { field: 'services', operator: 'not_contains', value: 'logistics' },
      ]}),
      risk_output: JSON.stringify({ level: 'high', title: 'Missing Logistics', description: 'Events with 3000+ attendees require dedicated logistics management.', mitigation: 'Add logistics service to scope, assign logistics coordinator, plan crowd flow' }),
      priority: 20,
    },
  ]
  for (const rr of riskRules) {
    await db.insert(schema.risk_rules).values(rr)
  }

  console.log('  Tools data seeded successfully!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
