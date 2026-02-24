import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params
    const filePath = path.join(process.cwd(), 'uploads', ...pathSegments)

    // Security: prevent directory traversal
    const normalizedPath = path.normalize(filePath)
    const uploadsDir = path.join(process.cwd(), 'uploads')
    if (!normalizedPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const fileBuffer = await fs.readFile(normalizedPath)
    const ext = path.extname(normalizedPath).toLowerCase()

    const contentType: Record<string, string> = {
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
