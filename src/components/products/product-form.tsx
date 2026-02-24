'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/shared/image-upload'
import { productSchema, type ProductFormValues } from '@/lib/validations/product'
import { createProduct, updateProduct, createProductVariant } from '@/actions/products'
import type { ProductWithImages } from '@/types'
import type { Category } from '@/generated/prisma'

interface ProductFormProps {
  product?: ProductWithImages
  categories: Category[]
  parentId?: string        // when set, creates a color variant
  onSuccess?: () => void   // override redirect (used in dialogs/panels)
}

interface ImageData {
  id?: string
  imageUrl: string
  thumbnailUrl?: string
}

export function ProductForm({ product, categories, parentId, onSuccess }: ProductFormProps) {
  const router = useRouter()
  const isVariantMode = !!parentId
  // Padre con variantes: el stock se gestiona en cada variante, no en el padre
  const isParentWithVariants = !!product && !(product as any).parentProductId && !!(product as any).variants?.length
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<ImageData[]>(
    product?.images.map((img) => ({
      id: img.id,
      imageUrl: img.imageUrl,
      thumbnailUrl: img.thumbnailUrl || undefined,
    })) || []
  )
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: product?.name || '',
      description: product?.description || '',
      color: product?.color || '',
      price: product?.price ? Number(product.price) : 0,
      costPrice: product?.costPrice ? Number(product.costPrice) : undefined,
      stock: product?.stock || 0,
      lowStockThreshold: product?.lowStockThreshold || 5,
      categoryId: product?.categoryId || undefined,
      isActive: product?.isActive ?? true,
    },
  })

  const isActive = watch('isActive')
  const categoryId = watch('categoryId')
  const colorValue = watch('color')

  const handleImageDelete = (imageId: string) => {
    setDeletedImageIds((prev) => [...prev, imageId])
  }

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true)

    try {
      const newImages = images.filter((img) => !img.id)

      if (product) {
        await updateProduct(
          product.id,
          data,
          newImages.length > 0 ? newImages : undefined,
          deletedImageIds.length > 0 ? deletedImageIds : undefined
        )
        toast.success('Producto actualizado correctamente')
      } else if (isVariantMode) {
        await createProductVariant(parentId!, data, newImages)
        toast.success('Variante creada correctamente')
      } else {
        await createProduct(data, newImages)
        toast.success('Producto creado correctamente')
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/products')
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {isVariantMode ? 'Nueva Variante de Color' : 'Informacion del Producto'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Nombre del producto"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">
                Color
                {isVariantMode && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id="color"
                {...register('color')}
                placeholder="Ej: Rojo, Azul, Negro..."
                value={colorValue || ''}
              />
              {errors.color && (
                <p className="text-sm text-red-500">{errors.color.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <Select
                value={categoryId || ''}
                onValueChange={(value) => setValue('categoryId', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descripcion del producto"
              rows={3}
            />
          </div>

          <div className={`grid gap-4 ${isParentWithVariants ? 'md:grid-cols-2' : 'md:grid-cols-4'}`}>
            <div className="space-y-2">
              <Label htmlFor="price">Precio de Venta *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...register('price')}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">Precio de Costo</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                {...register('costPrice')}
                placeholder="0.00"
              />
            </div>

            {!isParentWithVariants && (
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  {...register('stock')}
                  placeholder="0"
                />
                {errors.stock && (
                  <p className="text-sm text-red-500">{errors.stock.message}</p>
                )}
              </div>
            )}

            {!isParentWithVariants && (
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Alerta Stock Bajo</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  {...register('lowStockThreshold')}
                  placeholder="5"
                />
              </div>
            )}
          </div>

          {isParentWithVariants && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              El stock y la alerta de stock se gestionan individualmente en cada variante de color.
            </p>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Producto activo</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Imagenes del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={images}
            onChange={setImages}
            onDelete={handleImageDelete}
            maxImages={5}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? 'Actualizar' : 'Crear'} Producto
        </Button>
      </div>
    </form>
  )
}
