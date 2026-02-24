import path from 'path'
import fs from 'fs/promises'
import sharp from 'sharp'

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'

export async function ensureUploadDir(subdir: string) {
  const dir = path.join(process.cwd(), UPLOAD_DIR, subdir)
  await fs.mkdir(dir, { recursive: true })
  return dir
}

export async function saveImage(
  file: File,
  subdir: string,
  options?: { maxWidth?: number; quality?: number }
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  const { maxWidth = 1200, quality = 80 } = options || {}

  const dir = await ensureUploadDir(subdir)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Generate unique filename
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const filename = `${timestamp}-${random}.webp`
  const thumbFilename = `${timestamp}-${random}-thumb.webp`

  // Process main image
  const processedImage = await sharp(buffer)
    .resize(maxWidth, maxWidth, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()

  // Create thumbnail
  const thumbnail = await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .webp({ quality: 70 })
    .toBuffer()

  // Save files
  const imagePath = path.join(dir, filename)
  const thumbPath = path.join(dir, thumbFilename)

  await fs.writeFile(imagePath, processedImage)
  await fs.writeFile(thumbPath, thumbnail)

  return {
    imageUrl: `/api/uploads/${subdir}/${filename}`,
    thumbnailUrl: `/api/uploads/${subdir}/${thumbFilename}`,
  }
}

export async function deleteImage(imageUrl: string) {
  try {
    // URL may be /api/uploads/... or /uploads/... — normalize to filesystem path
    const relativePath = imageUrl
      .replace(/^\/api\/uploads\//, 'uploads/')
      .replace(/^\/uploads\//, 'uploads/')
    const filePath = path.join(process.cwd(), relativePath)
    await fs.unlink(filePath)
  } catch {
    // File might not exist, ignore
  }
}
