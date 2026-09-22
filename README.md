# Flor de Ánimo

Regalo interactivo: la persona escribe su nombre, su signo y un color favorito, y ve crecer un jardín 2D animado con flores propias — la especie principal es siempre amarilla, y el color elegido decide qué otra especie la acompaña. Cada flor, al hacer clic, revela un mensaje bonito.

## Cómo correrlo

No hay build ni dependencias que instalar — es HTML/CSS/JS plano con GSAP por CDN. Solo necesita servirse por HTTP (no abrir `index.html` directo por `file://`, porque el fetch de los mensajes no funciona sin servidor):

```bash
python3 -m http.server 8743
```

y abrir `http://localhost:8743`.

## Estructura

```
index.html            Las dos pantallas (formulario y jardín) + el cielo persistente
styles/tokens.css      Design tokens (color, tipografía, espaciado, sombra, motion) — día/noche
styles/main.css        Todo el layout y los componentes
js/app.js              Formulario: pasos, validación, clasificación de color → familia de flor
js/sky.js              Cielo persistente: sol/luna clicables, blur ligado al step del formulario
js/garden.js           El jardín: construcción de flores, crecimiento, mensajes por flor
data-list/frases.json  Los mensajes que puede mostrar una flor al hacer clic
MASTER.md              Sistema de diseño (fuente de verdad de todo valor visual/motion)
```

## Flujo de datos

1. El formulario (`app.js`) pide **nombre**, **signo zodiacal** y **color favorito** — nada más. El color se clasifica por matiz (`hexToHue`) en una de 8 familias (`FLOWER_FAMILIES` en `app.js`), cada una con su propia especie secundaria de flor y un color representativo.
2. El **día/noche** ya no depende de un campo del formulario: se controla haciendo clic directamente en el sol o la luna, en cualquier momento, en cualquiera de las dos pantallas (`sky.js`, `window.skySetMood`). Ese mismo estado decide después la velocidad/easing de crecimiento del jardín (`window.skyIsNight()`).
3. Al enviar el formulario, `window.gardenInit(data)` (`garden.js`) recibe `{ name, zodiac, colorHex, family }` y:
   - calcula cuántas flores de cada especie renderizar según el ancho real de pantalla (más flores en desktop, menos en mobile — ver "Responsive" abajo),
   - las hace crecer con GSAP (tallo → hojas → pétalos, con timing distinto según sea día o noche),
   - reparte un mensaje de `data-list/frases.json` a cada flor,
   - deja cada flor clicable: al tocarla, muestra el nombre de la persona + su mensaje asignado.

## El sistema de mensajes

`data-list/frases.json` es un array plano:

```json
[
  { "id": 1, "mensaje": "Texto del mensaje..." },
  { "id": 2, "mensaje": "..." }
]
```

`garden.js` mezcla (`shuffle`) ese array y le asigna **un mensaje a cada flor que realmente se renderizó** — si la pantalla es chica y solo salen 11 flores, se usan 11 mensajes al azar; si el archivo tiene 1000, los otros 989 simplemente no se usan esa vez. Esto significa:

- Podés poner cientos o miles de mensajes en `frases.json` sin tocar código — cada visita al jardín usa una muestra distinta.
- Si el fetch falla (por ejemplo, abriendo el archivo sin servidor HTTP), `garden.js` cae a un `FALLBACK_MESSAGES` de 5 mensajes genéricos incluido en el propio archivo, para que la página nunca se rompa.

## Responsive

Las flores no son una cantidad fija: `garden.js` calcula cuántas poner según el ancho real de `.garden-scene` (que tiene `max-width: 1100px` para que el campo se vea agrupado al centro en pantallas anchas, en vez de disperso de borde a borde):

```
mainCount = clamp(7, round(ancho / 70), 26)
secCount  = clamp(4, round(ancho / 110), 14)
```

El "suelo" (`#garden-ground`) ocupa el **32% inferior** de la pantalla, con `.garden-scene` (donde viven las flores) 2 puntos más baja (30%) para que los tallos se planten *dentro* del pasto en vez de justo en su borde superior. El campo de flores (`.garden-scene`) ocupa el **100% del ancho** — no tiene `max-width`: en desktop se ve más lleno porque hay más flores y son más grandes (`sizeFactor` en `garden.js`), no porque estén agrupadas en una franja angosta.

## Sol / luna

Clic en el sol → se oculta y sube la luna (con un pequeño retraso, efecto atardecer), aparecen estrellas, el cielo pasa a índigo, y además un breve destello de luz cálido (`.sky-flash`) barre la pantalla para que se sienta como un cambio de iluminación, no solo un cambio de color plano. Clic en la luna → vuelve el sol con el mismo destello mismo pero frío, todo reversible.

El sol y la luna **no viven dentro del SVG** que dibuja colinas/estrellas/nubes — son `<div>` posicionados en `%` (`top`/`left` fijos en CSS). Un `viewBox` con `preserveAspectRatio="... slice"` (modo "cover") re-recorta su contenido según la relación de aspecto, así que un punto fijo *dentro* de él se ve en un lugar distinto en un celular alto que en un monitor ancho y bajo. Sacarlos del SVG y ponerlos en `%` los deja en el mismo punto relativo sin importar la forma de la pantalla. El movimiento de aparecer/ocultarse se anima con `transform: translateY(...)` + opacidad — nunca tocando `top` (dispara layout en cada frame) ni el atributo `transform` de SVG como string (GSAP no lo interpola).

## Decisiones de diseño que no son obvias leyendo el código

- **No hay librería de "day/night toggle"**: se evaluó (ver commits/historial de la conversación) y no existe nada mejor que un SVG + GSAP hecho a medida, dado que necesita calzar con los tokens de color del proyecto. Los ejemplos reales de este patrón en la web también son hechos a mano.
- **`.garden-scene` tiene `z-index` explícito**: sin él, el `transform: translateX(-50%)` que centra el campo crea sin querer un contexto de apilamiento propio, y el jardín entero terminaba pintado *detrás* del suelo. Ver el comentario en `styles/main.css` junto a esa regla.
- **`.screen` tiene `pointer-events: none` y solo `.glass-card` lo reactiva**: una pantalla completa (`position: fixed; inset: 0`) intercepta clics en toda su área aunque no tenga nada visible ahí, tapando el sol/luna que está detrás. Mismo patrón de bug que tuvo `[hidden]` con el canvas en una iteración anterior — CSS de autor le gana al comportamiento nativo cuando hay empate de especificidad.
- **Los contrastes de color se recalculan en código** (`readableOn` en `garden.js`, `--accent-text` en `tokens.css`): el usuario elige el color secundario libremente desde un color picker, así que cualquier texto que use ese color (el nombre del jardín, la etiqueta de la margarita blanca) se ajusta automáticamente hacia negro o blanco hasta cumplir un contraste mínimo, en vez de asumir que el color elegido siempre va a ser legible.

## Historial de iteraciones

1. **v1** — Formulario de 5 pasos (nombre, signo, color, ánimo, deseo) + jardín en Three.js/WebGL.
2. **v2** — Se reemplazó Three.js por flores 2D (divs/GSAP), inspirado en la técnica de [`DevCaress/yellow-flowers`](https://github.com/DevCaress/yellow-flowers): tallo que crece, pétalos que brotan con stagger. 7 especies con siluetas distintas según el color elegido. Nombre grande con gradiente.
3. **v3** — Se agregó el cielo persistente con blur progresivo por paso del formulario y sol/luna animados. Se quitaron los pasos de ánimo y deseo; el día/noche ahora se controla haciendo clic en el sol/luna, y cada flor (no solo una) revela un mensaje propio desde `data-list/frases.json`. Se corrigió el layout responsivo (conteo de flores por ancho de pantalla, suelo con tamaño fijo en %, flores centradas y más abajo para no tapar el nombre).
4. **v4** — Ajustes de pulido tras revisar v3 en distintos tamaños de pantalla: el campo de flores pasó de una franja centrada con `max-width` a ocupar todo el ancho, con más flores y más grandes en desktop (`sizeFactor`); el suelo se aplanó y se desfasó 2% respecto a las flores para que los tallos no floten sobre el pasto; el sol/luna salieron del SVG "cover"-escalado a `<div>` en `%` para no drifear con la relación de aspecto; la transición día/noche sumó un destello de luz (`.sky-flash`) además del crossfade; y el nombre pasó de anclarse por su borde superior a anclarse por su centro, para no "subir" al achicarse en pantallas angostas.
5. **v5** — El campo de flores (`buildField()` en `garden.js`) ahora es **dinámico en vivo**: un listener de `resize` (debounced 250ms) recalcula cantidad y tamaño y reconstruye el jardín sin necesidad de reenviar el formulario, tanto agrandando como achicando la ventana. El suelo subió a 40% de la pantalla y las flores ganaron un jitter vertical aleatorio para no verse todas en una línea perfectamente plana. El nombre y la tarjeta de mensaje ahora comparten el mismo slot central (mismo `top`/`left`/`transform` en CSS): al tocar una flor, el nombre se desvanece y el mensaje aparece en su lugar, y unos segundos después el mensaje se desvanece y el nombre vuelve — nunca hay un popup flotando aparte. El nombre también ganó un `filter: drop-shadow(...)` doble (sombra + resplandor dorado) para no verse plano. El hint de arriba ahora explica las dos interacciones (tocar una flor, tocar sol/luna).
6. **v6** — Recomposición específica de mobile (`@media (max-width: 700px)` en `main.css`, desktop no se tocó): el nombre pasó a `top: 50%` (centro real de la pantalla) y el suelo subió a 50% de altura, para que el monte arranque justo en el centro y las flores crezcan por delante del nombre en vez de quedar apretadas contra el borde inferior. Esto expuso un bug real: subir la `height` de `.garden-ground`/`.garden-scene` no movía dónde arraigaban las flores — seguían ancladas a `bottom: 0` (el borde absoluto de la pantalla), así que un suelo más alto solo agregaba más verde *debajo* de las flores, no las subía. El fix fue mover el `bottom` de `.garden-scene` (su verdadera línea de raíz) para que coincida con el borde superior del pasto, y quitarle el `height` (ya no cumplía ninguna función de layout). La tarjeta de mensaje, al tener más contenido que el nombre (una línea vs. nombre + mensaje de varias líneas), no puede compartir el mismo 50% exacto sin que el suelo tape sus últimas líneas — quedó en `top: 40%`, un poco más arriba, solo en mobile.
7. **v7** — El usuario adjuntó `referencia.png`: una captura anotada a mano marcando dónde quería el nombre y las flores. El fix de v6 (flores creciendo justo sobre el nombre, mismo 50%) se leía como texto y pétalos cruzándose — "mezclado", no una composición intencional. El ajuste (mismo `@media (max-width: 700px)`): nombre a `top: 30%`, tarjeta de mensaje a `top: 24%`, suelo a `height: 36%`, flores rooteadas en `bottom: 34%` — deja un espacio de cielo limpio entre el borde inferior del nombre y la flor más alta, y el suelo ya no queda pegado al borde inferior de la pantalla. Desktop no se tocó.
8. **v8** — Las flores ahora siguen la curva del cerro y llenan toda el área verde (`place()`/`buildField()` en `garden.js`), no solo una fila pegada al borde superior. Cada flor recibe una `depth` aleatoria (0 = en la cresta, 1 = primer plano cerca del borde inferior); el offset de raíz combina un `curveBump` (`sin(π·x/100)`, sigue la curva real del SVG del suelo) con `-depth·fillDepth` (resta, no suma — hacia abajo, dentro del verde). El tamaño también escala con la profundidad (0.6× en la cresta → 1.0× en primer plano), dando una perspectiva natural. Primer intento tenía el signo invertido: sumaba en vez de restar, así que las flores se iban hacia arriba y volvían a tapar el nombre — corregido antes de entregar.
9. **v9** — El `curveBump` de v8 seguía mal calibrado: era unidireccional (0 a +amplitud), así que la mayoría de las flores quedaban *por encima* del punto medio real de la curva del SVG — de ahí las flores flotando sobre el cerro. Corregido a un bump simétrico (`amplitud·(sin(π·x/100) − 0.5)`, negativo en los bordes, positivo al centro) con la amplitud bajada de 12% a 7% de la altura del suelo, para no sobrepasar la curva real (8%). El mínimo de girasoles en mobile subió de 9 a 20 (`Math.max(20, ...)` en `mainCount`), secundarias de 5 a 8. Con el nuevo margen libre, el nombre en mobile volvió a acercarse al centro (`top: 40%`, antes 30%) y creció (`clamp(64px, 20vw, 170px)`, antes 48px/15vw).
10. **v10** (actual) — En mobile, `.message-card` había quedado en `top: 30%` mientras `.garden-name` estaba en `top: 40%` (divergencia heredada de cuando el mensaje se cortaba contra el suelo en v7). El espacio liberado en v9 ya alcanza para que ambos compartan el mismo `top: 40%` sin que el suelo tape ninguna línea del mensaje — quedaron igualados, como en desktop (que ya compartían `top: 26%` desde antes).
