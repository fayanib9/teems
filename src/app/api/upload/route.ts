import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads')
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'text/plain',
  'text/csv',
  'application/zip',
]

// File magic bytes for server-side type validation
const MAGIC_BYTES: [string, number[]][] = [
  ['application/pdf', [0x25, 0x50, 0x44, 0x46]], // %PDF
  ['image/jpeg', [0xFF, 0xD8, 0xFF]],
  ['image/png', [0x89, 0x50, 0x4E, 0x47]],
  ['image/webp', [0x52, 0x49, 0x46, 0x46]], // RIFF
  ['application/zip', [0x50, 0x4B, 0x03, 0x04]], // PK (also docx, xlsx, pptx)
]

function detectFileType(buffer: Buffer): string | null {
  for (const [type, bytes] of MAGIC_BYTES) {
    if (bytes.every((b, i) => buffer[i] === b)) return type
  }
  return null
}

// Allowed extensions
const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'jpg', 'jpeg', 'png', 'webp', 'svg',
  'txt', 'csv', 'zip',
])

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'documents'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })

    // Check MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Check extension
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'File extension not allowed' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Server-side magic bytes validation (skip for text/csv/svg which don't have reliable magic bytes)
    if (!['txt', 'csv', 'svg'].includes(ext)) {
      const detected = detectFileType(buffer)
      if (!detected) {
        return NextResponse.json({ error: 'Unable to verify file type' }, { status: 400 })
      }
    }

    const uniqueName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const dir = join(UPLOAD_DIR, category)

    await mkdir(dir, { recursive: true })

    const filePath = join(dir, uniqueName)
    await writeFile(filePath, buffer)

    return NextResponse.json({
      file_path: `data/uploads/${category}/${uniqueName}`,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
