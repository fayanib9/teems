/**
 * Sanitize user input to prevent stored XSS.
 * Strips HTML tags and dangerous patterns from string fields.
 */

const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g
const SCRIPT_REGEX = /javascript\s*:/gi
const EVENT_HANDLER_REGEX = /\bon\w+\s*=/gi
const DATA_URI_REGEX = /data\s*:\s*[^,]*;base64/gi

/** Strip HTML tags from a string */
export function stripTags(input: string): string {
  return input
    .replace(HTML_TAG_REGEX, '')
    .replace(SCRIPT_REGEX, '')
    .replace(EVENT_HANDLER_REGEX, '')
    .replace(DATA_URI_REGEX, '')
}

/** Sanitize a value — handles strings, null, undefined */
export function sanitize(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value
  return stripTags(value)
}

/**
 * Sanitize all string values in an object (shallow).
 * Use on API request bodies before inserting into database.
 */
export function sanitizeBody<T extends Record<string, unknown>>(body: T): T {
  const result = { ...body }
  for (const key in result) {
    const val = result[key]
    if (typeof val === 'string') {
      (result as Record<string, unknown>)[key] = stripTags(val)
    }
  }
  return result
}
