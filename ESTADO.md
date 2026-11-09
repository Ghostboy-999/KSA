# ESTADO del proyecto — KSA Taller

**Fecha:** 9 nov 2026  
**Versión app:** 0.2.0 (se ve al pie de cada pantalla, con el commit y la fecha de publicación)  
**Fase actual:** Fase 1 completa y desplegada en https://ksa-taller.vercel.app; portal de clientes (Fase 3) desplegado, pendiente de configurar Auth/SMTP en Supabase  
**Estructura:** monorepo `backend/` + `frontend/`

---

## Estructura del repo

```text
KSA/
├── backend/
│   ├── migrations/     # 001–009 SQL Supabase
│   ├── setup_completo.sql  # 001–009 concatenadas (proyecto vacío)
│   └── README.md
├── frontend/           # App Vite React (src, public, package.json…)
│   └── README.md
├── ESTADO.md
└── README.md
```

---

## Resumen

| Área | Estado |
|------|--------|
| Separación backend / frontend | Hecho |
| Identidad visual (logo, colores negro/amarillo/verde, iconos PWA) | Hecho |
| Frontend React + Vite + TS + Tailwind + PWA | Hecho (en `frontend/`) |
| Migraciones SQL Supabase | 001–009 aplicadas en `eylefnchunsywabgdzhy` |
| Inconvenientes por orden (reportar / resolver / aviso a gerencia) | Hecho (9 nov) |
| Portal de clientes: registro, mis órdenes, solicitudes con fotos; gerencia las convierte en orden | Desplegado (9 nov, PR #6); no funciona para clientes hasta configurar Auth/SMTP en Supabase |
| Animaciones y estados de carga (pantalla de carga con logo, esqueletos, transiciones) | Desplegado (9 nov, PR #7) |
| Arreglo "Cuenta inactiva" falso al iniciar sesión | Desplegado (9 nov, PR #7) |
| Rediseño visual (tipografía Barlow, cabecera con pestañas, barra inferior en celular, tarjetas con prioridad en el borde, pantalla de carga con chispas) | Desplegado (9 nov, PR #8) |
| Actualización automática de la app instalada (PWA) y versión visible | Desplegado (9 nov, PR #8) |
| Proyecto Supabase | `eylefnchunsywabgdzhy` — activo (reactivado el 9 nov tras pausa por inactividad del plan gratuito) |
| `backend/setup_completo.sql` | Hecho |
| `.env.local` en `frontend/` | URL + publishable key (local, no se sube) |
| Usuarios Auth + roles | Una sola cuenta: admin `davidcopete123@gmail.com` (David Torres). El 9 nov quedó como `gerente` sin ningún admin; se restauró `admin` desde SQL. Desde la migración 009 la base de datos impide quedarse sin admin activo |
| Deploy Vercel (proyecto `ksa-taller`, root dir = `frontend`) | Hecho — https://ksa-taller.vercel.app, se despliega solo al fusionar en `main`; protección estándar (producción abierta, vistas previas con login de Vercel) |
| Fase 2 | No iniciada |
| Fase 3 | Portal de clientes hecho; WhatsApp y cotizaciones sin iniciar |

---

## Stack

- **Frontend:** React 19, Vite 8, TypeScript, Tailwind 4, react-router-dom, supabase-js, vite-plugin-pwa
- **Backend:** Supabase (Auth, Postgres, RLS, Realtime, Storage)
- **Roles:** `admin`, `gerente`, `trabajador` (equipo) y `cliente` (se registra solo; rol por defecto de toda cuenta nueva)

---

## Implementado

### Frontend (`frontend/src/`)

- Login, shell por rol, tablero Kanban/lista, detalle OT, nueva OT, inventario, admin usuarios
- Portal de clientes (`/registro`, portal en cualquier ruta para rol `cliente`) y página `/solicitudes` para gerencia; "Crear orden" desde una solicitud precarga la orden y la marca aceptada
- Inconvenientes: botón "Reportar inconveniente" en cada orden, aviso arriba para gerencia/admin, insignia en las tarjetas del tablero y página `/inconvenientes` para resolver
- Diseño: Barlow / Barlow Condensed (incluidas en la app, funcionan sin conexión), tokens en `src/index.css` con capas `base` y `components`, `.panel`, `.segmented`, botones con relieve; cabecera con pestañas en escritorio y barra inferior con íconos en celular (`components/layout/AppShell.tsx`); fechas legibles (`lib/format.ts`); selector de fotos en español (`components/ui/PhotoPicker.tsx`)
- Actualización automática (`lib/pwa.ts`, `components/ui/UpdateBanner.tsx`): busca versión nueva cada 5 min y al volver a la pestaña; recarga sola al abrir o si la pestaña está en segundo plano, y si no muestra "Actualizar". Versión visible: `components/ui/AppVersion.tsx`
- Usuarios: la propia fila no permite cambiar rol ni desactivarse
- Movimiento y carga (`src/index.css`, `components/ui/Loading.tsx`, `lib/motion.ts`, `hooks/useMinDuration.ts`): bienvenida de al menos 1,4 s al abrir; esqueletos visibles al menos 0,6–0,7 s: pantalla de carga con el logo y la franja de seguridad animada, esqueletos con brillo, entrada de páginas, aparición en cascada, botones con spinner, tarjetas que se elevan, contadores que saltan. Solo CSS; se desactiva con *reducir movimiento*
- Sesión: `ProtectedRoute` muestra la carga hasta tener el perfil, y un error con Reintentar/Salir si falla (ya no "Cuenta inactiva" falso)
- Realtime, PWA, fotos opcionales
- Marca KSA: logo en `public/logo-ksa.png`, favicon e iconos PWA generados del logo, paleta en `src/index.css` (`ksa-black`, `ksa-yellow` #FFE000, `ksa-green` #009A1E) y franja de seguridad `.hazard-stripe`

### Backend (`backend/migrations/`)

1. `001_schema.sql`
2. `002_rls.sql`
3. `003_triggers.sql`
4. `004_views_seed.sql`
5. `005_security_fixes.sql` — evita que un usuario se haga admin solo; vistas respetan RLS
6. `006_function_privileges.sql` — funciones internas fuera de la API pública
7. `007_order_issues.sql` — inconvenientes por orden; el trabajador reporta, gerencia resuelve
8. `008_client_portal.sql` — portal de clientes; **las cuentas nuevas entran como `cliente`** (el admin sube de rol al equipo)
9. `009_keep_admin.sql` — siempre queda al menos un admin activo; nadie cambia su propio rol ni se desactiva

`setup_completo.sql` concatena 001–009 para instalar en un proyecto vacío.
En `eylefnchunsywabgdzhy`, 005 y 006 se aplicaron desde el SQL Editor: no salen en el historial de migraciones de Supabase, pero sus cambios están verificados en la base.

### Datos actuales (9 nov 2026)

1 perfil (admin), 4 materiales (seed de aceros), 0 órdenes, 0 clientes, 0 solicitudes, 0 inconvenientes.

---

## Pendiente inmediato

1. Supabase Auth para el portal de clientes: activar *Allow new users to sign up*, dejar *Confirm email* activado, *Site URL* = `https://ksa-taller.vercel.app` y configurar SMTP propio (ver `backend/README.md`).
2. Crear al resto del equipo desde Authentication (entran como `cliente`) y subirles el rol en la pantalla Usuarios.
3. Activar *Leaked password protection* en Authentication (aviso del advisor).
4. Probar en producción: login (pantalla de carga, sin "Cuenta inactiva"), inconvenientes en tiempo real, registro de cliente y solicitud con fotos. Si se ve la versión vieja, recargar con Ctrl + Shift + R (caché de la PWA).
5. Revisar la función `rls_auto_enable` (no viene de nuestras migraciones; `anon` puede ejecutarla).
6. Plan gratuito de Supabase: el proyecto se pausa tras ~1 semana sin uso.

### Calidad del código (9 nov 2026)

- `npm run build` OK; aviso de bundle JS de 546 kB / 154 kB gzip (conviene code-splitting por ruta).
- `npm run lint`: 0 errores, 11 avisos (`set-state-in-effect`, memoización del React Compiler, `exhaustive-deps` en `OrderDetailPage`).
- Sin tests.

---

## Historial de cambios (PRs fusionados)

| PR | Fecha | Cambio |
|----|-------|--------|
| #1, #2 | 26 oct | Conexión a Supabase, cierre de escaladas de rol, migración 006 |
| #3 | 9 nov | `ESTADO.md` al día tras reactivar Supabase |
| #4 | 9 nov | Inconvenientes por orden (migración 007) |
| #5 | 9 nov | `vercel.json`: rutas de la SPA y `sw.js` sin caché |
| #6 | 9 nov | Portal de clientes (migración 008) |
| #7 | 9 nov | Animaciones y carga, arreglo de "Cuenta inactiva", `ESTADO.md` |
| #8 | 9 nov | Rediseño visual, carga más animada, actualización automática, versión visible, protección de la propia cuenta |
| #9 | 9 nov | Migración 009: la base de datos impide quedarse sin admin |

---

## Verificar

```bash
cd frontend
npm install
npm run build
```

---

## Fases siguientes

**Fase 2:** calidad, reprocesos, garantía, indicadores.  
**Fase 3:** WhatsApp (Edge Functions), cotizaciones (vista cliente ya hecha).

### Propuesta *Ideas_KSA* (orden acordado)

1. ~~Inconvenientes~~ — hecho.
2. Campos que faltan: fechas de recepción e inicio, unidades y precio de venta en la orden; código, precio unitario y ubicación del material.
3. Panel del CEO: órdenes activas/retrasadas, alertas, ingresos frente a costo de materiales.
4. Control de tiempo: iniciar / pausar / finalizar e historial del trabajador.
5. Reportes PDF/Excel y métricas.
6. Cronograma y proveedores con pedidos.

Decisiones pendientes antes del punto 2: cómo registrar ingresos (solo precio de venta o también abonos/saldo), cómo calcular la mano de obra (horas × tarifa o valor fijo) y si un inconveniente pausa la orden.
