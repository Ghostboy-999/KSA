# KSA Taller

Plataforma de **órdenes de trabajo e inventario** para Servicios Industriales KSA S.A.S. (Cali).

```text
KSA/
├── backend/          # SQL Supabase (schema, RLS, triggers, vistas)
│   └── migrations/
├── frontend/         # React + Vite + TypeScript + Tailwind + PWA
├── ESTADO.md         # Estado vivo del proyecto
└── README.md
```

## Arranque rápido

### 1. Backend (Supabase)

Aplica las migraciones en orden — ver [`backend/README.md`](backend/README.md).

### 2. Frontend

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Detalle: [`frontend/README.md`](frontend/README.md).

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React, Vite, TypeScript, Tailwind, supabase-js, PWA |
| Backend | Supabase (Auth, Postgres, RLS, Realtime, Storage) |
| Deploy | Vercel (`frontend/`) |

## Roles (Fase 1)

`admin` · `gerente` · `trabajador` · `cliente` (reservado Fase 3)
