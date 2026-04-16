# PROJECT_CONTEXT.md — RutasGPS

## 1. Resumen del Proyecto
**RutasGPS** es una aplicación web **Mobile-First** (PWA) construida en **Next.js 16** diseñada específicamente para optimizar rutas de entrega de paquetería en Costa Rica. La usuaria principal es una persona de 50 años que opera el sistema desde su celular durante el día, lo que exige una interfaz de **altísima accesibilidad**, botones grandes y flujos simplificados.

* **Repositorio:** `github.com/ccubero20/RutasGPS`
* **Despliegue:** Vercel (Hobby) con subdominio personalizado en Namecheap.
* **Idioma:** Español (CR).

---

## 2. Stack Tecnológico
* **Framework:** Next.js 16 (App Router + Turbopack).
* **Backend/Auth:** Supabase (PostgreSQL, Auth, RLS) mediante `@supabase/ssr`.
* **UI/Estilos:** Tailwind CSS v4 + componentes de `shadcn/ui`.
* **Estado:** Zustand con middleware `persist` (localStorage + Sync asíncrono con Supabase).
* **Lenguaje:** TypeScript.
* **APIs de Mapas:** OpenRouteService (ORS).

---

## 3. Arquitectura de Archivos
```text
app/
  layout.tsx                    → Shell mobile + SyncProvider (Auth/DB)
  page.tsx                      → Dashboard principal (Protegido por Middleware)
  login/                        → Página de Auth "Mom-Friendly"
  api/
    auth/                       → Route Handlers para Login/Signup/Logout
    optimize/route.ts           → TSP (VROOM)
    geocode/route.ts            → Autocomplete
components/
  LoginForm.tsx                 → UI de acceso con botones h-14
  SyncProvider.tsx              → Orquestador de hidratación DB <-> Local
  AddressForm.tsx               → Ingreso inteligente
  HomeConfig.tsx                → Configuración de Base/Casa
  RouteList.tsx                 → Lista de paradas + Waze/Maps
lib/
  supabase/                     → Clientes Server/Client para Supabase
  store.ts                      → Estado global reactivo con persistencia remota
  parsers.ts                    → Extracción de coordenadas
SUPABASE_CONFIG.md              → Guía de configuración del Backend
spec.md                         → Especificación técnica del Sprint actual
```

---

## 4. Funcionalidades Implementadas (Logros)
- **Autenticación Multi-usuario:** Sistema de Login/Signup persistente con "Recordar datos".
- **Persistencia en la Nube:** Las paradas y la configuración de "Home" se sincronizan automáticamente con PostgreSQL.
- **Migración Transparente:** Al iniciar sesión, los datos locales se migran a la nube sin pérdida de información.
- **Acceso Protegido:** Middleware que asegura que solo usuarios autenticados accedan al dashboard.
- **Diseño Mom-Friendly:** Interfaz optimizada para personas mayores (botones grandes, alta legibilidad).

---

## 5. Próximos Sprints (Roadmap)

### Sprint 1: Backend & Multiusuario
- Migración de `localStorage` a base de datos real (Supabase/PostgreSQL).
- Implementación de Login/Auth para permitir múltiples usuarios.
- Persistencia de rutas en la nube vinculadas al perfil de usuario.

### Sprint 2: Gestión de Estados y Notas
- **Estados de Entrega:** Cada parada tendrá estados: *Pendiente (default), Entregado, Cliente Rechazó (devolución)*.
- **Notas Editables:** Bloque colapsable por parada para agregar detalles del cliente sin invalidar la optimización.
- **UI de Estados:** Colores semánticos claros para identificar el progreso de la ruta de un vistazo.

### Sprint 3: Histórico y Reportes
- Vista de "Historial de Rutas" para consultar entregas de días anteriores.
- Reporte de rendimiento (tiempo total, paquetes entregados vs rechazados).

---

## 6. Reglas de Diseño "Mom-Friendly" (Innegociables)
1. **Áreas de Toque:** Botones con altura mínima `h-14` para facilitar el uso con una sola mano.
2. **Legibilidad:** Fuente base `text-lg`, títulos `text-xl`. Contraste máximo.
3. **Colores Semánticos:**
   - **Celeste (`bg-sky-500`):** Exclusivo para Waze.
   - **Verde Google (`bg-[#34A853]`):** Exclusivo para Google Maps.
   - **Rojo (`bg-red-600`):** Acciones destructivas (Eliminar).
   - **Naranja/Ámbar:** Estados de advertencia o "Por optimizar".
4. **Cero Distracciones:** Sin modo oscuro (uso diurno), sin animaciones innecesarias, flujo lineal de arriba hacia abajo.

---

## 7. Configuración de Agentes (Gemini CLI)
El proyecto utiliza una estructura de agentes orquestada por un **Project Manager (@pm)** que delega tareas a:
- **@architect:** Backend, DB y Seguridad.
- **@logic_engineer:** Algoritmos, Estado y Parsers.
- **@ux_ui_specialist:** Maquetación y Accesibilidad.

---

*Última actualización: 15 de abril de 2026*