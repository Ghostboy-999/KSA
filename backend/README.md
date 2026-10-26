# Backend — KSA Taller (Supabase)

Postgres, Auth, RLS, Realtime y Storage viven en **Supabase**. Este directorio guarda el SQL que debes aplicar al proyecto.

## Migraciones

Ejecuta en el **SQL Editor** de Supabase, **en este orden**:

1. `migrations/001_schema.sql` — tablas, enums, bucket de fotos
2. `migrations/002_rls.sql` — RLS, roles, trigger de perfil
3. `migrations/003_triggers.sql` — historial, stock, bloqueo a `en_taller`
4. `migrations/004_views_seed.sql` — vistas de faltantes, Realtime, seed de aceros

## Auth

- Provider: Email / Password
- Al crear un usuario en Authentication, el trigger crea `profiles` con rol `trabajador`
- Promover admin:

```sql
update public.profiles
set role = 'admin', full_name = 'Admin KSA'
where id = (select id from auth.users where email = 'TU_CORREO@empresa.com');
```

## Seguridad

- El frontend solo usa la **anon key**
- Nunca expongas la **service_role** key en el cliente ni en Vercel como variable pública `VITE_*`

## Tablas

`profiles`, `clients`, `suppliers`, `materials`, `orders`, `order_events`, `order_materials`, `stock_movements`

Vistas: `order_shortages`, `materials_below_min`
