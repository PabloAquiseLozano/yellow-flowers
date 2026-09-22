# Florcitas Amarillas

Regalo interactivo: la persona escribe su nombre, elige su signo zodiacal y un color favorito, y ve crecer un jardín animado en 2D. Cada flor, al tocarla, revela un mensaje bonito.

## Stack

- HTML + CSS + JavaScript vanilla — sin build, sin framework, sin dependencias que instalar.
- [GSAP](https://gsap.com/) por CDN — todas las animaciones.
- Google Fonts: Playfair Display (títulos) + Inter (texto).

## Cómo correrlo

```bash
python3 -m http.server 8743
```

Abrir `http://localhost:8743`. Tiene que servirse por HTTP — los mensajes de las flores se cargan con `fetch`, que no funciona abriendo `index.html` directo (`file://`).

## Estructura

```
index.html              Las dos pantallas (formulario + jardín) y el cielo persistente
styles/tokens.css       Colores, tipografía, espaciado y sombras (día/noche)
styles/main.css         Layout y componentes
js/app.js               Formulario: pasos, validación, color → familia de flor
js/sky.js               Cielo: sol/luna clicables, blur progresivo por paso del formulario
js/garden.js            El jardín: construcción de flores, crecimiento, mensajes
data-list/frases.json   Mensajes que puede mostrar una flor al tocarla
MASTER.md               Sistema de diseño (tokens, fuente de verdad de todo valor visual)
```

## Cómo funciona

1. **Formulario, 3 pasos**: nombre, signo zodiacal, color favorito.
2. El color elegido decide qué otra especie de flor —además de la amarilla principal— aparece en el jardín, según su matiz: rosa, tulipán, caléndula, trébol, nomeolvides, lavanda o margarita blanca.
3. **Día/noche** se controla tocando el sol o la luna, en cualquier momento, en cualquiera de las dos pantallas — no depende de ningún campo del formulario. Cambia el cielo, el suelo y la velocidad/energía con que crecen las flores.
4. Al enviar el formulario aparece el jardín: las flores crecen con GSAP, se distribuyen sobre la curva del suelo con profundidad (grandes al frente, chicas hacia la cresta), y su cantidad y tamaño se recalculan solos si cambia el tamaño de la ventana.
5. Al tocar **cualquier** flor, el nombre se desvanece y aparece, en el mismo lugar, un mensaje al azar de `data-list/frases.json` — uno distinto por cada flor en pantalla. A los pocos segundos el mensaje se desvanece y el nombre vuelve.

## Requisitos e indicaciones

- **Formulario**: solo nombre, signo zodiacal y color favorito.
  - Nombre: solo letras (con acentos/ñ), espacios, apóstrofos y guiones — números y símbolos se filtran mientras se escriben.
  - Signo zodiacal: obligatorio.
  - Color: opcional (tiene un valor por defecto).
- **Flores**: especie principal siempre amarilla; la secundaria depende del color elegido. Responsivas al ancho de pantalla (más cantidad y más grandes en desktop) y en vivo — se recalculan al cambiar el tamaño de la ventana, sin reenviar el formulario. Se posan sobre la curva real del suelo y llenan toda el área verde, no solo una fila en el borde.
- **Nombre**: grande, con gradiente de color, con sombra/resplandor para que no se vea plano, centrado y sin mezclarse con las flores.
- **Mensajes**: reemplazan el campo de "deseo" del formulario — cada flor revela uno al azar desde un JSON, tantos como flores se hayan renderizado esa vez.
- **Día/noche**: se cambia tocando el sol o la luna, con transición animada (el sol se pone y sube la luna, y viceversa) y un destello de luz que acompaña el cambio de color del cielo.
- **Fondo del formulario**: empieza borroso y se va enfocando a medida que se completan los pasos.
- **Todo en 2D** — sin WebGL/Three.js.
- **UX**: un texto guía explica que se puede tocar una flor para leer un mensaje y tocar el sol/luna para cambiar el clima.

## Decisiones no obvias (por si hay que tocar el código)

- `.garden-scene` tiene `z-index` explícito porque su `transform` (usado para centrarlo) crea un contexto de apilamiento propio — sin eso, el jardín entero se pinta detrás del suelo.
- `.screen` tiene `pointer-events: none` y solo `.glass-card` lo reactiva — si no, una pantalla vacía de borde a borde tapa los clics al sol/luna que está detrás.
- El sol y la luna son `<div>` posicionados en `%`, no parte del SVG del cielo — un `viewBox` con `preserveAspectRatio="...slice"` recorta distinto según la relación de aspecto, así que un punto fijo dentro de él termina en otro lugar en mobile que en desktop.
- Los colores de texto se recalculan en código (`readableOn` en `garden.js`) porque el color secundario lo elige el usuario libremente — nunca se asume que el valor elegido va a ser legible tal cual.
