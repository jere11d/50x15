# 50x15 Bíblico Pro — Contexto Completo del Proyecto

> Documento de contexto para asistentes de IA. Última actualización: 10 de abril de 2026 (v2 — responsive + temas).

---

## 🎯 Descripción General

**50x15 Bíblico Pro** es un juego web interactivo de trivia bíblica inspirado en "¿Quién Quiere Ser Millonario?" (Who Wants to Be a Millionaire). Está diseñado para ser utilizado en **eventos presenciales** (iglesias, grupos de estudio, reuniones) y se proyecta en pantalla grande mientras la audiencia participa desde sus celulares mediante votación en tiempo real (estilo Kahoot).

- **Desarrollador:** Jeremías (jere11d en GitHub)
- **Repositorio:** https://github.com/jere11d/50x15
- **Hosting:** GitHub Pages
- **Idioma del juego:** Español latinoamericano (NO español de España)
- **Público objetivo:** Iglesias y eventos cristianos

---

## 📂 Estructura de Archivos

```
50x15/
├── index.html          # Página principal (menú, juego, gestión de preguntas)
├── votar.html          # Página móvil para votación del público (Kahoot-like)
├── style.css           # Estilos globales (tema oscuro, azul/dorado)
├── app.js              # Lógica completa del juego
├── questions.json      # Base de datos de preguntas de ejemplo
├── assets/             # Carpeta de audio/SFX
│   ├── 50 50.mp3
│   ├── cambio de pantalla.mp3
│   ├── correct.mp3
│   ├── llamada.mp3
│   ├── reloj de pensar pregunta.mp3
│   ├── respuesta definitiva.mp3
│   ├── retirarse.mp3
│   ├── salvapantallas.mp3
│   ├── sonid de preguntas.mp3
│   ├── tension pregunta 15.mp3
│   ├── votacion.mp3
│   └── wrong.mp3
├── img/                # (vacío actualmente)
└── ia/                 # Carpeta de contexto para IA
    └── contexto.md     # Este archivo
```

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Frontend:** HTML5 + Vanilla CSS + Vanilla JavaScript (sin frameworks)
- **Backend en tiempo real:** Firebase Realtime Database (SDK 8.10.1 — versión compatible/CDN clásico)
- **Generación de QR:** qrcodejs (CDN)
- **Íconos:** Font Awesome 6.0.0 (CDN)
- **Hosting:** GitHub Pages (archivos estáticos)

### Firebase — Configuración Activa
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyDmuQ3rv-bBudtvDT_ypYithXGLmgfXuZ0",
    authDomain: "juego-50x15.firebaseapp.com",
    databaseURL: "https://juego-50x15-default-rtdb.firebaseio.com",
    projectId: "juego-50x15",
    storageBucket: "juego-50x15.firebasestorage.app",
    messagingSenderId: "588319700681",
    appId: "1:588319700681:web:3efa9ba278e07c46f43f18"
};
```
- **Reglas de seguridad:** `.read: true`, `.write: true` (modo de prueba)
- Firebase se usa ÚNICAMENTE para la funcionalidad de votación del público

### Almacenamiento Local
- `localStorage['biblia_questions']` — Base de datos de preguntas activas del juego
- `localStorage['biblia_save']` — Estado guardado de partida pausada
- `localStorage['biblia_themes']` — Diccionario de temas guardados `{nombre: preguntas[]}`

---

## 🎮 Funcionalidades Implementadas

### 1. Pantallas del Juego
| Pantalla | ID | Descripción |
|---|---|---|
| Menú Principal | `screen-home` | Nueva Partida, Continuar, Gestionar Preguntas |
| Juego | `screen-game` | Pregunta, opciones, escalera de premios, comodines |
| Administración | `screen-admin` | Tabla editable de preguntas con import/export JSON |

### 2. Mecánica del Juego
- **15 niveles de dificultad** con premios progresivos: $100 → $1 MILLÓN
- **Puntos seguros** en niveles 5 ($1,000), 10 ($32,000) y 15 ($1 MILLÓN)
- **Temporizador progresivo:**
  - Niveles 1-5: 15 segundos
  - Niveles 6-10: 30 segundos
  - Niveles 11-15: 45 segundos
- **Selección de preguntas:** Una pregunta aleatoria por nivel, agrupadas por campo `nivel` del JSON
- **Aleatorización de opciones:** Las respuestas A-D se barajan en cada pregunta
- **Doble clic para confirmar:** Primer clic selecciona (resaltado naranja), segundo clic confirma como "respuesta definitiva"
- **4 segundos de tensión** después de confirmar antes de revelar la respuesta

### 3. Comodines (3 disponibles, uso único)
| Comodín | Función | Sonido | Timer |
|---|---|---|---|
| **50:50** | Elimina 2 respuestas incorrectas al azar | `50 50.mp3` (5s) | — |
| **Llamada** | Pausa el reloj principal, abre overlay con timer propio | `llamada.mp3` | 15 segundos |
| **Público** | Votación Kahoot en tiempo real vía Firebase + QR | `votacion.mp3` | 24 segundos (+6s análisis) |

### 4. Sistema de Audio
- `bgmPlayer` — Audio en bucle para música de fondo (loop=true)
- `sfxPlayer` — Audio de efectos de sonido (one-shot)
- **Mapeo de sonidos:**
  - Pantalla inicio → `salvapantallas.mp3`
  - Preguntas generales → `sonid de preguntas.mp3`
  - Pregunta 15 (final) → `tension pregunta 15.mp3`
  - Selección definitiva → `respuesta definitiva.mp3`
  - Correcta → `correct.mp3`
  - Incorrecta → `wrong.mp3`
  - Retirarse → `retirarse.mp3`
  - Cambio de pantalla → `cambio de pantalla.mp3`

### 5. Sistema de Votación del Público (Kahoot-like)
- Al usar el comodín "Público", se genera un código de sala aleatorio de 4 caracteres
- Se crea un registro en Firebase Realtime DB con la pregunta y opciones
- Se genera un QR que apunta a `votar.html?room=XXXX`
- `votar.html` muestra la pregunta y 4 botones grandes coloridos para votar desde el celular
- Los votos se registran con **transacciones** Firebase (anti-colisión)
- Si se usó 50:50 antes, las opciones eliminadas se ocultan también en votar.html
- La sala se cierra automáticamente al acabar el tiempo (active: false)
- Los resultados se muestran en barras horizontales animadas en la pantalla principal

### 6. Pausa y Guardado
- Botón de pausa detiene el timer y abre overlay
- Opción "REANUDAR" retoma el timer donde quedó
- Opción "GUARDAR Y SALIR" almacena: `currentIdx`, `bancoTiempo`, `sessionQuestions`, estado de comodines
- "CONTINUAR" desde menú principal restaura la partida guardada

### 7. Retiro
- Solo disponible en niveles 5 y 10 (puntos seguros)
- Pantalla de confirmación "¿ESTÁS SEGURO?"
- Muestra cuánto se lleva el jugador

### 8. Gestión de Preguntas (Panel Admin)
- Tabla editable inline con columnas: Nivel, Pregunta, A, B, C, D, Correcta, Acción
- Slider de tamaño de fuente (variable CSS `--game-font-size`)
- "GUARDAR EN NAVEGADOR" → localStorage
- Archivos JSON:
  - Importar JSON desde archivo (auto-detecta nombre del tema del filename)
  - Descargar JSON actual (usa nombre del tema como filename)
  - Borrar todo (con confirmación)

### 9. Sistema de Temas
- Permite guardar múltiples sets de preguntas con nombre en el navegador
- Cada tema almacena un array completo de preguntas con sus niveles
- Funciones disponibles:
  - **Guardar Tema** — Guarda las preguntas actuales bajo un nombre
  - **Usar Tema** — Carga un tema guardado como preguntas activas
  - **Descargar Tema** — Exporta un tema como archivo `.json` individual
  - **Eliminar Tema** — Borra un tema del navegador
- Almacenamiento: `localStorage['biblia_themes']` como `{nombre: preguntas[]}`
- El tema activo se resalta con borde dorado y estrella ⭐
- Al importar un JSON, auto-detecta el nombre del archivo como nombre de tema

### 10. Diseño Responsive
- Todos los anchos cambiaron de pixeles fijos a `clamp()` y `max-width` fluido
- Media queries en 3 breakpoints: 1200px, 1024px, 768px
- La escalera de premios se hace más estrecha en pantallas chicas
- En tablets (<768px) la escalera se vuelve horizontal arriba
- Textos usan `clamp()` para escalado automático
- Meta viewport tag en index.html

---

## 📐 Formato del JSON de Preguntas

```json
[
    {
        "nivel": 1,
        "pregunta": "¿Quién construyó el arca?",
        "opciones": ["Moisés", "Noé", "Abraham", "David"],
        "correcta": 1
    }
]
```
- `nivel`: 1-15 (dificultad progresiva)
- `opciones`: Array de 4 strings
- `correcta`: Índice (0-3) de la respuesta correcta en el array ORIGINAL (antes de aleatorizar)

---

## 🎨 Diseño Visual

### Paleta de Colores (Variables CSS)
| Variable | Valor | Uso |
|---|---|---|
| `--gold` | `#ffd700` | Acentos, bordes, texto destacado |
| `--blue-dark` | `#020230` | Fondo de tarjetas |
| `--blue-bright` | `#0000ff` | Detalles brillantes |
| `--game-font-size` | `1.5rem` | Tamaño base ajustable |

### Estilo General
- Fondo: `radial-gradient(circle, #05054d, #000)`
- Fuente principal: `'Arial Black', sans-serif`
- Cajas de pregunta/opciones: Forma de diamante con `clip-path: polygon(...)`
- Ancho responsive: opciones `max-width: 600px`, pregunta `max-width: 900px` (ambos `width: 100%`)
- Escalera de premios a la izquierda (column-reverse = millón arriba), ancho `clamp(150px, 20vw, 280px)`
- Overlays con fondo `rgba(0,0,0,0.95)` y z-index `9999`

### Estados de Opciones (CSS)
| Clase | Color de fondo | Significado |
|---|---|---|
| `.selected` | `#ff8800` (naranja) | Seleccionada (primer clic) |
| `.correct` | `#28a745` (verde) + animación pulse | Respuesta correcta revelada |
| `.wrong` | `#dc3545` (rojo) | Respuesta incorrecta revelada |

---

## 📝 Notas de Preferencia del Usuario

1. **Lenguaje:** Usar español latinoamericano, no español de España. Ejemplo: "ME RETIRO" en vez de "ME PLANTO"
2. **Mensajes:** "¡Ganaste 1 millón de puntos!" en vez de "Ganaste el premio mayor"
3. **Nombre del proyecto:** "50x15 Bíblico Pro"
4. **El juego se usa en vivo** proyectado en pantalla grande en eventos
5. **Las preguntas son de temática bíblica/cristiana**
6. **El usuario trabaja en Mobiik** (empresa, por eso su ruta OneDrive incluye ese nombre)

---

## 🔄 Historial de Desarrollo (Resumen)

1. **Base del juego** — Estructura HTML/CSS/JS con pantallas, escalera, timer
2. **Pausa profesional** — Overlay con opciones de reanudar o guardar/salir
3. **Confirmación de retiro** — Pantalla "¿Estás seguro?" con monto asegurado
4. **Aleatorización** — Preguntas por nivel + opciones barajadas cada vez
5. **Localización** — "Me Retiro" y mensaje de victoria en español latinoamericano
6. **Comodines funcionales** — 50:50, Llamada (15s), Público (placeholder)
7. **Votación en tiempo real** — Firebase + QR + votar.html (estilo Kahoot)
8. **Subida a GitHub** — Repositorio jere11d/50x15, GitHub Pages
9. **Firebase configurado** — Credenciales inyectadas, Realtime DB activa
10. **Gestión de preguntas** — Import/Export JSON + borrado
11. **Banda sonora integrada** — 12 archivos MP3 mapeados a eventos del juego
12. **Doble clic para confirmar** — Mecánica de "respuesta definitiva" con tensión de 4s
13. **Diseño responsive** — clamp(), media queries, meta viewport para laptops pequeñas
14. **Sistema de temas** — Guardar/cargar/descargar packs de preguntas con nombre

---

## ⚠️ Problemas Conocidos / Cosas Pendientes

1. **Carpeta `img/` vacía** — No hay favicon ni imágenes de fondo
2. **`reloj de pensar pregunta.mp3`** — Existe en assets pero no se usa en el código actual
3. **Firebase en modo de prueba** — Las reglas expiran en 30 días (reconfigurar si es necesario)
4. **`favicon.ico` faltante** — Error 404 en consola (cosmético)
5. **Posible leak del `sfxPlayer`** — Si se disparan múltiples SFX rápidamente, solo suena el último

---

## 🗣️ Conversaciones Relevantes (IDs)

| ID | Tema |
|---|---|
| `9c87db97-1f6e-45f2-85d7-4e050a3799a3` | Integración de audio, doble clic, timers sincronizados |
| `4740a958-574f-41f5-bdde-de583d65c0f3` | Debugging de lógica del juego |

---

*Este archivo es generado automáticamente y debe actualizarse cuando se hagan cambios significativos al proyecto.*
