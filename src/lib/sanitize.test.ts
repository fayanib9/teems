import { describe, it, expect } from 'vitest'
import { stripTags, sanitize, sanitizeBody } from './sanitize'

describe('stripTags', () => {
  it('removes simple HTML tags', () => {
    expect(stripTags('<b>bold</b>')).toBe('bold')
  })

  it('removes nested HTML tags', () => {
    expect(stripTags('<div><p>hello</p></div>')).toBe('hello')
  })

  it('removes script tags', () => {
    expect(stripTags('<script>alert("xss")</script>')).toBe('alert("xss")')
  })

  it('removes self-closing tags', () => {
    expect(stripTags('line<br/>break')).toBe('linebreak')
  })

  it('returns plain text unchanged', () => {
    expect(stripTags('no tags here')).toBe('no tags here')
  })

  it('removes javascript: URIs', () => {
    expect(stripTags('javascript:alert(1)')).toBe('alert(1)')
  })

  it('removes javascript: URIs case-insensitively', () => {
    expect(stripTags('JavaScript:alert(1)')).toBe('alert(1)')
  })

  it('removes event handlers', () => {
    expect(stripTags('onclick=doSomething()')).toBe('doSomething()')
  })

  it('removes onmouseover handlers', () => {
    expect(stripTags('onmouseover=steal()')).toBe('steal()')
  })

  it('removes data URIs with base64', () => {
    expect(stripTags('data:text/html;base64,abc')).toBe(',abc')
  })
})

describe('sanitize', () => {
  it('strips tags from strings', () => {
    expect(sanitize('<b>text</b>')).toBe('text')
  })

  it('returns null for null', () => {
    expect(sanitize(null)).toBeNull()
  })

  it('returns undefined for undefined', () => {
    expect(sanitize(undefined)).toBeUndefined()
  })

  it('removes javascript: URIs from strings', () => {
    expect(sanitize('javascript:void(0)')).toBe('void(0)')
  })

  it('removes event handlers from strings', () => {
    expect(sanitize('onerror=hack()')).toBe('hack()')
  })

  it('removes data URIs from strings', () => {
    expect(sanitize('data:image/png;base64,abc')).toBe(',abc')
  })
})

describe('sanitizeBody', () => {
  it('sanitizes string values in an object', () => {
    const result = sanitizeBody({ name: '<b>Test</b>', count: 5 })
    expect(result.name).toBe('Test')
    expect(result.count).toBe(5)
  })

  it('preserves non-string values', () => {
    const result = sanitizeBody({ num: 42, flag: true, empty: null })
    expect(result.num).toBe(42)
    expect(result.flag).toBe(true)
    expect(result.empty).toBeNull()
  })

  it('handles empty object', () => {
    const result = sanitizeBody({})
    expect(result).toEqual({})
  })

  it('sanitizes multiple string fields', () => {
    const result = sanitizeBody({
      title: '<script>x</script>',
      desc: 'onclick=hack()',
      url: 'javascript:alert(1)',
    })
    expect(result.title).toBe('x')
    expect(result.desc).toBe('hack()')
    expect(result.url).toBe('alert(1)')
  })

  it('does not mutate the original object', () => {
    const original = { name: '<b>Test</b>' }
    sanitizeBody(original)
    expect(original.name).toBe('<b>Test</b>')
  })

  it('leaves arrays as-is (shallow sanitization)', () => {
    const result = sanitizeBody({ items: ['<b>a</b>', '<i>b</i>'] as unknown })
    // sanitizeBody only processes top-level strings, arrays are not strings
    expect(result.items).toEqual(['<b>a</b>', '<i>b</i>'])
  })
})
