# Backend — KSA Taller (Supabase)

Postgres, Auth, RLS, Realtime y Storage viven en **Supabase**. Este directorio guarda el SQL que debes aplicar al proyecto.

Proyecto: `eylefnchunsywabgdzhy` — https://eylefnchunsywabgdzhy.supabase.co

## Instalación rápida

Pega **todo** [`setup_completo.sql`](setup_completo.sql) en Supabase → **SQL Editor** → **Run**, una sola vez en un proyecto vacío. Contiene las migraciones 001–009 en orden.

## Migraciones

Si prefieres aplicarlas una a una, **en este orden**:

1. `migrations/001_schema.sql` — tablas, enums, bucket de fotos
2. `migrations/002_rls.sql` — RLS, roles, trigger de perfil
3. `migrations/003_triggers.sql` — historial, stock, bloqueo a `en_taller`
4. `migrations/004_views_seed.sql` — vistas de faltantes, Realtime, seed de aceros
5. `migrations/005_security_fixes.sql` — rol fijo `trabajador` al registrarse, solo admin cambia rol/estado, vistas con `security_invoker`
6. `migrations/006_function_privileges.sql` — las funciones de triggers y los helpers de RLS no se pueden llamar por `/rest/v1/rpc` (helpers solo para `authenticated`)
7. `migrations/007_order_issues.sql` — inconvenientes por orden (`order_issues`): el equipo reporta, gerencia resuelve; Realtime activado
8. `migrations/008_client_portal.sql` — portal de clientes: toda cuenta nueva entra como `cliente`, vínculo cuenta↔ficha por correo confirmado (`claim_client_account`), órdenes del cliente vía `client_orders()`, tabla `client_requests` y bucket privado `request-photos`
9. `migrations/009_keep_admin.sql` — siempre queda al menos un admin activo (también desde el SQL Editor) y nadie cambia su propio rol ni se desactiva desde la app

Si cambias una migración, regenera `setup_completo.sql` (concatenación de `migrations/00*.sql`).

## Auth

- Provider: Email / Password
- **Allow new users to sign up: activado** (los clientes se registran desde `/registro`)
- **Confirm email: activado — obligatorio.** La cuenta de un cliente se une a su ficha por correo; sin confirmación, cualquiera podría registrarse con el correo de otro cliente y ver sus órdenes
- URL Configuration: *Site URL* = `https://ksa-taller.vercel.app` (el enlace del correo de confirmación lleva ahí)
- SMTP propio (Authentication → Emails → SMTP Settings): el correo por defecto de Supabase tiene un límite muy bajo y solo entrega a los miembros del equipo del proyecto; para clientes reales hace falta un proveedor (Resend, SendGrid, Brevo…)
- El trigger crea `profiles` con rol `cliente` (el rol enviado en metadata se ignora)
- Crear usuario del equipo: Authentication → Users → **Add user** → *Create new user*, marcando **Auto Confirm User**; luego el admin le cambia el rol en la pantalla Usuarios
- Solo un admin puede cambiar `role` o `active`; desde el SQL Editor sí se puede, para el primer admin
- Promover admin:

```sql
update public.profiles
set role = 'admin', full_name = 'Admin KSA'
where id = (select id from auth.users where email = 'davidcopete123@gmail.com');
```

## Seguridad

- El frontend solo usa la **anon key**
- El bucket `order-photos` es público: cualquiera con el enlace de una foto puede verla
- Nunca expongas la **service_role** key en el cliente ni en Vercel como variable pública `VITE_*`

## Tablas

`profiles`, `clients`, `suppliers`, `materials`, `orders`, `order_events`, `order_materials`, `stock_movements`, `order_issues`, `client_requests`

Vistas: `order_shortages`, `materials_below_min`
