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
- Acciones: `addStop`, `removeStop`, `toggleCompleted`, `clearAll`.
- `addStop` pasa el texto por `parseCoordinates()` antes de guardar.

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
- Links de Waze (`waze.com/ul?ll=...`)
- Links de Google Maps (`@lat,lng`, `?q=lat,lng`, `/place/.../lat,lng`)
- Retorna `null` si es texto plano sin coordenadas

## Restricciones
- No agregar librerías innecesarias.
- No implementar abstracciones prematuras.
- Priorizar simplicidad sobre elegancia.
- Idioma de la UI: **español** (Costa Rica).
- No editar manualmente archivos en `components/ui/` (son de shadcn).
