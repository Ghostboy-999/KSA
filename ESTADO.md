# ESTADO del proyecto — KSA Taller

**Fecha:** 9 nov 2026  
**Versión app:** 0.1.0  
**Fase actual:** Fase 1 completa y desplegada en https://ksa-taller.vercel.app; portal de clientes (Fase 3) desplegado, pendiente de configurar Auth/SMTP en Supabase  
**Estructura:** monorepo `backend/` + `frontend/`

---

## Estructura del repo

```text
KSA/
├── backend/
│   ├── migrations/     # 001–008 SQL Supabase
│   ├── setup_completo.sql  # 001–008 concatenadas (proyecto vacío)
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
| Migraciones SQL Supabase | 001–008 aplicadas en `eylefnchunsywabgdzhy` |
| Inconvenientes por orden (reportar / resolver / aviso a gerencia) | Hecho (9 nov) |
| Portal de clientes: registro, mis órdenes, solicitudes con fotos; gerencia las convierte en orden | Desplegado (9 nov, PR #6); no funciona para clientes hasta configurar Auth/SMTP en Supabase |
| Proyecto Supabase | `eylefnchunsywabgdzhy` — activo (reactivado el 9 nov tras pausa por inactividad del plan gratuito) |
| `backend/setup_completo.sql` | Hecho |
| `.env.local` en `frontend/` | URL + publishable key (local, no se sube) |
| Usuarios Auth + roles | Una sola cuenta: `davidcopete123@gmail.com` (David Torres), hoy con rol **gerente** — no queda ningún admin (ver Pendiente) |
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

`setup_completo.sql` concatena 001–008 para instalar en un proyecto vacío.
En `eylefnchunsywabgdzhy`, 005 y 006 se aplicaron desde el SQL Editor: no salen en el historial de migraciones de Supabase, pero sus cambios están verificados en la base.

### Datos actuales (9 nov 2026)

1 perfil (gerente), 4 materiales (seed de aceros), 0 órdenes, 0 clientes, 0 solicitudes, 0 inconvenientes.

---

## Pendiente inmediato

1. Devolver el rol `admin` a `davidcopete123@gmail.com`: sin admin nadie ve la pantalla Usuarios ni puede cambiar roles. Solo se puede desde el SQL Editor (ver `backend/README.md`, "Promover admin").
2. Supabase Auth para el portal de clientes: activar *Allow new users to sign up*, dejar *Confirm email* activado, *Site URL* = `https://ksa-taller.vercel.app` y configurar SMTP propio (ver `backend/README.md`).
3. Crear al resto del equipo desde Authentication (entran como `cliente`) y subirles el rol en la pantalla Usuarios.
4. Activar *Leaked password protection* en Authentication (aviso del advisor).
5. Probar en producción: login, inconvenientes en tiempo real, registro de cliente y solicitud con fotos.
6. Revisar la función `rls_auto_enable` (no viene de nuestras migraciones; `anon` puede ejecutarla).
7. Plan gratuito de Supabase: el proyecto se pausa tras ~1 semana sin uso.

### Calidad del código (9 nov 2026)

- `npm run build` OK; aviso de bundle JS de 532 kB (conviene code-splitting por ruta).
- `npm run lint`: 0 errores, 11 avisos (`set-state-in-effect`, memoización del React Compiler, `exhaustive-deps` en `OrderDetailPage`).
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
**Fase 3:** WhatsApp (Edge Functions), cotizaciones (vista cliente ya hecha).

### Propuesta *Ideas_KSA* (orden acordado)

1. ~~Inconvenientes~~ — hecho.
2. Campos que faltan: fechas de recepción e inicio, unidades y precio de venta en la orden; código, precio unitario y ubicación del material.
3. Panel del CEO: órdenes activas/retrasadas, alertas, ingresos frente a costo de materiales.
4. Control de tiempo: iniciar / pausar / finalizar e historial del trabajador.
5. Reportes PDF/Excel y métricas.
6. Cronograma y proveedores con pedidos.

Decisiones pendientes antes del punto 2: cómo registrar ingresos (solo precio de venta o también abonos/saldo), cómo calcular la mano de obra (horas × tarifa o valor fijo) y si un inconveniente pausa la orden.
