import { ConditionNode } from './types'

/**
 * Evaluate a JSON condition tree against a data object.
 * Supports AND/OR nesting and all comparison operators.
 */
export function evaluateCondition(condition: ConditionNode, data: Record<string, unknown>): boolean {
  // Handle AND
  if (condition.type === 'and') {
    return condition.conditions.every(c => evaluateCondition(c, data))
  }
  // Handle OR
  if (condition.type === 'or') {
    return condition.conditions.some(c => evaluateCondition(c, data))
  }
  // Handle comparison
  if (condition.type === 'comparison') {
    const fieldValue = getField(data, condition.field)
    return compare(fieldValue, condition.operator, condition.value)
  }
  return false
}

function getField(data: Record<string, unknown>, field: string): unknown {
  // Support dot notation for nested fields
  const parts = field.split('.')
  let value: unknown = data
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return undefined
    value = (value as Record<string, unknown>)[part]
  }
  return value
}

/**
 * Try to convert a value to a number if it looks numeric.
 */
function toNumeric(val: unknown): number | null {
  if (typeof val === 'number') return val
  if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return Number(val)
  return null
}

function compare(fieldValue: unknown, operator: string, ruleValue: unknown): boolean {
  // For numeric comparisons, coerce number-like strings to numbers
  const numField = toNumeric(fieldValue)
  const numRule = toNumeric(ruleValue)
  const bothNumeric = numField !== null && numRule !== null

  switch (operator) {
    case 'eq':
      if (fieldValue === ruleValue) return true
      // Try numeric comparison if strict equality fails
      if (bothNumeric) return numField === numRule
      return false
    case 'neq':
      if (fieldValue === ruleValue) return false
      // Try numeric comparison if strict inequality passes
      if (bothNumeric) return numField !== numRule
      return true
    case 'gt': return bothNumeric && numField! > numRule!
    case 'gte': return bothNumeric && numField! >= numRule!
    case 'lt': return bothNumeric && numField! < numRule!
    case 'lte': return bothNumeric && numField! <= numRule!
    case 'in': return Array.isArray(ruleValue) && ruleValue.includes(fieldValue)
    case 'not_in': return Array.isArray(ruleValue) && !ruleValue.includes(fieldValue)
    case 'contains': return Array.isArray(fieldValue) && fieldValue.includes(ruleValue)
    case 'not_contains': return Array.isArray(fieldValue) && !fieldValue.includes(ruleValue)
    default: return false
  }
}
