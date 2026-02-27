# Arquitectura NelaGlow v2.0 (Luminous)

## 1. Visión General
NelaGlow es una plataforma **PWA** (Progressive Web App) optimizada para gestión comercial ágil desde dispositivos móviles y escritorio. La arquitectura prioriza la **simplicidad** (menos módulos, más funcionalidad) y la **velocidad** de interacción.

---

## 2. Stack Tecnológico

### Frontend
- **Core**: Next.js 15 (App Router).
- **UI System**: Shadcn/UI + Tailwind 4.
- **Visual Language**: "Luminous" (Glassmorphism, Gradientes, Tipografía Outfit).
- **Mobile Engine**: Grid Layouts adaptativos (CSS Grid vs Flex tables).

### Backend
- **Server Actions**: Lógica de negocio ejecutada en servidor (sin API REST intermedia).
- **Database**: PostgreSQL vía Prisma 7 ORM.
- **Auth**: NextAuth v5 (Gestión de sesiones segura).

---

## 3. Modelo de Datos Simplificado

### Product (Central)
Entidad maestra que maneja catálogo e inventario. Soporta variantes de color mediante auto-relación.
- `id`: PK
- `price`: Precio Venta (Decimal)
- `costPrice`: Precio Costo (Decimal)
- `stock`: Cantidad física (Int)
- `lowStockThreshold`: Alerta (Int)
- `color`: Color de la variante (String?, ej. "Rojo")
- `parentProductId`: FK a sí mismo. `null` = producto raíz/independiente.
- `variants[]`: Hijos (variantes de color). `parent`: Padre (si es variante).

**Reglas de variantes**:
- Padre (`parentProductId = null`) agrupa variantes del mismo producto en distintos colores.
- Variante (`parentProductId != null`) es la unidad vendible; el stock se gestiona por variante.
- Para migrar productos existentes: usar `linkProductAsVariant(productId, parentId, color)`.

### StockMovement (Kardex)
Rastrea todos los movimientos de inventario.
- `type`: `PURCHASE_IN` | `SALE_OUT` | `RETURN_IN` | `ADJUSTMENT_IN` | `ADJUSTMENT_OUT`
- `SALE_OUT`: creado automáticamente al crear un pedido.
- `RETURN_IN`: creado automáticamente al cancelar un pedido.
- Módulo en `/inventory` con tabla filtrable y formulario de ingreso masivo (`/inventory/new-entry`).

### Order (Transaccional)
- `orderNumber`: Identificador humano (e.g., NGL-1045).
- Relación `items` con `Product` (Snapshotea precio al momento de venta). Siempre apunta a la variante, no al padre.
- Máquina de estados: `PENDING` -> `PAID` -> `SHIPPED`.

---

## 4. Patrones de Diseño Clave

### A. Data Fetching Híbrido
- **Listados**: Carga Server-Side con Paginación (`searchParams`).
- **Interacciones**: Client Components (`useTransition`) invocan Server Actions.
- **Feedback**: Skeleton UI mientras se cargan datos del servidor.

### B. "Luminous" Design System
- **Capas**: Fondo animado -> Capa Glass (Blanco/50%) -> Contenido.
- **Glass Card**: Componente estándar para contenedores (`.glass-card`). Crea profundidad visual sin sombras pesadas.
- **Touch Targets**: Botones y acciones diseñados para pulgares (>44px).

### C. Navegación
- **Desktop**: Sidebar lateral fijo (Glass).
- **Mobile**:
    - **Top Bar**: Marca y Menú Hambuguesa (`Sheet`).
    - **Bottom Bar**: Accesos directos a módulos principales (Thumb zone).

---

## 5. Módulos del Sistema

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/dashboard` | KPIs diarios/semanales/mensuales + pedidos recientes |
| Productos | `/products` | Catálogo con variantes de color, precios, costos, stock |
| Detalle Producto | `/products/[id]` | Imágenes, info general, inventario, panel de variantes |
| Clientes | `/clients` | Agenda con búsqueda, CRUD, contador de pedidos |
| Pedidos | `/orders` | Listado filtrable + wizard de creación en 5 pasos |
| Inventario | `/inventory` | Kardex de movimientos de stock (tabla + cards mobile) |
| Finanzas | `/finances` | Ingresos vs egresos, ganancia neta, inventario valorizado, gráfico temporal |
| Configuración | `/settings` | Perfil, usuarios (admin), categorías, importación masiva Excel |

### Reglas Mobile-First
- **Tablas → Cards**: Todos los listados tienen vista Card para mobile (`md:hidden`) y Table para desktop (`hidden md:block`).
- **Overflow**: Tablas con datos anchos envueltas en `overflow-x-auto`.
- **Grid adaptativo**: Stats cards en `grid-cols-2` (mobile) y `lg:grid-cols-4` (desktop).
- **Headers**: `flex-wrap gap-4 shrink-0` en todos los headers de página para evitar overflow en pantallas angostas.
- **Tabs**: `overflow-x-auto` para listas de tabs que pueden exceder el ancho en mobile.
- **Bottom bar**: 4 ítems (Inicio, Productos, Pedidos, Finanzas). Sheet para acceder a todos.

## 6. Flujo Crítico: Creación de Pedido
1.  **Selección Cliente** (`StepClient`): Búsqueda lazy (debounce 350ms). Crear cliente inline sin salir del wizard (`NewClientDialog` → `ClientForm`).
2.  **Selección Productos** (`StepProducts`): Usa `ProductPickerDialog` (componente compartido). Dialog de 2 pasos: búsqueda+lista → color+cantidad+precio → Agregar. Precio editable por ítem (descuentos). Duplicados se acumulan.
3.  **Envío**: Determinación de reglas (Provincia exige pago 100%).
4.  **Confirmación**: Commit en BD (Atomic Transaction). Crea `StockMovement SALE_OUT` por ítem.

### Agregar productos a un pedido existente
- Action: `addItemToOrder(orderId, { productId, quantity, unitPrice })` en `src/actions/orders.ts`.
- Disponible en estados: `PENDING`, `STOCK_RESERVED`, `PARTIAL_PAYMENT`, `PAID`.
- Botón **"Agregar Producto"** en `OrderDetail` usa el mismo `ProductPickerDialog`.
- En transacción: verifica stock → crea `OrderItem` → decrementa `product.stock` → crea `SALE_OUT` → actualiza `order.totalAmount` y `order.remainingAmount`.

## 7. Flujo: Gestión de Variantes de Color
1. Crear producto padre (ej. "Termo 500ml") en `/products/new`.
2. En la página de detalle del padre, sección "Variantes de Color":
   - **"Nueva variante"**: crea un producto nuevo vinculado al padre.
   - **"Vincular existente"**: busca productos ya creados y los migra como variantes (asignando `parentProductId` y `color`).
3. Cada variante aparece como card con acciones Editar / Desvincular.
4. En el wizard de pedidos, al buscar "Termo" aparece el padre con swatches de color → clic → Sheet → seleccionar color → agrega la variante al carrito.

---

## 8. Módulo Finanzas

**Fuentes de datos**:
- **Ingresos**: Tabla `Payment.amount` agrupado por período.
- **Egresos**: `StockMovement` tipo `PURCHASE_IN` → `quantity * unitCost`.
- **Pendiente**: `Order.remainingAmount > 0` (excluye cancelados).
- **Inventario valorizado**: `$queryRaw` con `SUM(stock * costPrice)`.

**Componentes**:
- `PeriodSelector`: client, usa `router.push` (sin `useSearchParams`).
- `FinanceStatsCards`: 5 tarjetas (Ingresos, Egresos, Ganancia, Pendiente, Inventario).
- `FinanceChart`: `next/dynamic` con `ssr: false` para Recharts.
- `TransactionsTable`: tabla desktop + cards mobile.

## 9. Módulo Importación Masiva Excel

**Formato esperado**: columnas `nombre | color | categoria | precio_venta | precio_costo | stock | stock_minimo | descripcion`

**Reglas de agrupación**:
- Mismo `nombre` + distintos `color` → padre + variante por fila.
- Mismo `nombre` + sin `color` → producto independiente.
- Categoría buscada por nombre (case-insensitive); si no existe, se importa sin categoría y se registra warning.

**Archivos**:
- `src/actions/import.ts` → `importProductsFromExcel(formData)`
- `src/components/settings/import-tab.tsx` → UI de upload + resultados
- `src/app/api/excel-template/route.ts` → GET genera y sirve plantilla .xlsx

## 10. Despliegue

### Infraestructura
- **VPS**: Ubuntu — `212.85.12.168`
- **Proceso**: PM2 (`ecosystem.config.js`) — puerto **3001**
- **BD**: PostgreSQL local — base `nelaglow_db`
- **Repo**: `https://github.com/jfloresavalos/Nelaglow.git`

### Archivos de deploy
- `ecosystem.config.js` — configuración PM2
- `deploy.sh` — script automatizado (primera vez: `./deploy.sh --setup`, actualizaciones: `./deploy.sh`)
- `.env.production.example` — plantilla de variables de entorno

### Variables de entorno requeridas (`.env`)
```
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/nelaglow_db?schema=public"
AUTH_SECRET="32-chars-random"   # openssl rand -base64 32
AUTH_URL="http://212.85.12.168:3001"
UPLOAD_DIR="uploads"
NODE_ENV="production"
```

### Flujo de actualización
```bash
ssh root@212.85.12.168
cd /var/www/nelaglow
git pull
./deploy.sh
```
