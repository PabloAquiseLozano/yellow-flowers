# MASTER — Flor de Ánimo

Sistema de diseño canónico. Todo color, tipografía, espaciado, sombra y timing de animación en el código sale de aquí — sin valores mágicos.

Validado: 2026-09-22. Tesis visual e interacción aprobadas por el usuario vía preview en Artifact. Actualizado 2026-09-22 tras la segunda ronda de feedback: se quitó el paso de ánimo y el de deseo del formulario (ver README.md para el detalle de esa iteración).

## Tesis

**Visual:** Jardín soleado y juguetón: base miel-amarilla que vira a índigo-y-oro de noche; superficies de vidrio color crema (glassmorphism) con blur dorado suave; serif Playfair Display para momentos emocionales junto a Inter para UI; espaciado generoso y aireado; componentes en píldora, sin bordes duros — todo redondeado, cálido, con leve resplandor dorado en lo interactivo.

**Interacción:** Día = rebote energético (`back.out(1.7)`), 250–450ms, stagger rápido (~0.05s). Noche = vaivén lento tipo seno (`sine.inOut`), 900–1400ms, sin rebote, stagger lento (~0.18s). Hover = lift + glow (scale 1.03–1.05). Transición formulario→jardín = fade + scale-down, 600ms `power2.out`. Prohibido: easing lineal, cortes duros, más de un loop de fondo continuo corriendo a la vez, rebote más allá de `back.out(1.7)`.

## Colores

Dos modos, elegidos directamente por el usuario haciendo clic en el sol o la luna (`js/sky.js`) — no por un campo de ánimo ni por el sistema operativo. El mismo estado día/noche controla también los tokens de movimiento de arriba.

| Rol | Día (hex) | Noche (hex) | Variable CSS |
|---|---|---|---|
| Fondo 1 (base gradiente) | `#FFF8E7` | `#1B1730` | `--bg-1` |
| Fondo 2 (top gradiente) | `#FFE8A3` | `#2E2350` | `--bg-2` |
| Superficie vidrio | `rgba(255,255,255,0.55)` | `rgba(30,25,60,0.45)` | `--surface` |
| Borde vidrio | `rgba(224,159,0,0.35)` | `rgba(242,193,78,0.3)` | `--border` |
| Tinta (texto) | `#3A2E12` (12.6:1 sobre bg-1) | `#F5EFE0` (15.1:1 sobre bg-1 noche) | `--ink` |
| Tinta suave | `#6B5B35` | `#C9BFE0` | `--ink-soft` |
| Acento / flor principal | `#F5B700` | `#F5B700` | `--accent` |
| Acento profundo (decorativo, NO usar en texto — 2.2:1) | `#E09F00` | `#F2C14E` (10.3:1, sí sirve como texto en noche) | `--accent-deep` |

**Secundario (elegido por el usuario vía color picker):** se usa tal cual en degradados de partículas/mariposas. Además decide qué *flor secundaria* aparece en el jardín, por bucket de matiz (HSL hue del hex elegido):

| Hue (°) | Familia | Flor secundaria | Hex de referencia |
|---|---|---|---|
| 345–15 | Rojo | Rosas rojas | `#C81E3A` |
| 15–45 | Naranja | Caléndulas naranjas | `#F2793B` |
| 45–70 | Amarillo (se funde con la principal, no se duplica) | — | — |
| 70–170 | Verde | Hojas / tréboles | `#4C9A5B` |
| 170–255 | Azul | Nomeolvides azules | `#4A7FD6` |
| 255–300 | Morado | Lavandas | `#8C5FD6` |
| 300–345 | Rosa/Magenta | Tulipanes rosas | `#E85D75` |
| Saturación < 15% (grises/blancos) | Neutro | Margaritas blancas | `#F4F1E8` |

Regla anti-patrón evitada: no usar rojo/dorado/rosa genérico de "regalo navideño" ni tipografía infantil — se descartó explícitamente esa sugerencia del dataset de referencia por no calzar con la tesis.

## Tipografía

- **Display** (títulos emocionales, mensajes, tarjeta de mensaje por flor): `Playfair Display`, italic 600 para momentos de máxima emoción, 500/600 upright para headings normales.
- **UI / cuerpo**: `Inter`, 400 body, 500–600 botones/labels.
- Google Fonts: `https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,600&family=Inter:wght@400;500;600;700&display=swap`

| Rol | Tamaño | Peso/estilo |
|---|---|---|
| Display hero | `clamp(28px, 5vw, 44px)` | Playfair italic 600 |
| Heading | `22px` | Playfair 600 |
| Body | `16px` / line-height 1.6 | Inter 400 |
| Label / uppercase | `12px`, letter-spacing 0.1em | Inter 600 |
| Caption | `12px` | Inter 500, color `--ink-soft` |

## Espaciado

Base 4px. Escala: `4, 8, 12, 16, 24, 32, 48, 64, 96`. Secciones se separan con gaps de 48–64px (juguetón/luminoso pide aire, no densidad).

## Radios

- `sm`: 10px (chips, badges pequeños)
- `md`: 16px (cards, swatches)
- `lg`: 24px (paneles de vidrio grandes)
- `pill`: 999px (botones, inputs, select)

## Sombras

- Día, reposo: `0 2px 8px rgba(58,46,18,0.08)`
- Día, elevado/hover: `0 8px 24px -6px rgba(224,159,0,0.55)`
- Noche, reposo: `0 2px 10px rgba(0,0,0,0.35)`
- Noche, elevado/hover: `0 8px 28px -6px rgba(242,193,78,0.35)`

## Movimiento (tokens)

| Token | Valor | Uso |
|---|---|---|
| `--dur-fast` | 200ms | micro-hover, focus ring |
| `--dur-normal` | 350ms | botones, cards, aparición de UI |
| `--dur-transition` | 600ms | fade+scale del paso formulario → jardín |
| `ease-happy` | `back.out(1.7)` | aparición/mecido de flores en Feliz/Emocionado |
| `ease-calm` | `sine.inOut` | mecido lento de tallos/hojas en Relajado/Cansado |
| `ease-transition` | `power2.out` | transición de pantalla, hover genérico |
| `stagger-happy` | 0.05s | entre flores/partículas en modo día |
| `stagger-calm` | 0.18s | entre flores/partículas en modo noche |

Prohibido: `linear`, saltos de opacidad sin transición, más de un loop de fondo (partículas o shader) corriendo simultáneamente, rebote más fuerte que `back.out(1.7)`.

## Componentes base (5 estados: default, hover, focus, active, disabled)

- **Botón**: píldora, `--accent` de fondo, `--ink` de texto. Hover = scale 1.05 + sombra elevada. Focus = outline 3px `--accent-deep`/`--accent-deep` (noche) offset 3px. Active = scale 0.97. Disabled = opacity 0.4.
- **Input de texto**: fondo `--surface`, borde `--border`, radio `lg`. Focus = borde `--accent-deep`/`--accent` + glow suave.
- **Select (nativo)**: mismo tratamiento visual que input, radio `pill`. Se usa `<select>` nativo — sin librería de dropdown.
- **Color picker**: `<input type="color">` nativo, envuelto en swatch circular con borde `--border`.
- **Card / panel de vidrio**: fondo `--surface`, `backdrop-filter: blur(14-20px)`, borde `--border`, radio `lg`.

## Archivos hijos de este sistema

- `styles/tokens.css` — variables CSS día/noche + tipografía + espaciado + sombras (fuente de verdad en código).
- `index.html`, `styles/main.css`, `js/*.js` — implementación (Fase 4).
