import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { readFile, stat } from 'fs/promises'
import { join } from 'path'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path } = await params
  const filePath = join(process.cwd(), 'data', 'uploads', ...path)

  // Prevent directory traversal
  if (!filePath.startsWith(join(process.cwd(), 'data', 'uploads'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const buffer = await readFile(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() || ''
    const contentType = MIME_MAP[ext] || 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileStat.size),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  csv: 'text/csv',
  zip: 'application/zip',
}
