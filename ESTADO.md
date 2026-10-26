# ESTADO del proyecto — KSA Taller

**Fecha:** 26 oct 2026  
**Versión app:** 0.1.0  
**Fase actual:** Fase 1 (tablero + inventario) — código listo; pendiente conectar Supabase en producción/local

---

## Resumen

Plataforma de órdenes de trabajo e inventario para **Servicios Industriales KSA S.A.S.** (taller metalmecánico, Cali).  
Objetivo: reemplazar la orden verbal/WhatsApp con un registro compartido.

| Área | Estado |
|------|--------|
| Frontend React + Vite + TS + Tailwind + PWA | Hecho (build OK) |
| Migraciones SQL Supabase | Escritas; **no aplicadas aún en el proyecto del usuario** |
| `.env.local` con keys reales | Pendiente |
| Usuarios Auth + roles | Pendiente |
| Deploy Vercel | Pendiente |
| Fase 2 (calidad / garantía) | No iniciada |
| Fase 3 (WhatsApp / cliente) | No iniciada (huecos preparados) |

---

## Stack

- **Frontend:** React 19, Vite 8, TypeScript, Tailwind CSS 4, react-router-dom, supabase-js, vite-plugin-pwa
- **Backend:** Supabase (Auth, Postgres, RLS, Realtime, Storage)
- **Deploy previsto:** Vercel
- **Roles Fase 1:** `admin`, `gerente`, `trabajador`, `cliente` (vista cliente bloqueada)

---

## Qué está implementado en código

### Frontend (`src/`)

- Login (email/contraseña)
- Shell con navegación por rol
- Tablero Kanban + lista; avance de etapa; carga del taller
- Detalle de orden: materiales, asignación, historial, foto opcional
- Nueva OT (gerente/admin)
- Inventario: stock, mínimos, faltantes, ingreso de stock
- Admin de usuarios (cambiar rol / activar)
- Realtime en órdenes e inventario
- PWA (manifest + service worker en build)

### SQL (`supabase/migrations/`)

1. `001_schema.sql` — tablas, enums, bucket `order-photos`
2. `002_rls.sql` — RLS, helpers de rol, trigger de perfil al crear usuario
3. `003_triggers.sql` — `order_events`, stock, bloqueo a `en_taller` sin material
4. `004_views_seed.sql` — vistas `order_shortages` / `materials_below_min`, Realtime, seed aceros

### Tablas diseñadas

`profiles`, `clients`, `suppliers`, `materials`, `orders`, `order_events`, `order_materials`, `stock_movements`

### Decisiones de producto

- Fotos de pieza: **opcionales**
- Datos: **desde cero** (sin migración Excel)
- `gerente` cubre ventas/compras en Fase 1
- Solo **anon key** en el cliente; nunca `service_role`

---

## Pendiente inmediato (operación)

1. Ejecutar las 4 migraciones en el SQL Editor de Supabase (en orden).
2. Copiar `.env.example` → `.env.local` y pegar URL + anon key.
3. Crear usuarios en Authentication → Users.
4. Promover el primer `admin` con SQL (ver `README.md`).
5. `npm run dev` y probar login + tablero.
6. Deploy en Vercel con las mismas variables `VITE_*`.

---

## Cómo verificar salud del repo

```bash
npm install
npm run build   # última corrida: OK (tsc + vite + PWA)
```

---

## Fases siguientes (no construidas)

**Fase 2:** checklist de calidad, reprocesos con causa, certificado de garantía, indicadores.  
**Fase 3:** aviso de estado al cliente (WhatsApp / Edge Functions), seguimiento de cotizaciones, proveedores alternos, vista `cliente`.

---

## Riesgos abiertos

- **Adopción:** si el gerente sigue cerrando órdenes por WhatsApp, la app no reemplaza el proceso.
- **RLS:** hay que probar con cada rol tras aplicar migraciones.
- **PWA icons:** `pwa-192.png` / `pwa-512.png` son placeholders mínimos; conviene reemplazarlos por iconos reales de marca.
- **Chunk JS ~500 KB:** aceptable en Fase 1; code-split si el taller nota lentitud en móvil.

---

## Archivos de referencia

- `README.md` — setup detallado
- `.env.example` — variables requeridas
- `ESTADO.md` — este archivo (estado vivo del proyecto)
