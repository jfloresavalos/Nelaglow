import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { saveImage } from '@/lib/upload'
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'products'

    if (!file) {
      return NextResponse.json({ error: 'No se encontro archivo' }, { status: 400 })
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamano maximo de 5MB' },
        { status: 400 }
      )
    }

    const subdir = ['products', 'payments', 'vouchers'].includes(type) ? type : 'products'
    const result = await saveImage(file, subdir)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
