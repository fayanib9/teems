import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { hashSync } from 'bcryptjs'
import * as schema from '../src/db/schema'

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
]

const ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export']

// Which roles get which module permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: MODULES.map(m => ACTIONS.map(a => `${m}:${a}`)).flat(),
  executive: ['dashboard:view', 'events:view', 'events:export', 'tasks:view', 'calendar:view', 'clients:view', 'vendors:view', 'speakers:view', 'exhibitors:view', 'teams:view', 'documents:view', 'approvals:view', 'approvals:approve', 'reports:view', 'users:view'],
  event_manager: ['dashboard:view', 'events:view', 'events:create', 'events:edit', 'events:delete', 'events:export', 'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:delete', 'calendar:view', 'clients:view', 'clients:edit', 'vendors:view', 'vendors:edit', 'speakers:view', 'speakers:create', 'speakers:edit', 'speakers:delete', 'exhibitors:view', 'exhibitors:create', 'exhibitors:edit', 'exhibitors:delete', 'teams:view', 'teams:edit', 'documents:view', 'documents:create', 'documents:edit', 'documents:delete', 'approvals:view', 'approvals:create', 'approvals:edit', 'reports:view', 'activity_logs:view'],
  project_manager: ['dashboard:view', 'events:view', 'events:edit', 'events:export', 'tasks:view', 'tasks:create', 'tasks:edit', 'tasks:delete', 'calendar:view', 'vendors:view', 'speakers:view', 'exhibitors:view', 'teams:view', 'documents:view', 'documents:create', 'documents:edit', 'approvals:view', 'reports:view', 'activity_logs:view'],
  team_member: ['dashboard:view', 'events:view', 'tasks:view', 'tasks:edit', 'calendar:view', 'documents:view', 'documents:create', 'approvals:view'],
  finance_reviewer: ['dashboard:view', 'events:view', 'events:export', 'tasks:view', 'calendar:view', 'vendors:view', 'documents:view', 'approvals:view', 'approvals:approve', 'reports:view'],
  procurement_coordinator: ['dashboard:view', 'events:view', 'tasks:view', 'calendar:view', 'vendors:view', 'vendors:create', 'vendors:edit', 'vendors:delete', 'documents:view', 'documents:create', 'approvals:view', 'approvals:approve', 'reports:view'],
  operations_coordinator: ['dashboard:view', 'events:view', 'events:edit', 'events:export', 'tasks:view', 'tasks:create', 'tasks:edit', 'calendar:view', 'speakers:view', 'speakers:edit', 'exhibitors:view', 'exhibitors:create', 'exhibitors:edit', 'exhibitors:delete', 'teams:view', 'documents:view', 'documents:create', 'documents:edit', 'approvals:view', 'approvals:approve', 'reports:view'],
}

const EVENT_TYPES = [
  { name: 'Conference', color: '#7C3AED', icon: 'Mic' },
  { name: 'Exhibition', color: '#2563EB', icon: 'Presentation' },
  { name: 'Workshop', color: '#059669', icon: 'BookOpen' },
  { name: 'Gala Dinner', color: '#D97706', icon: 'UtensilsCrossed' },
  { name: 'Forum', color: '#DC2626', icon: 'Users' },
  { name: 'Ceremony', color: '#7C3AED', icon: 'Award' },
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
  for (const et of EVENT_TYPES) {
    await db.insert(schema.event_types).values(et)
  }

  // 5. Default admin user
  console.log('  Creating admin user...')
  await db.insert(schema.users).values({
    email: 'admin@toada.com',
    password_hash: hashSync('admin123', 12),
    first_name: 'Hala',
    last_name: 'Admin',
    role_id: insertedRoles['super_admin'],
    user_type: 'internal',
    is_active: true,
  })

  // 6. Demo event manager
  await db.insert(schema.users).values({
    email: 'manager@toada.com',
    password_hash: hashSync('manager123', 12),
    first_name: 'Sara',
    last_name: 'Event Manager',
    role_id: insertedRoles['event_manager'],
    user_type: 'internal',
    is_active: true,
  })

  // 7. Demo team member
  await db.insert(schema.users).values({
    email: 'team@toada.com',
    password_hash: hashSync('team123', 12),
    first_name: 'Ahmed',
    last_name: 'Team',
    role_id: insertedRoles['team_member'],
    user_type: 'internal',
    is_active: true,
  })

  console.log('\nSeed complete!')
  console.log('  Admin:   admin@toada.com / admin123')
  console.log('  Manager: manager@toada.com / manager123')
  console.log('  Member:  team@toada.com / team123')

  await pool.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
