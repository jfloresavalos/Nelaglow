# Nela Glow — Guía de Estilo & Paleta de Colores

---

## Paleta Principal

| Color | Hex | Uso |
|-------|-----|-----|
| 🖤 Negro base | `#060606` | Fondo principal |
| 🖤 Negro suave | `#0A0A0A` | Fondo de tarjetas |
| 🖤 Negro card | `#0C0C0C` | Contenedores, cards |
| ◼️ Borde oscuro | `#1A1A1A` | Bordes, separadores |
| ◼️ Superficie | `#111111` | Inputs, botones secundarios |
| ◼️ Borde sutil | `#141414` | Bordes inactivos |

## Acentos Rosa (Signature)

| Color | Hex | Uso |
|-------|-----|-----|
| 💕 Hot Pink | `#FF69B4` | Color principal, CTAs, títulos destacados |
| 💕 Deep Rose | `#D4336E` | Hover, gradientes |
| 💕 Light Pink | `#FFB6C1` | Acentos suaves, gradientes |
| 💕 Blush | `#FFF0F5` | Fondos claros (modo light) |
| 💕 Rose Gold | `#E8A0BF` | Detalles premium, íconos |

## Texto

| Color | Hex | Uso |
|-------|-----|-----|
| ⬜ Texto principal | `#F0F0F0` | Títulos, texto principal |
| 🔘 Texto secundario | `#999999` | Descripciones |
| 🔘 Texto terciario | `#666666` | Labels, subtítulos |
| 🔘 Texto muted | `#555555` | Texto deshabilitado, hints |
| 🔘 Texto sutil | `#444444` | Uppercase labels, separadores de texto |
| 🔘 Texto ghost | `#333333` | Números, metadata mínima |

## Feedback

| Color | Hex | Uso |
|-------|-----|-----|
| ✅ Success | `#22C55E` | Confirmaciones, "copiado" |
| ✅ Success bg | `#22C55E12` | Fondo de confirmación |

---

## Gradientes

### Fondo Header
```css
background: linear-gradient(160deg, #14060C 0%, #250D18 45%, #060606 100%);
```

### Glow radial (overlay en headers)
```css
background: radial-gradient(ellipse at 50% 20%, rgba(255,105,180,0.07) 0%, transparent 60%);
```

### Card activa / seleccionada
```css
background: linear-gradient(135deg, #2A0D1A, #14060C);
```

### Botón principal (hover glow)
```css
background: linear-gradient(135deg, rgba(255,105,180,0.1), rgba(255,105,180,0.04));
border: 1px solid rgba(255,105,180,0.27);
```

### Rosa texto degradado (para script del logo)
```css
background: linear-gradient(135deg, #FFB6C1, #FF69B4);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## Bordes & Estados

### Borde inactivo
```css
border: 1px solid #1A1A1A;
```

### Borde hover
```css
border: 1px solid #FF69B444;
```

### Borde activo / seleccionado
```css
border: 1px solid #FF69B4;
```

### Borde success
```css
border: 1px solid rgba(34,197,94,0.33);
```

---

## Border Radius

| Elemento | Valor |
|----------|-------|
| Cards grandes | `16px` |
| Cards medianas | `14px` |
| Botones / tags | `10px` |
| Badges / pills | `7px - 8px` |
| Tags pequeños | `4px - 5px` |

---

## Tipografía

### Font Family
```css
font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
```

### Escalas de texto

| Elemento | Tamaño | Peso | Extras |
|----------|--------|------|--------|
| H1 hero | `clamp(26px, 5vw, 40px)` | 200 | — |
| H1 keyword | mismo | 700 | color: #FF69B4 |
| H2 sección | `17px` | 600 | — |
| Subtítulo | `13-14px` | 600 | — |
| Body | `12-13px` | 400 | line-height: 1.7-1.85 |
| Label uppercase | `10px` | 600 | letter-spacing: 3-5px |
| Tag / badge | `9px` | 600 | letter-spacing: 0.5-1px |
| Metadata | `10-11px` | 400-500 | — |

---

## Sombras

### Glow rosa (para elementos destacados)
```css
box-shadow: 0 0 20px rgba(255,105,180,0.15);
```

### Elevación card (sutil)
```css
box-shadow: 0 2px 10px rgba(0,0,0,0.3);
```

---

## Componentes Clave

### Card contenedora
```css
background: #0C0C0C;
border: 1px solid #1A1A1A;
border-radius: 16px;
```

### Card seleccionada / activa
```css
background: linear-gradient(135deg, #2A0D1A, #14060C);
border: 1px solid #FF69B4;
border-radius: 14px;
```

### Botón primario (rosa)
```css
padding: 12px 28px;
background: linear-gradient(135deg, rgba(255,105,180,0.1), rgba(255,105,180,0.04));
border: 1px solid rgba(255,105,180,0.27);
border-radius: 10px;
color: #FF69B4;
font-size: 13px;
font-weight: 600;
```

### Botón secundario
```css
padding: 12px 18px;
background: #0E0E0E;
border: 1px solid #1A1A1A;
border-radius: 10px;
color: #555555;
font-size: 11px;
font-weight: 500;
```

### Tab activo
```css
background: rgba(255,105,180,0.1);
border: 1px solid #FF69B4;
color: #FF69B4;
border-radius: 8px;
```

### Tab inactivo
```css
background: #0E0E0E;
border: 1px solid #1A1A1A;
color: #555555;
border-radius: 8px;
```

### Tag / Badge
```css
background: rgba(255,105,180,0.13);
border: 1px solid rgba(255,105,180,0.27);
border-radius: 5px;
padding: 3px 9px;
color: #FF69B4;
font-size: 9px;
font-weight: 600;
letter-spacing: 1px;
text-transform: uppercase;
```

### Bloque de contenido (prompt, código)
```css
background: #070707;
border: 1px solid #111111;
border-radius: 11px;
padding: 20px;
```

---

## CSS Variables (copiar directo)

```css
:root {
  /* Fondos */
  --bg-base: #060606;
  --bg-surface: #0A0A0A;
  --bg-card: #0C0C0C;
  --bg-elevated: #111111;
  --bg-input: #0E0E0E;
  
  /* Bordes */
  --border-default: #1A1A1A;
  --border-subtle: #141414;
  --border-active: #FF69B4;
  --border-hover: rgba(255,105,180,0.27);
  
  /* Rosa signature */
  --pink-primary: #FF69B4;
  --pink-deep: #D4336E;
  --pink-light: #FFB6C1;
  --pink-blush: #FFF0F5;
  --pink-gold: #E8A0BF;
  --pink-glow: rgba(255,105,180,0.07);
  --pink-bg: rgba(255,105,180,0.1);
  --pink-bg-subtle: rgba(255,105,180,0.04);
  
  /* Texto */
  --text-primary: #F0F0F0;
  --text-secondary: #999999;
  --text-tertiary: #666666;
  --text-muted: #555555;
  --text-subtle: #444444;
  --text-ghost: #333333;
  
  /* Feedback */
  --success: #22C55E;
  --success-bg: rgba(34,197,94,0.07);
  
  /* Radios */
  --radius-lg: 16px;
  --radius-md: 14px;
  --radius-sm: 10px;
  --radius-xs: 7px;
  --radius-pill: 5px;
  
  /* Gradientes */
  --gradient-header: linear-gradient(160deg, #14060C 0%, #250D18 45%, #060606 100%);
  --gradient-card-active: linear-gradient(135deg, #2A0D1A, #14060C);
  --gradient-btn-primary: linear-gradient(135deg, rgba(255,105,180,0.1), rgba(255,105,180,0.04));
  --gradient-pink-text: linear-gradient(135deg, #FFB6C1, #FF69B4);
}
```

---

## Tailwind Config (si usas Tailwind)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#060606',
          surface: '#0A0A0A',
          card: '#0C0C0C',
          elevated: '#111111',
        },
        border: {
          default: '#1A1A1A',
          subtle: '#141414',
        },
        pink: {
          primary: '#FF69B4',
          deep: '#D4336E',
          light: '#FFB6C1',
          blush: '#FFF0F5',
          gold: '#E8A0BF',
        },
        text: {
          primary: '#F0F0F0',
          secondary: '#999999',
          tertiary: '#666666',
          muted: '#555555',
        },
      },
    },
  },
}
```

---

*Nela Glow Brand Style Guide — generado para mantener consistencia visual en web, redes y packaging.*
