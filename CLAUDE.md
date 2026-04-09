@AGENTS.md

# Mis Rutas - Convenciones de Diseño

## Sobre el proyecto
Aplicación web Mobile-First en Next.js (App Router) para gestionar rutas de entrega en Costa Rica.
Desplegada en Vercel (Hobby plan). La usuaria final es una mujer de 50 años.

## Principios de diseño

### Mobile-First
- El diseño se construye primero para pantallas de ~375px de ancho.
- Contenedor principal: `max-w-lg mx-auto px-4`.
- No usar layouts de escritorio complejos (grids multi-columna, sidebars).

### Accesibilidad y legibilidad
- **Botones**: altura mínima `h-14` (56px). Texto mínimo `text-base` (16px), preferir `text-lg` (18px).
- **Inputs**: altura mínima `h-14`. Texto `text-lg`.
- **Títulos**: `text-xl` a `text-2xl`, `font-semibold` o `font-bold`.
- **Texto general**: mínimo `text-base` (16px). Nunca usar `text-xs` o `text-sm` para contenido principal.
- **Contraste**: usar combinaciones de alto contraste. Fondo claro + texto oscuro. Evitar grises claros para texto importante.
- **Bordes redondeados**: `rounded-xl` para botones y cards.

### Paleta de colores (botones de acción)
- **Waze**: `bg-violet-600 hover:bg-violet-700 text-white`
- **Google Maps**: `bg-blue-600 hover:bg-blue-700 text-white`
- **Eliminar/Destructivo**: usar variant `destructive` de shadcn
- **Primario/Agregar**: usar variant `default` de shadcn (negro)

### Componentes UI
- Usar `shadcn/ui` como librería de componentes base.
- Componentes instalados: `Button`, `Input`, `Card`.
- Para nuevos componentes, instalar desde shadcn antes de crear desde cero.

## Arquitectura

### Estructura de carpetas
```
app/           → Páginas y layout (App Router)
components/    → Componentes de la app (AddressForm, RouteList, etc.)
components/ui/ → Componentes shadcn/ui (no editar manualmente)
lib/           → Utilidades
```

### Estado
- Estado global con **Zustand** + middleware `persist` (localStorage, key: `rutas-stops`).
- Store en `lib/store.ts`. Tipo `Stop`: `{id, textoOriginal, lat, lng, completado}`.
- Tipo `HomeLocation`: `{address, lat, lng}` — punto de regreso para ruta circular.
- `isOptimized: boolean` — dirty flag que se pone false al agregar/eliminar/completar paradas.
- Acciones: `addStop`, `addStopWithCoords`, `removeStop`, `toggleCompleted`, `reorderStops`, `setHomeLocation`, `clearHomeLocation`, `clearAll`.
- `addStop` pasa el texto por `parseCoordinates()` antes de guardar.
- `addStopWithCoords` recibe coords ya resueltas (desde geocoding o sugerencias).

### Navegación/Rutas
- La optimización de rutas debe usar la **ubicación actual del dispositivo (GPS)** como punto de partida.
- Links de navegación abren Waze o Google Maps en nueva pestaña.

## Decisiones de diseño (Fase 1)

Estas decisiones fueron tomadas durante la maquetación inicial y deben respetarse en fases futuras.

### ¿Por qué Mobile-First estricto?
La usuaria usa la app desde su celular mientras hace entregas. No hay caso de uso de escritorio.
Todo el diseño parte de 375px. El contenedor `max-w-lg` (512px) es el ancho máximo de contenido.

### ¿Por qué botones tan grandes (h-14 / 56px)?
La usuaria tiene 50 años y usa el celular con una mano mientras trabaja. Las áreas de toque
deben ser cómodas para evitar errores. Los estándares de accesibilidad recomiendan mínimo 44px;
usamos 56px por margen de seguridad.

### ¿Por qué no hay dark mode?
Simplicidad. La app se usa de día durante rutas de entrega. No se necesita dark mode por ahora.

### ¿Por qué Zustand con persist?
Se necesita persistencia en localStorage para que la lista sobreviva recargas. Zustand + persist
lo resuelve en ~30 líneas sin boilerplate. El store vive en `lib/store.ts`.

### ¿Por qué Waze y Google Maps como links externos?
Integrar navegación turn-by-turn dentro de la app es innecesariamente complejo. Es más práctico
abrir la app nativa de Waze/Maps que ya está instalada en el celular de la usuaria.

### ¿Por qué la ruta se calcula desde la ubicación actual (GPS)?
La usuaria empieza sus entregas desde donde esté en ese momento, no desde una dirección fija.
La optimización de ruta debe pedir permiso de geolocalización y usar esas coordenadas como origen.

## Stack técnico
- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Estado**: Zustand con persist middleware (localStorage)
- **Lenguaje**: TypeScript
- **Deploy**: Vercel (Hobby)
- **Componentes shadcn instalados**: Button, Input, Card

### Parser de coordenadas (`lib/parsers.ts`)
Función pura `parseCoordinates(text)` que extrae lat/lng de:
- Links de Waze con `ll=` (`waze.com/ul?ll=...`)
- Links de Google Maps (`@lat,lng`, `?q=lat,lng`, `/place/.../lat,lng`)
- Apple Maps (`maps.apple.com/?ll=...`)
- URI geo de Android/WhatsApp (`geo:lat,lng`)
- Coordenadas sueltas (`9.9281,-84.0907`)
- Retorna `null` si no encuentra coordenadas

Helpers adicionales:
- `isUrl(text)` — detecta si el texto es una URL (http/https)
- `cleanInput(text)` — decodifica `+`→espacios y `%XX` URL encoding

### Resolución de links acortados (`app/api/resolve-link/route.ts`)
- Route Handler GET que sigue redirects de links acortados (Waze, Google Maps, goo.gl)
- Parsea coords de la URL final; si no las encuentra, busca en el HTML
- Soporta: `waze.com/ul/xxx`, `maps.app.goo.gl/xxx`, cualquier short URL de mapas

## Decisiones de diseño (Fase 3)

### Optimización de rutas (TSP)
- Se usa **OpenRouteService** (endpoint `/optimization`, formato VROOM).
- La API key se protege en `.env.local` como `ORS_API_KEY` y se accede via Route Handler `app/api/optimize/route.ts`.
- El Route Handler recibe `{origin: [lng,lat], end?: [lng,lat], jobs: [{id, location: [lng,lat]}]}` y retorna `{orderedIds: string[]}`.
- El botón "Optimizar Ruta" pide geolocalización del dispositivo como punto de partida.
- Paradas sin coordenadas se ignoran en la optimización y quedan al final de la lista.
- Estados de carga: idle → "Obteniendo ubicación..." → "Calculando mejor ruta..." → resultado/error.

## Decisiones de diseño (Fase 3.5)

### Autocompletado de direcciones
- Se usa **ORS Geocode Autocomplete** (`/geocode/autocomplete`) con `boundary.country=CR`.
- Route Handler en `app/api/geocode/route.ts` — proxy GET, retorna `[{label, lat, lng}]`.
- `AddressForm` detecta si el input es un link (vía `parseCoordinates`) o texto:
  - **Link**: muestra "Link detectado", botón "Agregar Link", usa parser de Fase 2.
  - **Texto (3+ chars)**: debounce 500ms → llama `/api/geocode` → dropdown de sugerencias.
- Al seleccionar sugerencia → `addStopWithCoords(label, lat, lng)` directo al store.
- Botón "Agregar Parada" siempre disponible como fallback (agrega sin coords).
- Dropdown: items con `min-h-[48px]`, se cierra con click/touch outside, muestra "Buscando..." y "Sin resultados".

## Decisiones de diseño (Fase 3.7)

### Robustez del ingreso de direcciones
El `handleSubmit` de `AddressForm` sigue 3 caminos según el input:
1. **Coords directas** (regex match) → `addStopWithCoords()` inmediato
2. **URL sin coords visibles** (link acortado) → `/api/resolve-link` sigue redirects → extrae coords
3. **Texto plano** → `/api/geocode` auto-geocodifica → usa primer resultado

Formatos soportados: Waze (con/sin coords, acortado), Google Maps (todos los formatos, goo.gl),
Apple Maps, URI geo, coordenadas sueltas, texto URL-encoded con `+`, texto plano de WhatsApp.

### Depuración del botón Optimizar
- `console.log` en cada paso: GPS, jobs enviados, respuesta ORS
- Errores de GPS diferenciados: permiso denegado, GPS apagado, timeout
- Estado "success" con feedback visual (3s) + estado "error" con botón "Reintentar"

## Decisiones de diseño (Fase 4)

### Home/Base (Ruta Circular)
- `homeLocation` en el store Zustand: se persiste en localStorage.
- `HomeConfig.tsx`: componente con autocompletado ORS para buscar la base/casa/bodega.
- Al optimizar, se envía `end: [home.lng, home.lat]` al Route Handler.
- ORS VROOM configura `vehicle.end` para que la ruta termine en casa.
- Si no hay home configurado, la ruta es abierta (sin regreso forzado).

### Reverse Geocoding (Nombres descriptivos para links)
- Route Handler `app/api/reverse-geocode/route.ts` — proxy a ORS `/geocode/reverse`.
- Cuando se agregan paradas desde links (caminos 1 y 2 de AddressForm), se llama reverse geocode
  para reemplazar la URL cruda por un nombre legible (ej. "Barrio Escalante, San José").
- Fallback si falla: `"Dirección de enlace"`.

### Dirty State (isOptimized)
- `isOptimized` se pone `true` al reordenar exitosamente, `false` al modificar la lista.
- Botón Optimizar cambia a naranja con "Ruta Desactualizada — Reoptimizar" cuando `isOptimized === false`.
- Botón verde cuando la ruta está al día.

### Paleta de colores (botón Optimizar, actualizada)
- **Optimizar (idle, primera vez)**: `bg-green-600` verde
- **Ruta desactualizada (dirty)**: `bg-amber-500` naranja
- **Calculando**: `bg-green-600` + spinner
- **Éxito**: `bg-green-700` + checkmark (3s)
- **Error/Reintentar**: `bg-amber-600`

## Restricciones
- No agregar librerías innecesarias.
- No implementar abstracciones prematuras.
- Priorizar simplicidad sobre elegancia.
- Idioma de la UI: **español** (Costa Rica).
- No editar manualmente archivos en `components/ui/` (son de shadcn).
