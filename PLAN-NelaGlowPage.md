# Plan: NelaGlowPage — Catálogo Público de Productos

## Contexto
NelaGlow Admin (`puerto 3001`) es el panel interno de gestión. Se necesita un proyecto web separado y público donde los clientes puedan ver el catálogo de productos con fotos por color, stock en tiempo real y botón de consulta por WhatsApp. Comparte la misma BD `nelaglow_db` en modo solo lectura.

---

## Arquitectura

| Proyecto | Repo | URL | Puerto | Función |
|----------|------|-----|--------|---------|
| NelaGlow (Admin) | `jfloresavalos/Nelaglow` | `https://admin.nelaglow.com` | 3001 | Panel interno |
| NelaGlowPage | `jfloresavalos/NelaGlowPage` | `https://nelaglow.com` | 3002 | Catálogo público |

**BD compartida**: `nelaglow_db` — NelaGlowPage solo hace SELECT, nunca INSERT/UPDATE/DELETE.

**Imágenes**: servidas desde `https://admin.nelaglow.com/api/uploads/...` (Opción A — proxy directo al admin). `remotePatterns` en `next.config.ts` incluye `admin.nelaglow.com`.

---

## Diseño — "Dark Rose" (ver `nelaglow-style-guide.md`)

Diseño completamente distinto al admin. Oscuro y elegante con rosa signature.

### Paleta
| Variable | Valor | Uso |
|----------|-------|-----|
| `--bg-base` | `#060606` | Fondo principal |
| `--bg-card` | `#0C0C0C` | Cards, contenedores |
| `--pink-primary` | `#FF69B4` | CTAs, títulos, acentos |
| `--pink-deep` | `#D4336E` | Hover, gradientes |
| `--pink-light` | `#FFB6C1` | Gradiente texto logo |
| `--text-primary` | `#F0F0F0` | Títulos, texto principal |
| `--text-secondary` | `#999999` | Descripciones |
| `--border-default` | `#1A1A1A` | Bordes inactivos |
| `--border-active` | `#FF69B4` | Bordes seleccionados |

### Tipografía
- **Font**: `'Segoe UI', system-ui, -apple-system, sans-serif`
- **H1 hero**: `clamp(26px, 5vw, 40px)` weight 200, keyword en `#FF69B4` weight 700
- **Body**: `12-13px` / `line-height: 1.7-1.85`
- **Labels uppercase**: `10px` / `letter-spacing: 3-5px`

### Gradientes clave
```css
/* Fondo Header */
background: linear-gradient(160deg, #14060C 0%, #250D18 45%, #060606 100%);

/* Glow radial (overlay) */
background: radial-gradient(ellipse at 50% 20%, rgba(255,105,180,0.07) 0%, transparent 60%);

/* Logo texto degradado */
background: linear-gradient(135deg, #FFB6C1, #FF69B4);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

### Componentes visuales
- **Card**: `bg #0C0C0C` / `border #1A1A1A` / `border-radius 16px`
- **Card activa**: `gradient #2A0D1A→#14060C` / `border #FF69B4`
- **Botón primario**: fondo `rgba(255,105,180,0.1)` / `border rgba(255,105,180,0.27)` / texto `#FF69B4`
- **Badge/Tag**: `bg rgba(255,105,180,0.13)` / `border rgba(255,105,180,0.27)` / `9px uppercase`
- **Glow rosa**: `box-shadow: 0 0 20px rgba(255,105,180,0.15)`

---

## Stack

- Next.js 15, React 18, Tailwind CSS 4 (con variables CSS custom del style guide)
- Prisma 7 + `@prisma/adapter-pg` (mismo schema, misma BD)
- Turbopack en dev
- **Sin**: NextAuth, shadcn/ui sidebar, módulos admin, xlsx, recharts

---

## Estructura del Proyecto

```
C:\Devs\NelaGlowPage\
├── src/
│   ├── app/
│   │   ├── layout.tsx               # Layout público (Header + Footer)
│   │   ├── globals.css              # Variables CSS Dark Rose + Tailwind
│   │   ├── page.tsx                 # Home: hero + categorías + destacados
│   │   ├── productos/
│   │   │   ├── page.tsx             # Catálogo: grid filtrable + búsqueda
│   │   │   └── [id]/
│   │   │       └── page.tsx         # Detalle: selector color + WhatsApp
│   ├── actions/
│   │   └── products.ts              # getProducts, getProduct, getCategories (read-only)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── header.tsx           # Logo degradado + nav categorías
│   │   │   └── footer.tsx           # Contacto + WhatsApp + redes
│   │   └── products/
│   │       ├── catalog-card.tsx     # Card oscura con hover glow rosa
│   │       ├── catalog-grid.tsx     # Grid con filtros + skeleton
│   │       ├── category-filter.tsx  # Chips/tabs estilo Dark Rose
│   │       └── product-detail.tsx   # Selector color + imagen + stock + WhatsApp
│   ├── lib/
│   │   ├── prisma.ts                # Idéntico al admin
│   │   └── utils.ts                 # cn, formatCurrency, serializeData
│   └── generated/prisma/
├── prisma/
│   └── schema.prisma                # Mismo schema que el admin
├── .env
├── .env.production.example
├── next.config.ts
├── package.json
├── tsconfig.json
├── postcss.config.mjs
├── ecosystem.config.js              # PM2 puerto 3002
└── deploy.sh
```

---

## Páginas

### `/` — Home
- **Hero oscuro**: fondo `gradient-header` + glow radial rosa
  - Título: `"Descubre nuestros"` (peso 200) + `"productos"` (rosa, peso 700)
  - Subtítulo en `#999999`
  - Botón primario: `"Ver catálogo"`
- **Categorías**: chips estilo `tab-inactivo/activo` (Termos, Botellas, Tazas, etc.)
- **Productos destacados**: grid 2-4 cols, primeras 8 cards activas

### `/productos` — Catálogo
- Barra de búsqueda oscura con borde `#1A1A1A` → hover `rgba(255,105,180,0.27)`
- Filtro por categoría (chips Dark Rose)
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`
- Skeleton en cards mientras carga
- Sin paginación visible — scroll natural

### `/productos/[id]` — Detalle de Producto
- Imagen grande (fondo `#0A0A0A`, `object-contain`)
- Selector de color: botones con `ColorSwatch` + borde activo `#FF69B4`
- Stock por variante seleccionada con badge de estado
- Precio en `#FF69B4`
- Botón **"Consultar por WhatsApp"** (verde WhatsApp + ícono):
  ```
  https://wa.me/{WHATSAPP_NUMBER}?text=Hola! Me interesa {nombre} color {color}. ¿Tienen disponible?
  ```

---

## Variables de Entorno

```env
# .env local
DATABASE_URL="postgresql://postgres:oafe$01@localhost:5432/nelaglow?schema=public"
WHATSAPP_NUMBER="51XXXXXXXXX"
NODE_ENV="development"
NEXT_PUBLIC_ADMIN_URL="https://admin.nelaglow.com"

# .env producción (VPS)
DATABASE_URL="postgresql://nelaglow_user:NelaGlow2025@localhost:5432/nelaglow_db?schema=public"
WHATSAPP_NUMBER="51XXXXXXXXX"
NODE_ENV="production"
NEXT_PUBLIC_ADMIN_URL="https://admin.nelaglow.com"
```

---

## `next.config.ts` — Imágenes

```ts
images: {
  remotePatterns: [
    { protocol: 'http', hostname: 'localhost' },
    { protocol: 'https', hostname: 'admin.nelaglow.com' },  // imágenes del admin
    { protocol: 'http', hostname: '212.85.12.168' },
  ],
},
```

---

## `ecosystem.config.js` para PM2

```javascript
module.exports = {
  apps: [{
    name: 'nelaglow-page',
    script: 'node_modules/.bin/next',
    args: 'start -p 3002',
    cwd: '/var/www/nelaglow-page',
    env_production: { NODE_ENV: 'production', PORT: 3002 },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
  }]
}
```

---

## Archivos a copiar del Admin (sin modificación)

| Archivo | Destino |
|---------|---------|
| `prisma/schema.prisma` | `prisma/schema.prisma` |
| `src/lib/prisma.ts` | `src/lib/prisma.ts` |
| `src/lib/utils.ts` | `src/lib/utils.ts` |
| `postcss.config.mjs` | `postcss.config.mjs` |
| `tsconfig.json` | `tsconfig.json` |

> `globals.css` NO se copia — el catálogo tiene su propio tema Dark Rose.

---

## Patrones Técnicos Clave (heredados del Admin)

1. **Serialización Prisma**: `serializeData()` en todos los retornos de Server Actions
2. **Solo productos activos**: `isActive: true` + `parentOnly: true` + `includeVariants: true`
3. **Imagen por variante**: primera variante con imagen → fallback al padre
4. **Stock efectivo**: suma de stocks de variantes si tiene variantes, sino `product.stock`
5. **useSearchParams prohibido**: params como props desde Server Component
6. **Suspense Streaming**: async Server Components + `<Suspense>` con skeletons
7. **Turbopack**: `next dev --turbopack`

---

## Secuencia de Implementación

### Fase 1 — Setup ✅ pendiente
1. `npx create-next-app@latest NelaGlowPage` en `C:\Devs\`
2. Copiar archivos base del admin (schema, prisma.ts, utils.ts, postcss, tsconfig)
3. Crear `globals.css` con tema Dark Rose (variables del style guide)
4. Instalar dependencias (Prisma, pg, lucide-react, clsx, tailwind-merge)
5. Configurar `.env` apuntando a BD local `nelaglow`
6. `npx prisma generate` → verificar conexión

### Fase 2 — Estructura base ✅ pendiente
7. Layout público con Header (logo degradado) + Footer
8. Server Actions read-only (`actions/products.ts`)
9. Componente `CatalogCard` con estilo Dark Rose

### Fase 3 — Páginas ✅ pendiente
10. Home (`/`) — hero + categorías + destacados
11. Catálogo (`/productos`) — búsqueda + filtros + grid
12. Detalle (`/productos/[id]`) — selector color + WhatsApp

### Fase 4 — Deploy ✅ pendiente
13. Git push a `jfloresavalos/NelaGlowPage`
14. Clonar en VPS: `/var/www/nelaglow-page`
15. Configurar `.env` VPS con `WHATSAPP_NUMBER`
16. `./deploy.sh` → PM2 en puerto 3002 → live en `https://nelaglow.com`

---

## Estado actual
- [ ] Fase 1 — Setup del proyecto
- [ ] Fase 2 — Estructura base
- [ ] Fase 3 — Páginas
- [ ] Fase 4 — Deploy VPS

---

**Creado:** 2026-02-27
**Actualizado:** 2026-02-28
**Repo**: https://github.com/jfloresavalos/NelaGlowPage.git
**VPS**: `https://nelaglow.com` → puerto 3002 → `/var/www/nelaglow-page`
**Style Guide**: `nelaglow-style-guide.md` en el repo admin
