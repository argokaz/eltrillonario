# 💸 Gasta la plata de Elon

Web satírica (mobile-first, en español) para **gastar la fortuna de un trillonario**…
si es que logras vaciarla. Una mirada divertida —pero incómoda— a la desigualdad:
una sola persona tiene más dinero que países enteros, y su fortuna **nunca deja de subir**.

> No es contra una persona; es contra un sistema donde unos pocos acumulan más que millones juntos.

## ✨ Qué incluye

- **Contador en tiempo real**: la fortuna sube ~$6,342 por segundo (basado en su mejor año, ~$200 mil millones).
- **Comparación de sueldos**: cuánto gana Elon por minuto vs. el sueldo mensual promedio en Perú, Colombia, México, Argentina, Chile y Bolivia.
- **Catálogo para gastar**: gadgets, autos de lujo, yates, jets, satélites, todas las entradas a la final del Mundial, todos los juegos de Steam, 1 millón de GPUs Nvidia…
- **Lo que de verdad importa**: sacar de la pobreza al Perú, pagar su deuda externa, casas para los sin techo, acabar con el hambre en el mundo.
- **Comprar imperios**: Credicorp/BCP, Alicorp, el Real Madrid, Spotify, Apple.
- **Recibo final** 🧾 con tu porcentaje gastado (spoiler: es minúsculo).
- **Animaciones SVG**, confeti y **efecto "ca-ching"** sintetizado (sin archivos externos).
- 100% responsive, sin frameworks ni build. Solo HTML/CSS/JS.

## 🗂️ Estructura

```
gasta-la-plata-de-elon/
├── index.html          # estructura + caricatura SVG de Elon
├── css/
│   └── styles.css       # estilos mobile-first + animaciones
├── js/
│   ├── data.js          # 👈 cifras, sueldos y catálogo (edítalo aquí)
│   ├── sound.js         # "ca-ching" generado con Web Audio API
│   └── app.js           # lógica: contador, compras, confeti, recibo
├── assets/              # (vacío: todo es SVG/emoji inline)
├── vercel.json
└── README.md
```

## ▶️ Probar localmente

No necesita build. Cualquier servidor estático sirve:

```bash
# opción 1
npx serve gasta-la-plata-de-elon

# opción 2
cd gasta-la-plata-de-elon && python3 -m http.server 5173
# abre http://localhost:5173
```

> Ábrelo con un servidor (no con `file://`) para que el audio y las fuentes carguen bien.

## 🚀 Subir a Vercel

Es un sitio 100% estático, así que el deploy es directo:

```bash
npm i -g vercel        # si no lo tienes
cd gasta-la-plata-de-elon
vercel                 # preview
vercel --prod          # producción
```

O desde la web de Vercel: **New Project → importa el repo → Framework: "Other" → Deploy.**
No hay comando de build ni directorio de salida que configurar (root = esta carpeta).

## 🖼️ La imagen de Elon (IMPORTANTE)

El héroe usa **`assets/elon.png`** (el sticker de Elon con ojos de dólar).
Mientras ese archivo no exista, el sitio muestra automáticamente una **caricatura SVG de respaldo**, así que nunca se rompe.

Para usar el sticker real:

1. Guarda la imagen como **`gasta-la-plata-de-elon/assets/elon.png`**
   (idealmente con fondo transparente; un PNG cuadrado de ~600×600 va perfecto).
2. Recarga la página. Listo. ✅

## ✏️ Personalizar

Casi todo se edita en **`js/data.js`**:

- `NET_WORTH`: patrimonio base.
- `EARN_PER_SECOND`: ritmo del contador.
- `SALARIES`: países y sueldos promedio.
- `CATEGORIES`: agrega/quita productos (emoji, nombre, precio en USD, comentario satírico).

### Sobre las imágenes de productos

Para que el sitio sea autocontenido y libre de problemas de copyright/links rotos,
los productos usan **emojis** grandes en lugar de fotos. Si quieres usar imágenes reales:

1. Coloca los archivos en `assets/` (ej. `assets/iphone.png`).
2. En `js/app.js`, dentro de `cardHTML`, reemplaza
   `<div class="card__emoji">${it.emoji}</div>` por
   `<img class="card__img" src="assets/${it.img}" alt="${it.name}">`
   y agrega un campo `img` a cada item en `data.js`.

## ⚠️ Nota sobre las cifras

Todas las cantidades son **aproximadas**, con fines satíricos y educativos
(precios de lista, estimaciones de prensa económica y organismos como la ONU).
El patrimonio de los multimillonarios fluctúa muchísimo día a día.
