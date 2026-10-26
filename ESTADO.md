# ESTADO del proyecto — KSA Taller

**Fecha:** 26 oct 2026  
**Versión app:** 0.1.0  
**Fase actual:** Fase 1 (tablero + inventario) — código listo; pendiente conectar Supabase  
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
| Migraciones SQL Supabase | Escritas en `backend/migrations/`; **no aplicadas aún** |
| `.env.local` en `frontend/` | Pendiente |
| Usuarios Auth + roles | Pendiente |
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

---

## Pendiente inmediato

1. Ejecutar migraciones en Supabase SQL Editor.
2. `frontend/.env.local` con URL + anon key.
3. Crear usuarios y promover `admin`.
4. `cd frontend && npm run dev`
5. Vercel: Root Directory = `frontend`.

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
