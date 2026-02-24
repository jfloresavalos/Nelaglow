# NelaGlow - Sistema de Gestion de Ventas y Envios

## Descripcion
Sistema web para gestionar ventas, pedidos, envios y stock de productos (termos, botellas, tazas, morrales) con enfoque Mobile-First y Diseño "Luminous Minimal".
Permite la gestión unificada de catálogo (Precios, Costos, Stock), registro de clientes, creación de pedidos en 5 pasos, y seguimiento de estados.

## Stack Tecnologico
- **Frontend**: Next.js 15, React 18, Tailwind CSS 4, shadcn/ui.
- **Diseño**: "Luminous Minimal" (Glassmorphism + Gradientes OKLCH + Fuente Outfit).
- **Backend**: Next.js Server Actions, NextAuth v5 (beta).
- **Base de datos**: PostgreSQL + Prisma 7 (con `@prisma/adapter-pg` y soporte `Decimal`).
- **Validacion**: Zod v4 + React Hook Form.
- **Graficos**: Recharts.
- **Tablas**: TanStack Table (Desktop), Grid Cards (Mobile).

## Estructura del Proyecto
```
src/
├── app/
│   ├── (auth)/login/         # Login Seguro
│   ├── (dashboard)/          # Dashboard Layout (Sidebar/Mobile Sheet)
│   │   ├── dashboard/        # KPIs y Gráficos
│   │   ├── products/         # Gestión Unificada (Catálogo + Inventario)
│   │   ├── clients/          # Agenda de Clientes
│   │   ├── orders/           # Wizard de Pedidos y Listado
│   │   └── settings/         # Configuración del Sistema
│   └── api/
│       ├── auth/             # Endpoints NextAuth
│       └── uploads/          # Servir imágenes optimizadas (Sharp)
├── components/
│   ├── ui/                   # Primitivas shadcn/ui (modificadas con .glass)
│   ├── layout/               # Sidebar, Topbar, MobileNav (Navegación)
│   ├── products/             # Tabla de Productos (con Costos) y Tarjetas
│   ├── orders/               # Wizard de 5 Pasos (Client -> Product -> Ship -> Pay -> Confirm)
│   ├── shared/               # Componentes reutilizables entre módulos
│   │   ├── product-picker-dialog.tsx  # Dialog de búsqueda/selección de producto
│   │   └── image-upload.tsx           # Upload de imágenes
│   └── ...
├── actions/                  # Server Actions (Lógica de Negocio)
│   ├── products.ts           # CRUD + Paginación + Ordenamiento
│   ├── orders.ts             # Creación + addItemToOrder + updateOrderStatus + addPayment
│   └── ...
├── lib/
│   ├── prisma.ts             # Cliente Prisma (Singleton Pool)
│   ├── hooks.ts              # Hooks compartidos (useDebounce)
│   ├── serialize.ts          # Utilería para serializar Decimales
│   └── ...
├── prisma/
│   └── schema.prisma         # Definición de Datos
```

## Base de Datos
Modelos principales en `schema.prisma`:
- **Product**: `price`, `costPrice`, `stock`, `images`.
- **Order**: `orderNumber` (NGL-XXXX), `status`, `shippingType`, `items`.
- **Client**: Datos de contacto y `dni`.
- **Payment**: `method`, `amount`, `proofImageUrl`.

## Comandos Utiles
```bash
npm run dev          # Iniciar servidor
npm run build        # Build de producción
npm run db:push      # Sincronizar schema
npm run db:studio    # Explorador de BD
```

## Notas Tecnicas

### 1. Sistema Luminous
El diseño se basa en clases utilitarias en `globals.css`:
- `.glass`: Fondo semitransparente con `backdrop-blur`.
- `.glass-card`: Tarjeta con borde sutil y fondo iluminado.
- `.touch-target`: Zonas táctiles optimizadas (>44px).

### 2. Manejo de Decimales (Prisma)
Prisma 7 devuelve objetos `Decimal` que crashean en Client Components.
**Solución**: Usar `serializeData()` (en `lib/utils.ts`) para convertir a strings/numbers antes de pasar props.

### 3. Accesibilidad Móvil
- El menú móvil (`Sheet`) incluye `<SheetTitle>` oculto (`sr-only`) para cumplir con estándares WCAG/Radix.
- Los inputs evitan el zoom automático en iOS (`font-size: 16px`).

### 4. Patrón de Rendimiento: Suspense Streaming
El Dashboard usa **async Server Components + `<Suspense>`** para streaming progresivo:
- Cada sección es un `async function` que hace su propio fetch de forma independiente.
- La página principal (`DashboardPage`) es **síncrona** — renderiza inmediatamente con skeletons.
- Los fetches corren **en paralelo** (no hay waterfall, cada Suspense boundary es independiente).
- **Patrón a replicar** en nuevas páginas con múltiples secciones de datos.
- Para agregar gráficos (Recharts): usar `next/dynamic(() => import(...), { ssr: false })` para evitar el error `width(-1) height(-1)`.

### 5. Queries de Comparación de Columnas (Prisma)
Prisma no soporta comparar dos columnas en `where` (`stock <= lowStockThreshold`).
**Solución**: Usar `$queryRaw` con SQL directo + LATERAL JOIN para eficiencia:
```sql
SELECT p.id, p.name, p.stock, c.name AS "categoryName", pi."imageUrl"
FROM products p
LEFT JOIN categories c ON c.id = p."categoryId"
LEFT JOIN LATERAL (
  SELECT "imageUrl", "thumbnailUrl" FROM product_images
  WHERE "productId" = p.id ORDER BY "sortOrder" ASC LIMIT 1
) pi ON true
WHERE p."isActive" = true AND p.stock <= p."lowStockThreshold"
```

### 6. Índices de Base de Datos
Tras modificar `schema.prisma`, siempre ejecutar `npm run db:push` para aplicar cambios.
Índices clave en `Product`: `[isActive]`, `[isActive, stock]`, `[categoryId]`, `[name]`, `[parentProductId]`.

### 8. Variantes de Color (Product Variants)
Relación auto-referencial en `Product`: `parentProductId` (null = raíz/independiente), `color` (String?).
- Padre: `parentProductId = null`, tiene `variants[]`. Nunca se vende directamente si tiene variantes.
- Variante: `parentProductId = <id_padre>`, tiene `color`. Es lo que se agrega al pedido.
- `deleteProduct` arroja error si el padre tiene variantes activas.
- `toggleProductActive(false)` en padre cascada a todas sus variantes.
- En el wizard de pedidos: si `product.variants.length > 0`, se abre un Sheet para seleccionar color.

### 9. Kardex / Movimientos de Stock
Modelo `StockMovement` con tipos: `PURCHASE_IN`, `SALE_OUT`, `RETURN_IN`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`.
- `SALE_OUT` se crea automáticamente al crear un pedido (en `createOrder`).
- `RETURN_IN` se crea automáticamente al cancelar un pedido (en `updateOrderStatus`).
- `createBulkStockEntry` en `src/actions/inventory.ts` para ingresos manuales masivos.
- Página en `/inventory` con tabla filtrable + `/inventory/new-entry` para ingresos masivos.

### 10. WizardItemState vs OrderItemInput
El wizard de pedidos usa `WizardItemState` en el cliente (con `productName`, `originalUnitPrice`).
Al enviar al servidor, se mapea a `OrderItemInput` (solo `productId`, `quantity`, `unitPrice`).
El `productId` siempre es el de la **variante** (no el padre) para que el stock decremente correctamente.

### 11. Vincular Productos Existentes como Variantes
Para migrar productos ya creados (ej. "Termo Rojo", "Termo Azul" como productos independientes) a una estructura padre-variante:
- Desde el detalle del producto **padre** (ej. "Termo"), ir a la sección "Variantes de Color".
- Botón **"Vincular existente"** abre un dialog con buscador — busca el producto hijo, asigna el color, confirma.
- `linkProductAsVariant(productId, parentId, color?)` en `src/actions/products.ts`.
- `unlinkProductVariant(productId)` deshace la vinculación (vuelve a ser independiente).
- El buscador solo muestra productos sin padre (`parentProductId = null`) y excluye el producto padre actual.

### 12. useSearchParams en Next.js 15
`useSearchParams()` en componentes cliente puede causar error "CSR bailout" en Next.js 15.
**Solución**: No usar `useSearchParams()`. El Server Component (dentro del `<Suspense>`) extrae los params y los pasa como props primitivas al Client Component. El Client Component usa solo `usePathname()` + `router.push()` para navegar.

### 7. Compilación Dev Rápida
- **Turbopack** activo: `next dev --turbopack` en `package.json`. Reduce compilación de ~38s a ~3-6s.
- **optimizePackageImports** en `next.config.ts`: `lucide-react`, `recharts`, `date-fns`. Reduce el número de módulos compilados.

## Últimos Cambios (Sesión 2026-02-24 — Performance + Agregar Productos a Pedido)
1. **`useDebounce` hook**: Nuevo `src/lib/hooks.ts` con hook compartido. Reemplaza los `useRef<setTimeout>` manuales en `ProductsList`, `OrdersList`, `ClientsList`, `KardexTable`.
2. **Eliminado `useSearchParams()`**: `products-list.tsx`, `orders-list.tsx`, `clients-list.tsx` — params llegan como props primitivas desde el Server Component. Soluciona CSR bailout de Next.js 15.
3. **`getOrders` payload slim**: Usa `select` en lugar de `include` completo. Solo los campos que usa la lista. `OrderForList` actualizado en `types/index.ts`. Cast `as unknown as OrderForList[]` necesario porque `serializeData<T>` preserva el tipo TypeScript.
4. **`useMemo` en `ProductCard`**: Memoiza `effectiveStock`, `isLowStock`, `isOutOfStock`, `hasVariants`. Evita recálculo en re-renders del padre.
5. **LCP priority images**: Primeras 4 `ProductCard` en el grid reciben `priority={true}`. Los páginas de listado pasan `priority={i < 4}`.
6. **`ProductPickerDialog` compartido**: Nuevo `src/components/shared/product-picker-dialog.tsx`. Dialog de 2 pasos: (1) búsqueda + lista con thumbnails, (2) swatches de color + stepper de cantidad + precio + botón Agregar. Props: `onAdd`, `disabled`, `triggerLabel`.
7. **`StepProducts` refactorizado**: Usa `ProductPickerDialog`. Elimina el inline search/results/sheet. Más simple y consistente con el formulario de pedido histórico.
8. **`addItemToOrder` action**: Nueva action en `src/actions/orders.ts`. Valida stock, crea `OrderItem`, decrementa `product.stock`, crea `SALE_OUT`, actualiza `order.totalAmount` y `order.remainingAmount`. Solo disponible en estados PENDING/STOCK_RESERVED/PARTIAL_PAYMENT/PAID.
9. **Botón "Agregar Producto" en `OrderDetail`**: Visible cuando `canAddProducts = !['CANCELLED','DELIVERED','SHIPPED'].includes(status)`. Usa `ProductPickerDialog` + `handleAddProduct`.

## Últimos Cambios (Sesión 2026-02-21 — Finanzas + Importación Excel)
1. **Módulo Finanzas** (`/finances`): Ingresos, Egresos, Ganancia Neta, Pendiente de Cobro, Inventario Valorizado. Gráfico Ingresos vs Egresos por día. Tabla unificada de transacciones. Filtro Semana/Mes/Año con `router.push` (sin `useSearchParams`).
2. **Importación masiva de productos**: Acción `importProductsFromExcel` en `src/actions/import.ts`. Soporta productos simples y con variantes de color (mismo nombre + distintos colores = padre + variantes). Plantilla descargable en `/api/excel-template`.
3. **Tab Importar en Configuración**: Visible solo para admins. Incluye referencia de columnas, regla de variantes, zona de carga y resultados.
4. **Columna Margen %** en tabla de productos desktop: Verde ≥30%, Amber 10-29%, Rojo <10%.
5. **`xlsx` a dependencies**: Movido de `devDependencies` para que funcione en producción.

## Últimos Cambios (Sesión 2026-02-22 — Mobile Optimization + Fixes)
1. **Mobile filter bar**: `ProductsList` reestructurado — search en fila propia, luego category select + toggle side-by-side en segunda fila (no se amontona en mobile).
2. **Table overflow**: `ProductsTable` envuelta en `overflow-x-auto` para scroll horizontal en mobile.
3. **Stats cards grid**: Dashboard stats `md:grid-cols-2` → `grid-cols-2` (2 columnas también en mobile).
4. **Settings tabs**: `TabsList` envuelta en `overflow-x-auto` para manejar 4+ tabs sin overflow.
5. **Page headers**: Todos los headers de página ahora tienen `flex-wrap gap-4 shrink-0` para no romperse en pantallas pequeñas (products, orders, clients, inventory, products/[id]).
6. **Recent orders**: `min-w-0 truncate flex-1` en nombre de cliente para evitar overflow. Badge y monto con `shrink-0`.
7. **Imágenes**: `object-contain` en product cards, table y detalle (antes `object-cover` cortaba las imágenes).
8. **Upload fix**: URLs de imágenes cambiadas a `/api/uploads/...`. `deleteImage` normaliza ambos prefijos. Rewrite en `next.config.ts` para compatibilidad.
9. **Decimal serialization**: `createProduct` y `updateProduct` ahora llaman `serializeData()` antes de retornar — evita crash en Client Components.
10. **parentOnly + includeVariants**: `getProducts({ parentOnly: true, includeVariants: true })` — muestra 1 card por familia de producto.
11. **effectiveStock**: En cards/tabla/detalle, si el producto tiene variantes el stock efectivo = suma de stocks de variantes.
12. **DeleteProductButton**: Componente reutilizable con AlertDialog de confirmación y `redirectTo` prop.
13. **Módulo Finanzas** (`/finances`): Stats + Chart + Transactions con period selector (week/month/year). Mobile cards en TransactionsTable. Acciones en `src/actions/finances.ts`.
14. **Importación masiva** (Settings > Importar): Upload de .xlsx con agrupación automática de variantes por nombre+color. Plantilla descargable desde `/api/excel-template`.

## Últimos Cambios (Sesión 2026-02-22 — Revisión Completa + Fixes Mobile)
1. **sellableOnly**: Nuevo param en `getProducts({ sellableOnly: true })` — filtra solo variantes + standalone. Excluye padres con variantes (stock=0). Usado en `bulk-stock-entry-form.tsx`. Prisma filter: `OR: [{ parentProductId: { not: null } }, { parentProductId: null, variants: { none: {} } }]`.
2. **order-detail.tsx mobile**: Action buttons → `flex flex-wrap gap-2`. TabsList → envuelto en `<div className="overflow-x-auto">` para scroll horizontal en mobile.
3. **window.location.reload() eliminado**: En `product-variants-panel.tsx`, los 3 usos reemplazados con `router.refresh()` de `next/navigation`. Patrón correcto en Next.js 15.
4. **Fix seguridad crítico**: `/finances` no estaba en `auth.config.ts` — añadido a `isOnDashboard`. Ahora todas las rutas privadas están protegidas por el middleware.
5. **aria-label en botones ícono**: 19 botones `size="icon"` sin `aria-label` corregidos en toda la app — sidebar, mobile-nav, productos, clientes, pedidos (new/detail), inventario (new-entry), configuración (categorías/usuarios), wizard (step-products), product-variants-panel. WCAG 2.1 cumplido.
6. **step-payment min="0"**: Input de monto pagado tiene `min="0"` para prevenir valores negativos.
7. **clients/[id] mobile header**: Header usa `flex-col sm:flex-row`, título con `truncate`, botón con `shrink-0`. Sin overflow en móvil.
8. **Revisión completa confirmada**: Auth ✅, Dashboard ✅, Productos ✅, Clientes ✅, Pedidos ✅, Inventario ✅, Finanzas ✅, Configuración ✅. Todos los flujos y páginas revisados.

## Últimos Cambios (Sesión 2026-02-18 — Vincular Variantes + Fix Kardex)
1. **Vincular productos existentes**: Nueva UI en `ProductVariantsPanel` con dialog "Vincular existente" — busca productos independientes y los migra como variantes de un padre. Botón "Desvincular" por variante.
2. **Nuevas actions en `products.ts`**: `searchProductsForLink`, `linkProductAsVariant`, `unlinkProductVariant`.
3. **Fix Kardex**: Eliminado `useSearchParams()` de `KardexTable`. Params pasan como props desde el server component. Soluciona el "CSR bailout" de Next.js 15 al buscar.

## Últimos Cambios (Sesión 2026-02-18 — Tres Módulos Nuevos)
1. **Variantes de Color**: Campo `color` + `parentProductId` en `Product` (auto-referencial). Panel en detalle de producto, swatches en tarjetas, selector de color en wizard de pedidos.
2. **Kardex / Inventario**: Nuevo modelo `StockMovement` + enum `StockMovementType`. Módulo en `/inventory` con tabla filtrable e ingreso masivo. Movimientos automáticos al crear/cancelar pedidos.
3. **Pedidos UX**: `StepClient` con búsqueda lazy + `NewClientDialog` inline. `StepProducts` con búsqueda lazy + selector de color + override de precio por ítem. Eliminada carga anticipada de todos los clientes/productos en `orders/new/page.tsx`.
4. **Docs/Notas**: Secciones 8, 9, 10 agregadas a CLAUDE.md con patrones clave.

## Últimos Cambios (Sesión 2026-02-17 — Tercera Parte: Build Optimization)
1.  **Turbopack**: `next dev --turbopack` activo. Compilación dev de ~38s → ~3-6s.
2.  **optimizePackageImports**: `lucide-react`, `recharts`, `date-fns` en `next.config.ts`.
3.  **Dashboard simplificado**: Eliminados gráfico de ventas (Recharts) y alertas de stock. Solo Stats Cards + Pedidos Recientes. Elimina el error `width(-1) height(-1)`.

## Últimos Cambios (Sesión 2026-02-17 — Segunda Parte: Performance)
1.  **Suspense Streaming**: Dashboard refactorizado con async components + `<Suspense>` por sección.
2.  **Sin Waterfall**: Secciones cargan en paralelo; skeletons visibles al instante.
3.  **Imágenes limitadas**: `getProducts` solo trae 1 imagen por producto (`take: 1`).
4.  **Query unificada**: `getLowStockProducts` usa 1 sola query SQL con LATERAL JOIN.
5.  **Índices BD**: Agregados `isActive` e `[isActive, stock]` al modelo `Product`. Requiere `npm run db:push`.
6.  **Font swap**: Outfit con `display: 'swap'` para evitar FOIT.

## Últimos Cambios (Sesión 2026-02-17 — Primera Parte)
1.  **Simplificación**: Eliminado módulo `Inventory`. Toda la gestión de stock y costos pasa a `Products`.
2.  **Productividad**: Agregada columna **Costo** a la tabla de productos.
3.  **Diseño**: Rediseño completo "Luminous" (Glassmorphism) en todas las vistas.
4.  **Estabilidad**: Corregido crash en Wizard (`Select` vacío) y error de Build (`Outfit` font).
5.  **Móvil**: Listas optimizadas (Cards vs Tablas) y Navegación reparada.
