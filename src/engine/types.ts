// ---- QA Form Data (Plan Generator input) ----
export type PlanFormData = {
  project_name: string
  client_name: string
  client_id?: number
  event_id?: number
  event_type: string
  event_date: string // ISO date
  duration_days: number
  attendees: number
  audience_type: 'vip' | 'public' | 'internal' | 'mixed'
  venue_type: 'indoor' | 'outdoor' | 'hybrid'
  zones_count: number
  services: string[]
  budget_range: 'under_500k' | '500k_2m' | '2m_10m' | 'over_10m'
  days_remaining: number
  urgency: 'normal' | 'fast_track' | 'critical'
  has_vip: boolean
  has_government: boolean
  has_international_speakers: boolean
  has_custom_builds: boolean
  notes: string
}

// ---- Rule Condition DSL ----
export type ConditionNode =
  | { type: 'comparison'; field: string; operator: ComparisonOperator; value: unknown }
  | { type: 'and'; conditions: ConditionNode[] }
  | { type: 'or'; conditions: ConditionNode[] }

export type ComparisonOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'not_contains'

// ---- Plan Rule Actions ----
export type PlanAction =
  | { type: 'select_template'; template_name: string }
  | { type: 'add_task'; phase: string; task: { name: string; duration_days: number; role?: string; description?: string } }
  | { type: 'modify_duration'; target: string; multiplier: number }
  | { type: 'add_risk'; severity: 'low' | 'medium' | 'high' | 'critical'; title: string; description: string }
  | { type: 'add_recommendation'; title: string; description: string }
  | { type: 'set_complexity_weight'; factor: string; weight: number; value: number }

// ---- Execution Result ----
export type ExecutionResult = {
  templateName: string | null
  injectedTasks: Array<{ phase: string; task: { name: string; duration_days: number; role?: string; description?: string } }>
  durationMultipliers: Array<{ target: string; multiplier: number }>
  risks: Array<{ severity: string; title: string; description: string }>
  recommendations: Array<{ title: string; description: string }>
  complexityWeights: Array<{ factor: string; weight: number; value: number }>
  flags: string[]
}

// ---- Generated Plan ----
export type GeneratedPlan = {
  phases: GeneratedPhase[]
  tasks: GeneratedTask[]
  risks: Array<{ severity: string; title: string; description: string }>
  recommendations: Array<{ title: string; description: string }>
  complexity_score: number
  total_duration_days: number
  earliest_start: string
  event_date: string
}

export type GeneratedPhase = {
  name: string
  color: string
  icon: string
  order: number
  task_count: number
  total_duration: number
}

export type GeneratedTask = {
  phase_name: string
  phase_color: string
  phase_order: number
  task_name: string
  description: string
  duration_days: number
  start_date: string
  end_date: string
  role: string
  dependencies: string[]
  is_critical_path: boolean
  is_optional: boolean
  sort_order: number
  source: 'template' | 'rule_injection' | 'manual'
}

// ---- Budget Types ----
export type BudgetFormData = {
  name: string
  event_id?: number
  event_type: string
  attendees: number
  duration_days: number
  venue_type: 'indoor' | 'outdoor' | 'hybrid'
  services: string[]
  has_vip: boolean
  has_government: boolean
  has_international_speakers: boolean
  notes: string
}

export type BudgetBreakdownItem = {
  category: string
  label: string
  estimated_cost: number // halalas
  percentage: number
  notes: string
}

export type BudgetResult = {
  total_estimated: number
  breakdown: BudgetBreakdownItem[]
  benchmarks: { label: string; value: string }[]
  currency: string
}

// ---- Vendor Matcher Types ----
export type VendorMatchCriteria = {
  event_id?: number
  services_needed: string[]
  budget_range: string
  event_type: string
  attendees: number
  event_date: string
}

export type VendorMatchResult = {
  vendor_id: number
  vendor_name: string
  category: string
  score: number
  score_breakdown: { criterion: string; score: number; weight: number }[]
  rating: number
  past_events: number
  contact_email: string
  phone: string
}

// ---- Risk Assessor Types ----
export type RiskFormData = {
  name: string
  event_id?: number
  event_type: string
  event_date: string
  attendees: number
  budget_range: string
  venue_type: 'indoor' | 'outdoor' | 'hybrid'
  services: string[]
  has_vip: boolean
  has_government: boolean
  has_international_speakers: boolean
  has_custom_builds: boolean
  days_remaining: number
}

export type RiskItem = {
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  mitigation: string
  score: number
}

export type RiskAssessmentResult = {
  overall_level: 'low' | 'medium' | 'high' | 'critical'
  score: number
  risks: RiskItem[]
  mitigations: { category: string; actions: string[] }[]
  summary: string
}
