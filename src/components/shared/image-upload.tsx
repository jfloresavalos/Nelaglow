'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { X, Upload, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ImageData {
  id?: string
  imageUrl: string
  thumbnailUrl?: string
}

interface ImageUploadProps {
  value: ImageData[]
  onChange: (images: ImageData[]) => void
  onDelete?: (imageId: string) => void
  maxImages?: number
  uploadType?: 'products' | 'payments' | 'vouchers'
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onDelete,
  maxImages = 5,
  uploadType = 'products',
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      if (value.length + files.length > maxImages) {
        toast.error(`Maximo ${maxImages} imagenes permitidas`)
        return
      }

      setIsUploading(true)

      try {
        const newImages: ImageData[] = []

        for (const file of Array.from(files)) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', uploadType)

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Error al subir imagen')
          }

          const data = await response.json()
          newImages.push({
            imageUrl: data.imageUrl,
            thumbnailUrl: data.thumbnailUrl,
          })
        }

        onChange([...value, ...newImages])
        toast.success('Imagenes subidas correctamente')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Error al subir imagenes')
      } finally {
        setIsUploading(false)
      }
    },
    [value, onChange, maxImages, uploadType]
  )

  const handleRemove = useCallback(
    (index: number) => {
      const image = value[index]
      if (image.id && onDelete) {
        onDelete(image.id)
      }
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange, onDelete]
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {value.map((image, index) => (
          <div
            key={image.id || image.imageUrl}
            className="group relative aspect-square overflow-hidden rounded-lg border bg-gray-100"
          >
            <Image
              src={image.thumbnailUrl || image.imageUrl}
              alt={`Imagen ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {index === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-2 py-0.5 text-xs text-white">
                Principal
              </span>
            )}
          </div>
        ))}

        {value.length < maxImages && !disabled && (
          <label
            className={cn(
              'flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary',
              isUploading && 'pointer-events-none opacity-50'
            )}
          >
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8" />
                <span className="text-xs">Subir imagen</span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={isUploading || disabled}
            />
          </label>
        )}
      </div>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Arrastra o selecciona imagenes (max {maxImages})
        </p>
      )}
    </div>
  )
}
