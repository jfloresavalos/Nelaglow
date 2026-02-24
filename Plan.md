# NelaGlow - Plan de Mejoras y Pendientes

## Estado Actual 🟢
El sistema se encuentra en una fase **"Estable y Optimizada"**.
- Módulos unificados (Productos + Inventario).
- Diseño visual "Luminous Minimal" finalizado.
- Experiencia móvil fluida y completa.
- **Compilación rápida**: Turbopack activo (~3-6s vs ~38s anteriores).
- **Rendimiento optimizado**: Dashboard con carga progresiva via Suspense streaming.

---

## Completado ✅

### ⚡ Performance & Build (Sesión 2026-02-17 — Segunda Parte)
- [x] **Turbopack activado**: `next dev --turbopack` en `package.json`. Compilación en dev: de ~38s a ~3-6s.
- [x] **optimizePackageImports**: `lucide-react`, `recharts`, `date-fns` optimizados en `next.config.ts`. Reduce módulos compilados significativamente (era 3576 módulos).
- [x] **Suspense Streaming en Dashboard**: Cada sección carga de forma independiente con skeleton propio. Header visible al instante.
- [x] **Dashboard simplificado**: Eliminados gráfico de ventas y alertas de stock (eran los componentes más pesados). Ahora solo Stats Cards + Pedidos Recientes.
- [x] **Limit de Imágenes en Productos**: `getProducts` trae solo 1 imagen por producto (`take: 1`). Reducción de ~36–60 filas a 12 por página.
- [x] **getLowStockProducts — 1 sola query**: `$queryRaw` con LATERAL JOIN. Elimina un round-trip a la BD.
- [x] **Índices de BD**: `@@index([isActive])` y `@@index([isActive, stock])` en modelo `Product`. ⚠️ Pendiente: `npm run db:push`.
- [x] **Font display swap**: Outfit con `display: 'swap'` para evitar FOIT.

### 🛠️ Estructural & Funcional (Sesión 2026-02-17 — Primera Parte)
- [x] **Unificación de Módulos**: Eliminación de `/inventory`. Gestión de costos y stock en `/products`.
- [x] **Tabla Avanzada**: Columnas de **Costo** y **Valor** en la vista de productos.
- [x] **Paginación Server-Side**: Implementada en Productos y Pedidos.
- [x] **Wizard de Pedidos**: Reparado crash por selección vacía y aplicado estilo Glass.

### 🎨 UI/UX Luminous (Sesión Anterior)
- [x] **Rediseño Total**: Glassmorphism (`.glass-card`), tipografía **Outfit** y paleta OKLCH.
- [x] **Mobile First**: Listas como Tarjetas, Menú Sheet accesible, Thumb-friendly zones.
- [x] **Feedback Visual**: Skeleton loaders (`loading.tsx`) para transiciones de ruta.

---

## Pendientes (Roadmap Futuro) 🚀

### Prioridad Alta (Próxima Sesión)
- [ ] **`npm run db:push`**: Aplicar los índices de BD (`isActive`, `[isActive, stock]`) al ambiente activo.
- [ ] **Validación Stock Real-Time**: Al crear pedido, verificar stock en el servidor antes de descontar.
- [ ] **Gráfico de Ventas**: Agregar de vuelta cuando sea necesario (usar `next/dynamic` con `ssr: false` para evitar el error `width(-1) height(-1)` de Recharts).
- [ ] **Alertas de Stock Bajo**: Reintegrar al Dashboard cuando se necesite.

### UI/UX Refinements
- [ ] **Imágenes con blurDataURL**: `placeholder="blur"` en `ProductCard` para carga progresiva.
- [ ] **Pull-to-Refresh**: Gesto de arrastrar para recargar en móviles.
- [ ] **Sticky Search**: Barra de búsqueda siempre visible al hacer scroll.

### Gestión Avanzada
- [ ] **Reportes Exportables**: Generar PDF/Excel de pedidos del mes.
- [ ] **Historial Cliente**: Ver "Última compra" en el perfil del cliente.
- [ ] **Permisos**: ADMIN (ver costos) vs OPERATOR (solo ventas).

---

## Bugs Conocidos 🐛
- Ninguno crítico reportado actualmente.
- *Observación*: En pantallas muy pequeñas (iPhone SE), verificar si el Wizard de 5 pasos no se corta.

---

## Guía de Desarrollo Rápido
- **Nueva Sección en Dashboard**: Crear `async function NombreSection()` en `dashboard/page.tsx` y envolver en `<Suspense fallback={<SkeletonComponent />}>`.
- **Agregar Gráfico**: Usar `next/dynamic(() => import(...), { ssr: false })` para evitar errores de Recharts en SSR.
- **Añadir Columna a Tabla**: Modificar `products-table.tsx` e incluir el campo en `getProducts`.
- **Modificar Estilos Globales**: Editar `globals.css` (variables CSS).
- **Aplicar Índices de BD**: Ejecutar `npm run db:push` después de modificar `schema.prisma`.
