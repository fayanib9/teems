import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatCurrency, slugify, getInitials, timeAgo } from '@/lib/utils'

describe('formatCurrency', () => {
  it('converts halalas to SAR', () => {
    const result = formatCurrency(15000)
    // 15000 halalas = 150 SAR
    expect(result).toContain('150')
    expect(result).toContain('SAR')
  })

  it('handles zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })

  it('returns dash for null', () => {
    expect(formatCurrency(null)).toBe('—')
  })

  it('handles fractional SAR amounts', () => {
    const result = formatCurrency(1050)
    // 1050 halalas = 10.50 SAR
    expect(result).toContain('10')
  })
})

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('replaces multiple spaces with single dash', () => {
    expect(slugify('hello   world')).toBe('hello-world')
  })

  it('trims leading and trailing dashes', () => {
    expect(slugify(' hello world ')).toBe('hello-world')
  })

  it('handles underscores', () => {
    expect(slugify('hello_world')).toBe('hello-world')
  })
})

describe('getInitials', () => {
  it('returns uppercase initials from first and last name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD')
  })

  it('handles lowercase names', () => {
    expect(getInitials('john', 'doe')).toBe('JD')
  })

  it('works with single-character names', () => {
    expect(getInitials('A', 'B')).toBe('AB')
  })
})

describe('timeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-28T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for recent times', () => {
    const now = new Date('2026-03-28T11:59:30Z') // 30 seconds ago
    expect(timeAgo(now)).toBe('just now')
  })

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date('2026-03-28T11:55:00Z')
    expect(timeAgo(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours ago', () => {
    const threeHoursAgo = new Date('2026-03-28T09:00:00Z')
    expect(timeAgo(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago', () => {
    const twoDaysAgo = new Date('2026-03-26T12:00:00Z')
    expect(timeAgo(twoDaysAgo)).toBe('2d ago')
  })

  it('returns formatted date for older than 7 days', () => {
    const twoWeeksAgo = new Date('2026-03-14T12:00:00Z')
    const result = timeAgo(twoWeeksAgo)
    // Should fall back to formatDate, not "Xd ago"
    expect(result).not.toContain('d ago')
    expect(result).toContain('Mar')
  })

  it('accepts string dates', () => {
    expect(timeAgo('2026-03-28T11:59:30Z')).toBe('just now')
  })
})
