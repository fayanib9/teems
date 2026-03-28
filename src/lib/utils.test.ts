import { describe, it, expect } from 'vitest'
import { formatCurrency, slugify, getInitials, timeAgo, formatDate, cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible')
  })
  it('deduplicates tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatDate', () => {
  it('formats a Date object', () => {
    const d = new Date('2025-03-15T12:00:00Z')
    const result = formatDate(d)
    expect(result).toContain('2025')
    expect(result).toContain('15')
  })
  it('formats a date string', () => {
    const result = formatDate('2025-06-01')
    expect(result).toContain('2025')
  })
  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—')
  })
})

describe('formatCurrency', () => {
  it('converts halalas to SAR', () => {
    const result = formatCurrency(150000)
    expect(result).toContain('1,500')
  })
  it('returns dash for null', () => {
    expect(formatCurrency(null)).toBe('—')
  })
  it('handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

describe('slugify', () => {
  it('converts text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })
  it('removes special characters', () => {
    expect(slugify('Event #1 — Launch!')).toBe('event-1-launch')
  })
  it('handles multiple spaces', () => {
    expect(slugify('a   b')).toBe('a-b')
  })
})

describe('getInitials', () => {
  it('returns uppercase initials', () => {
    expect(getInitials('John', 'Doe')).toBe('JD')
  })
  it('handles lowercase input', () => {
    expect(getInitials('alice', 'smith')).toBe('AS')
  })
})

describe('timeAgo', () => {
  it('returns "just now" for recent times', () => {
    expect(timeAgo(new Date())).toBe('just now')
  })
  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(timeAgo(fiveMinAgo)).toBe('5m ago')
  })
  it('returns hours ago', () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(timeAgo(threeHrsAgo)).toBe('3h ago')
  })
  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(timeAgo(twoDaysAgo)).toBe('2d ago')
  })
})
