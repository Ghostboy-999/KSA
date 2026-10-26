# ESTADO del proyecto — KSA Taller

**Fecha:** 26 oct 2026  
**Versión app:** 0.1.0  
**Fase actual:** Fase 1 (tablero + inventario) — código listo; conectando Supabase (`eylefnchunsywabgdzhy`)  
**Estructura:** monorepo `backend/` + `frontend/`

---

## Estructura del repo

```text
KSA/
├── backend/
│   ├── migrations/     # 001–004 SQL Supabase
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
| Migraciones SQL Supabase | 001–006 aplicadas en `eylefnchunsywabgdzhy` |
| Proyecto Supabase | `eylefnchunsywabgdzhy` |
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
- Realtime, PWA, fotos opcionales
- Marca KSA: logo en `public/logo-ksa.png`, favicon e iconos PWA generados del logo, paleta en `src/index.css` (`ksa-black`, `ksa-yellow` #FFE000, `ksa-green` #009A1E) y franja de seguridad `.hazard-stripe`

### Backend (`backend/migrations/`)

1. `001_schema.sql`
2. `002_rls.sql`
3. `003_triggers.sql`
4. `004_views_seed.sql`
5. `005_security_fixes.sql` — evita que un usuario se haga admin solo; vistas respetan RLS
6. `006_function_privileges.sql` — funciones internas fuera de la API pública

---

## Pendiente inmediato

1. Crear al resto del equipo desde Authentication (entran como `trabajador`) y asignar roles en la pantalla Usuarios.
2. Activar *Leaked password protection* en Authentication (aviso del advisor).
3. `cd frontend && npm run dev`
4. Vercel: Root Directory = `frontend`.

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
