# KSA Taller

Plataforma de **órdenes de trabajo e inventario** para Servicios Industriales KSA S.A.S. (Cali).

Stack: React + Vite + TypeScript + Tailwind CSS + Supabase + PWA → deploy en Vercel.

## 1. Base de datos (Supabase)

En el SQL Editor de tu proyecto, ejecuta **en este orden**:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_rls.sql`
3. `supabase/migrations/003_triggers.sql`
4. `supabase/migrations/004_views_seed.sql`

Luego en **Authentication → Providers**: deja activo Email/Password.

### Usuarios iniciales

1. Crea usuarios en **Authentication → Users** (correo + contraseña).
2. El trigger crea el perfil con rol `trabajador` por defecto.
3. Promueve al administrador suplente:

```sql
update public.profiles
set role = 'admin', full_name = 'Admin KSA'
where id = (select id from auth.users where email = 'TU_CORREO@empresa.com');
```

4. Asigna el resto desde la app (`/usuarios`) o con SQL (`gerente`, `trabajador`).

## 2. Frontend local

```bash
cp .env.example .env.local
```

En Supabase → **Project Settings → API**, copia:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (nunca la `service_role`)

```bash
npm install
npm run dev
```

## 3. Deploy en Vercel

1. Conecta el repo o sube el proyecto.
2. Variables de entorno: las mismas `VITE_SUPABASE_*`.
3. Build: `npm run build` · Output: `dist`.

## Roles (Fase 1)

| Rol | Acceso |
|-----|--------|
| `admin` | Todo + usuarios |
| `gerente` | Tablero, crear OT, inventario, faltantes |
| `trabajador` | Sus órdenes / taller, cambiar etapa |
| `cliente` | Reservado (Fase 3) |

## Funciones clave

- Tablero Kanban + lista, avance de etapa en 1–2 toques.
- Bloqueo a `en_taller` si hay faltantes (trigger + vista `order_shortages`).
- Historial en `order_events`.
- Stock vía `stock_movements` (trigger actualiza `materials`).
- Realtime en órdenes e inventario.
- PWA instalable (vite-plugin-pwa).
- Fotos opcionales en Storage bucket `order-photos`.

## Fases siguientes (huecos listos)

- Fase 2: checklists de calidad, reprocesos, garantía, indicadores.
- Fase 3: aviso WhatsApp (Edge Functions), vista cliente, proveedores alternos.
