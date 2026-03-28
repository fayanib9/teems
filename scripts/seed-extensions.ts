import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as extSchema from '../src/db/schema-extensions'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://teems:teems@localhost:5432/teems',
})

const db = drizzle(pool)

async function seed() {
  console.log('Seeding extension tables...')

  // ─── Checklist Templates ──────────────────────────────────

  console.log('  Seeding checklist templates...')

  const templates = [
    { name: 'Conference Checklist', event_type: 'Conference', description: 'Standard checklist for conference events', is_default: true },
    { name: 'Exhibition Checklist', event_type: 'Exhibition', description: 'Standard checklist for exhibition events', is_default: true },
    { name: 'Corporate Event Checklist', event_type: 'Corporate', description: 'Standard checklist for corporate events', is_default: true },
  ]

  for (const tpl of templates) {
    const [inserted] = await db.insert(extSchema.checklist_templates).values(tpl).returning()

    const items: { template_id: number; stage: string; item_name: string; is_required: boolean; sort_order: number }[] = []

    if (tpl.event_type === 'Conference') {
      items.push(
        // Planning
        { template_id: inserted.id, stage: 'planning', item_name: 'Define conference theme and objectives', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Confirm venue and sign contract', is_required: true, sort_order: 2 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Finalize speaker lineup', is_required: true, sort_order: 3 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Publish agenda and session schedule', is_required: true, sort_order: 4 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Set up registration portal', is_required: true, sort_order: 5 },
        // Execution
        { template_id: inserted.id, stage: 'execution', item_name: 'Complete AV and stage setup', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Conduct speaker rehearsal', is_required: true, sort_order: 2 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Print and distribute badges', is_required: true, sort_order: 3 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Verify catering delivery schedule', is_required: false, sort_order: 4 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Staff registration desk', is_required: true, sort_order: 5 },
        // Closure
        { template_id: inserted.id, stage: 'closure', item_name: 'Send attendee satisfaction survey', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'closure', item_name: 'Collect speaker feedback', is_required: false, sort_order: 2 },
        { template_id: inserted.id, stage: 'closure', item_name: 'Finalize vendor invoices', is_required: true, sort_order: 3 },
        { template_id: inserted.id, stage: 'closure', item_name: 'Compile post-event report', is_required: true, sort_order: 4 },
      )
    } else if (tpl.event_type === 'Exhibition') {
      items.push(
        // Planning
        { template_id: inserted.id, stage: 'planning', item_name: 'Design floor plan and booth layout', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Send exhibitor registration invites', is_required: true, sort_order: 2 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Confirm logistics and freight schedule', is_required: true, sort_order: 3 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Finalize exhibitor services catalog', is_required: true, sort_order: 4 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Secure sponsor agreements', is_required: false, sort_order: 5 },
        // Execution
        { template_id: inserted.id, stage: 'execution', item_name: 'Complete booth build-out and signage', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Test power and WiFi at all booths', is_required: true, sort_order: 2 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Distribute exhibitor welcome packs', is_required: false, sort_order: 3 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Conduct safety walkthrough', is_required: true, sort_order: 4 },
        // Closure
        { template_id: inserted.id, stage: 'closure', item_name: 'Coordinate booth dismantling schedule', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'closure', item_name: 'Collect exhibitor feedback forms', is_required: true, sort_order: 2 },
        { template_id: inserted.id, stage: 'closure', item_name: 'Reconcile exhibitor service charges', is_required: true, sort_order: 3 },
        { template_id: inserted.id, stage: 'closure', item_name: 'Compile lead generation statistics', is_required: false, sort_order: 4 },
      )
    } else if (tpl.event_type === 'Corporate') {
      items.push(
        // Planning
        { template_id: inserted.id, stage: 'planning', item_name: 'Confirm event objectives with client', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Book venue and negotiate terms', is_required: true, sort_order: 2 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Plan entertainment and activities', is_required: false, sort_order: 3 },
        { template_id: inserted.id, stage: 'planning', item_name: 'Confirm catering menu and headcount', is_required: true, sort_order: 4 },
        // Execution
        { template_id: inserted.id, stage: 'execution', item_name: 'Set up event branding and decor', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Coordinate guest arrival and reception', is_required: true, sort_order: 2 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Manage AV and presentation equipment', is_required: true, sort_order: 3 },
        { template_id: inserted.id, stage: 'execution', item_name: 'Photograph key moments', is_required: false, sort_order: 4 },
        // Closure
        { template_id: inserted.id, stage: 'closure', item_name: 'Send thank-you communications', is_required: true, sort_order: 1 },
        { template_id: inserted.id, stage: 'closure', item_name: 'Close out vendor payments', is_required: true, sort_order: 2 },
        { template_id: inserted.id, stage: 'closure', item_name: 'Deliver post-event summary to client', is_required: true, sort_order: 3 },
      )
    }

    for (const item of items) {
      await db.insert(extSchema.checklist_template_items).values(item)
    }
  }

  // ─── Sponsors ─────────────────────────────────────────────

  console.log('  Seeding sample sponsors...')

  const sponsorsData = [
    {
      name: 'Saudi Telecom Company (stc)',
      contact_name: 'Mohammed Al-Harbi',
      email: 'sponsorships@stc.com.sa',
      phone: '+966 11 218 0000',
      website: 'https://www.stc.com.sa',
      industry: 'Telecommunications',
      notes: 'Platinum-level sponsor for major conferences',
      is_active: true,
    },
    {
      name: 'SABIC',
      contact_name: 'Fatimah Al-Otaibi',
      email: 'events@sabic.com',
      phone: '+966 11 225 8000',
      website: 'https://www.sabic.com',
      industry: 'Petrochemicals',
      notes: 'Interested in sustainability-themed events',
      is_active: true,
    },
    {
      name: 'Elm Company',
      contact_name: 'Abdullah Al-Shehri',
      email: 'partnerships@elm.sa',
      phone: '+966 11 461 4000',
      website: 'https://www.elm.sa',
      industry: 'Digital Solutions',
      notes: 'Government-sector digital transformation sponsor',
      is_active: true,
    },
  ]

  for (const sponsor of sponsorsData) {
    await db.insert(extSchema.sponsors).values(sponsor)
  }

  // ─── Exhibitor Services Catalog ───────────────────────────
  // Note: exhibitor_services requires an event_id. We seed a generic
  // catalog linked to event_id = 1 (first event). If no event exists
  // yet, this section will be skipped gracefully.

  console.log('  Seeding exhibitor services catalog (event_id=1)...')

  const EVENT_ID = 1

  const services = [
    { event_id: EVENT_ID, name: 'Standard Power Outlet (220V)', description: 'Single 220V / 13A power outlet per booth', category: 'power', unit_price: 75000, unit: 'unit', sort_order: 1 },
    { event_id: EVENT_ID, name: 'Heavy-Duty Power Outlet (380V)', description: '380V three-phase outlet for industrial equipment', category: 'power', unit_price: 150000, unit: 'unit', sort_order: 2 },
    { event_id: EVENT_ID, name: 'Basic WiFi Package', description: 'Shared WiFi access — up to 10 Mbps per booth', category: 'wifi', unit_price: 50000, unit: 'per_day', sort_order: 3 },
    { event_id: EVENT_ID, name: 'Premium WiFi Package', description: 'Dedicated SSID with 50 Mbps guaranteed bandwidth', category: 'wifi', unit_price: 150000, unit: 'per_day', sort_order: 4 },
    { event_id: EVENT_ID, name: 'Table & 2 Chairs Set', description: 'Standard meeting table (120cm) with two padded chairs', category: 'furniture', unit_price: 35000, unit: 'per_day', sort_order: 5 },
    { event_id: EVENT_ID, name: 'Display Cabinet', description: 'Glass display cabinet (180cm tall, lockable)', category: 'furniture', unit_price: 60000, unit: 'per_day', sort_order: 6 },
    { event_id: EVENT_ID, name: 'Fascia Signage Print', description: 'Printed fascia board with exhibitor name and logo (up to 3m)', category: 'signage', unit_price: 45000, unit: 'unit', sort_order: 7 },
    { event_id: EVENT_ID, name: 'Roll-Up Banner Print (85x200cm)', description: 'Full-color roll-up banner with retractable stand', category: 'signage', unit_price: 25000, unit: 'unit', sort_order: 8 },
    { event_id: EVENT_ID, name: 'Booth Catering — Coffee & Dates', description: 'Arabic coffee and dates service for booth visitors (per day)', category: 'catering', unit_price: 80000, unit: 'per_day', sort_order: 9 },
    { event_id: EVENT_ID, name: 'Booth Catering — Full Hospitality', description: 'Water, juice, coffee, tea, and assorted snacks (per day)', category: 'catering', unit_price: 150000, unit: 'per_day', sort_order: 10 },
  ]

  try {
    for (const svc of services) {
      await db.insert(extSchema.exhibitor_services).values(svc)
    }
  } catch (err: any) {
    if (err?.code === '23503') {
      console.log('    Skipped: event_id=1 does not exist yet. Run db:seed first.')
    } else {
      throw err
    }
  }

  console.log('\nExtensions seed complete!')
  await pool.end()
}

seed().catch((err) => {
  console.error('Extensions seed failed:', err)
  process.exit(1)
})
