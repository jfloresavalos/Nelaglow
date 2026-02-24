'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Upload, Download, FileSpreadsheet,
  CheckCircle2, AlertTriangle, Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { importProductsFromExcel } from '@/actions/import'
import type { ImportResult } from '@/actions/import'

interface CategoryRef {
  id: string
  name: string
  _count: { products: number }
}

const COLUMNS = [
  { name: 'nombre*', desc: 'Nombre del producto (requerido)' },
  { name: 'color', desc: 'Color de la variante. Filas con mismo nombre y distintos colores = variantes' },
  { name: 'categoria', desc: 'Nombre de la categoría. Si no existe, se crea automáticamente.' },
  { name: 'precio_venta*', desc: 'Precio de venta (requerido)' },
  { name: 'precio_costo', desc: 'Precio de costo para calcular margen' },
  { name: 'stock', desc: 'Cantidad en inventario' },
  { name: 'stock_minimo', desc: 'Alerta de stock bajo (por defecto: 5)' },
  { name: 'descripcion', desc: 'Descripción opcional' },
]

export function ImportTab({ categories = [] }: { categories?: CategoryRef[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      try {
        const res = await importProductsFromExcel(formData)
        setResult(res)
        if (res.errors.length === 0) {
          toast.success(`Importación exitosa: ${res.created} creados, ${res.updated} actualizados`)
        } else {
          toast.warning(`Importación con ${res.errors.length} advertencia(s)`)
        }
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al importar')
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Descarga de plantilla */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Plantilla de importación
          </CardTitle>
          <CardDescription>
            Descarga el archivo de ejemplo con el formato correcto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" size="sm" asChild>
            <a href="/api/excel-template" download>
              <Download className="h-4 w-4 mr-2" />
              Descargar plantilla .xlsx
            </a>
          </Button>

          {/* Referencia de columnas */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Columnas del archivo
            </p>
            <div className="rounded-xl border border-white/10 divide-y divide-white/10 overflow-hidden">
              {COLUMNS.map((col) => (
                <div key={col.name} className="flex items-start gap-3 px-3 py-2 bg-white/5">
                  <code className="text-xs font-mono text-primary shrink-0 w-32">{col.name}</code>
                  <p className="text-xs text-muted-foreground">{col.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Regla de variantes */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-1">
            <p className="font-semibold text-primary">Regla de variantes de color:</p>
            <p className="text-muted-foreground">
              Escribe el <strong>mismo nombre</strong> en varias filas con distinto <strong>color</strong> → se crean como variantes del mismo producto padre.
            </p>
            <p className="text-muted-foreground">
              Deja <strong>color</strong> vacío → producto independiente sin variantes.
            </p>
          </div>

          {/* Categorías existentes */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Categorías existentes — copia el nombre exacto
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Badge
                    key={cat.id}
                    variant="secondary"
                    className="cursor-pointer select-all font-mono text-xs"
                    title={`${cat._count.products} producto(s)`}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Si escribes un nombre diferente (aunque sea parecido), se creará una categoría nueva.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zona de carga */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-base">Subir archivo</CardTitle>
          <CardDescription>
            Acepta .xlsx y .xls. Si el producto ya existe se actualiza. Si la categoría no existe se crea automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/25 rounded-xl p-10 cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
            onClick={() => !isPending && fileInputRef.current?.click()}
          >
            {isPending ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <p className="text-sm text-muted-foreground text-center">
              {isPending
                ? 'Procesando importación...'
                : 'Haz clic aquí o arrastra tu archivo .xlsx'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              disabled={isPending}
            />
            <Button variant="outline" size="sm" disabled={isPending} onClick={(e) => e.stopPropagation()}>
              {isPending ? 'Importando...' : 'Seleccionar archivo'}
            </Button>
          </div>

          {/* Resultado */}
          {result && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">
                    <span className="text-emerald-500">{result.created}</span> productos creados
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">
                    <span className="text-blue-400">{result.updated}</span> actualizados
                  </span>
                </div>
                {result.errors.length > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    {result.errors.length} advertencia{result.errors.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <p key={i} className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠ {e}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
