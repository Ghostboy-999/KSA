# ESTADO del proyecto — KSA Taller

**Fecha:** 9 nov 2026  
**Versión app:** 0.1.0  
**Fase actual:** Fase 1 (tablero + inventario) — código listo y Supabase (`eylefnchunsywabgdzhy`) conectado; falta deploy  
**Estructura:** monorepo `backend/` + `frontend/`

---

## Estructura del repo

```text
KSA/
├── backend/
│   ├── migrations/     # 001–007 SQL Supabase
│   ├── setup_completo.sql  # 001–007 concatenadas (proyecto vacío)
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
| Migraciones SQL Supabase | 001–007 aplicadas en `eylefnchunsywabgdzhy` |
| Inconvenientes por orden (reportar / resolver / aviso a gerencia) | Hecho (9 nov) |
| Proyecto Supabase | `eylefnchunsywabgdzhy` — activo (reactivado el 9 nov tras pausa por inactividad del plan gratuito) |
| `backend/setup_completo.sql` | Hecho |
| `.env.local` en `frontend/` | URL + publishable key (local, no se sube) |
| Usuarios Auth + roles | Admin `davidcopete123@gmail.com` (David Torres) creado |
| Deploy Vercel (root dir = `frontend`) | Pendiente |
| Fase 2 / 3 | No iniciadas |

---

## Stack

- **Frontend:** React 19, Vite 8, TypeScript, Tailwind 4, react-router-dom, supabase-js, vite-plugin-pwa
- **Backend:** Supabase (Auth, Postgres, RLS, Realtime, Storage)
- **Roles Fase 1:** `admin`, `gerente`, `trabajador`, `cliente`

---

## Implementado

### Frontend (`frontend/src/`)

- Login, shell por rol, tablero Kanban/lista, detalle OT, nueva OT, inventario, admin usuarios
- Inconvenientes: botón "Reportar inconveniente" en cada orden, aviso arriba para gerencia/admin, insignia en las tarjetas del tablero y página `/inconvenientes` para resolver
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

`setup_completo.sql` concatena 001–007 para instalar en un proyecto vacío.
En `eylefnchunsywabgdzhy`, 005 y 006 se aplicaron desde el SQL Editor: no salen en el historial de migraciones de Supabase, pero sus cambios están verificados en la base.

### Datos actuales (9 nov 2026)

1 perfil (admin), 4 materiales (seed de aceros), 0 órdenes, 0 clientes.

---

## Pendiente inmediato

1. Crear al resto del equipo desde Authentication (entran como `trabajador`) y asignar roles en la pantalla Usuarios.
2. Activar *Leaked password protection* en Authentication (aviso del advisor).
3. `cd frontend && npm run dev`
4. Vercel: Root Directory = `frontend`.
5. Revisar la función `rls_auto_enable` (no viene de nuestras migraciones; `anon` puede ejecutarla).
6. Plan gratuito de Supabase: el proyecto se pausa tras ~1 semana sin uso.

### Calidad del código (9 nov 2026)

- `npm run build` OK; aviso de bundle JS de 504 kB (conviene code-splitting por ruta).
- `npm run lint`: 0 errores, 8 avisos (`set-state-in-effect`, memoización del React Compiler, `exhaustive-deps` en `OrderDetailPage`).
- Sin tests.

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
**Fase 3:** WhatsApp (Edge Functions), vista cliente, cotizaciones.
