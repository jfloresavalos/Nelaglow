# Plan: Módulo Finanzas + Importación Masiva de Productos por Excel

**Fecha**: 2026-02-18
**Estado**: Aprobado, listo para implementar

---

## ¿Qué se va a construir?

### 1. Módulo de Finanzas (`/finances`)
Una nueva sección en el menú que muestra el flujo de dinero del negocio:
- **Ingresos**: Pagos recibidos de pedidos (YAPE, Transferencia, Efectivo)
- **Egresos**: Dinero invertido en comprar mercadería (Ingreso de stock con costo)
- **Ganancia Neta**: Ingresos − Egresos
- **Pendiente de cobro**: Lo que los clientes aún deben
- **Inventario Valorizado**: Cuánto vale el stock actual (stock × costo)

Incluye gráfico de líneas Ingresos vs Egresos por día, y filtros por período (Esta semana / Este mes / Este año).

### 2. Importación Masiva de Productos desde Excel (`Configuración > Importar`)
Una pestaña en Configuración (solo admin) para cargar productos en masa desde un archivo `.xlsx`:
- Descarga una **plantilla de ejemplo** con el formato correcto
- Sube el archivo Excel → el sistema crea/actualiza productos automáticamente
- **Soporte de variantes de color**: filas con el mismo nombre pero distintos colores se agrupan como padre + variantes
- Muestra resumen: cuántos creados, cuántos actualizados, advertencias

### 3. Mejora adicional: Columna Margen % en productos
En la tabla de productos (desktop), nueva columna que muestra el margen de ganancia de cada producto en porcentaje (verde > 30%, amarillo 10–30%, rojo < 10%).

---

## Formato del archivo Excel para importar

El archivo debe tener estas columnas (en ese orden o con esos nombres exactos):

| nombre | color | categoria | precio_venta | precio_costo | stock | stock_minimo | descripcion |
|--------|-------|-----------|-------------|-------------|-------|-------------|-------------|
| Termo 500ml | Rojo | Termos | 25.00 | 15.00 | 10 | 3 | |
| Termo 500ml | Azul | Termos | 25.00 | 15.00 | 8 | 3 | |
| Termo 500ml | Verde | Termos | 25.00 | 15.00 | 5 | 3 | |
| Morral Escolar | | Morrales | 45.00 | 28.00 | 20 | 5 | Con mangas |

**Reglas clave:**
- Mismo `nombre` + distintos `color` = se crean como variantes del mismo producto
- `color` vacío = producto independiente (sin variantes)
- Si el producto ya existe = se actualizan precio, costo y stock (no se duplica)
- Si la categoría no existe en el sistema = se importa sin categoría y avisa

---

## Archivos a crear

```
src/actions/finances.ts                          ← Consultas financieras (ingresos, egresos, gráfico)
src/actions/import.ts                            ← Lógica de importación desde Excel
src/app/(dashboard)/finances/page.tsx            ← Página del módulo Finanzas
src/app/(dashboard)/finances/loading.tsx         ← Skeleton de carga
src/app/api/excel-template/route.ts             ← Descarga la plantilla .xlsx
src/components/finances/finance-stats-cards.tsx  ← 5 tarjetas de resumen
src/components/finances/finance-chart.tsx        ← Gráfico ingresos vs egresos
src/components/finances/finance-chart-inner.tsx  ← Recharts (ssr: false)
src/components/finances/transactions-table.tsx   ← Tabla de movimientos financieros
src/components/finances/period-selector.tsx      ← Botones Semana/Mes/Año
src/components/settings/import-tab.tsx          ← UI de importación en Configuración
```

## Archivos a modificar

```
package.json                                     ← Mover 'xlsx' de devDependencies a dependencies
src/types/index.ts                               ← Nuevos tipos: FinancePeriod, FinanceStats, etc.
src/components/layout/sidebar.tsx                ← Agregar "Finanzas" al menú
src/components/layout/mobile-nav.tsx             ← Agregar "Finanzas" al nav móvil
src/app/(dashboard)/settings/page.tsx            ← Nueva pestaña "Importar" (solo admin)
src/components/products/products-table.tsx       ← Columna Margen % (desktop)
```

---

## Orden de implementación

1. `package.json` — mover `xlsx` a dependencies (crítico para producción)
2. `src/types/index.ts` — tipos financieros
3. `src/actions/finances.ts` — acciones de datos
4. Componentes de Finanzas (period-selector → stats-cards → chart → transactions-table)
5. Página `/finances` y `loading.tsx`
6. Sidebar y mobile-nav — agregar Finanzas
7. `src/app/api/excel-template/route.ts` — plantilla descargable
8. `src/actions/import.ts` — lógica de importación
9. `src/components/settings/import-tab.tsx` — UI de carga
10. `src/app/(dashboard)/settings/page.tsx` — nueva pestaña
11. Columna Margen % en tabla de productos

---

## Cómo verificar al terminar

- **Finanzas**: Ir a `/finances` → ver 5 tarjetas → cambiar período → los datos cambian.
  Crear un pedido con pago → aparece como INGRESO. Cargar stock con costo → aparece como EGRESO.
- **Importar**: Configuración > Importar → descargar plantilla → rellenar con mis productos → subir → verificar en `/products` que se crearon correctamente con sus variantes de color.
- **Margen**: En la tabla de productos (desktop) se ve la columna Margen % con colores.
- **TypeScript**: Sin errores al hacer `npx tsc --noEmit`.
