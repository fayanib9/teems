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

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const category = (formData.get('category') as string) || 'documents'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })

    const ext = file.name.split('.').pop() || ''
    const uniqueName = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const dir = join(UPLOAD_DIR, category)

    await mkdir(dir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
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
