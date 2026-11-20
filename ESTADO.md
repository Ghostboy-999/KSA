# ESTADO del proyecto — KSA Taller

**Fecha:** 20 nov 2026  
**Versión app:** 0.3.1 (se ve al pie de cada pantalla, con el commit y la fecha de publicación)  
**Fase actual:** Fase 1 completa y desplegada en https://ksa-taller.vercel.app; portal de clientes (Fase 3) desplegado y probado con registro real (sin confirmación de correo, solo para la demostración)  
**Estructura:** monorepo `backend/` + `frontend/`

---

## Estructura del repo

```text
KSA/
├── backend/
│   ├── migrations/     # 001–011 SQL Supabase
│   ├── setup_completo.sql  # 001–011 concatenadas (proyecto vacío)
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
| Migraciones SQL Supabase | 001–011 aplicadas en `eylefnchunsywabgdzhy` |
| Inconvenientes por orden (reportar / resolver / aviso a gerencia) | Hecho (9 nov) |
| Portal de clientes: registro, mis órdenes, solicitudes con fotos; gerencia las convierte en orden | Desplegado (9 nov, PR #6); no funciona para clientes hasta configurar Auth/SMTP en Supabase |
| Animaciones y estados de carga (pantalla de carga con logo, esqueletos, transiciones) | Desplegado (9 nov, PR #7) |
| Arreglo "Cuenta inactiva" falso al iniciar sesión | Desplegado (9 nov, PR #7) |
| Rediseño visual (tipografía Barlow, cabecera con pestañas, barra inferior en celular, tarjetas con prioridad en el borde, pantalla de carga con chispas) | Desplegado (9 nov, PR #8) |
| Actualización automática de la app instalada (PWA) y versión visible | Desplegado (9 nov, PR #8) |
| Carga propia en cada acción (salir, entrar, agregar material, asignar, subir foto, ingresar stock, roles) y errores de acceso en español | Desplegado (9 nov, PR #9) |
| Pantallas "PROPUESTO" del Figma *Mockups digitales KSA Taller*: 01 Bienvenida, 03 Menú por rol, 05 Calendario, 06 Indicadores, 08 Prueba hidráulica | Hechas (20 nov, versión 0.3.0) |
| Proyecto Supabase | `eylefnchunsywabgdzhy` — activo (reactivado el 9 nov y el 20 nov tras pausas por inactividad del plan gratuito; la reactivación tarda ~5 min) |
| `backend/setup_completo.sql` | Hecho |
| `.env.local` en `frontend/` | URL + publishable key (local, no se sube) |
| Usuarios Auth + roles | 3 cuentas: admin `davidcopete123@gmail.com` (David Torres), un trabajador (`sergei@gmail.com`, registrado y subido de rol desde Usuarios) y un cliente de prueba (`empty@gmail.com`, registrado desde la app y vinculado a su ficha). El 9 nov la cuenta admin quedó como `gerente`; se restauró desde SQL y desde la migración 009 la base de datos impide quedarse sin admin activo |
| Deploy Vercel (proyecto `ksa-taller`, root dir = `frontend`) | Hecho — https://ksa-taller.vercel.app, se despliega solo al fusionar en `main`; protección estándar (producción abierta, vistas previas con login de Vercel) |
| Fase 2 | Iniciada: prueba hidráulica con reproceso e indicadores; garantía sin iniciar |
| Fase 3 | Portal de clientes hecho y probado de punta a punta (cliente → solicitud → orden); WhatsApp y cotizaciones sin iniciar |

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
- Calendario (`pages/CalendarPage.tsx`, `/calendario`, todo el equipo): mes con las fechas compromiso (negro, rojo si venció, anillo amarillo hoy), tocar un día filtra, lista de entregas próximas
- Indicadores (`pages/IndicatorsPage.tsx`, `/indicadores`, gerencia): % entregadas a tiempo (evento de entrega ≤ fecha compromiso), % de órdenes activas sin faltantes, reprocesos por cada 100 órdenes probadas y días promedio por etapa con el cuello de botella; avisa "Pocos datos aún" con menos de 5 entregas. Calculado en el navegador, sin datos inventados
- Prueba hidráulica (`components/orders/PressureTestCard.tsx`, `hooks/useOrderTests.ts`): en el detalle de una orden en *Pruebas*, checklist de 4 puntos → PSI → aprobó / no aprobó → reproceso; al registrarla la base mueve la orden. En el tablero, las órdenes en Pruebas muestran "Registrar prueba" en vez de saltar a Lista
- Bienvenida (mockup 01) en la primera visita a `/login` (se recuerda en el navegador)
- Navegación (`components/layout/navItems.tsx`): en celular la barra inferior es Tablero · Inventario · Calendario · Menú, y `/menu` (mockup 03) tiene el resto según el rol y Cerrar sesión; en pantallas de 1024 px o más, pestañas arriba
- Menús desplegables propios (`components/ui/Select.tsx`) en lugar del `<select>` del navegador: en celular se abren como hoja inferior y en pantallas anchas como panel flotante; buscador con más de 7 opciones, descripción por opción (permisos de cada rol, stock de cada material), color por prioridad, teclado completo y validación `required`. Usados en Nueva orden, Usuarios, detalle de orden, Inventario e Inconvenientes
- Pantallas cargadas por partes (`React.lazy` en `App.tsx` y el portal de clientes en `ProtectedRoute`)
- Usuarios: la propia fila no permite cambiar rol ni desactivarse
- Cada acción tiene su carga: pantalla de despedida al salir (`signingOut` en `AuthContext`), carga al entrar, botones con spinner, fotos con esqueleto hasta descargar (`components/ui/FadeImage.tsx`), listas de la nueva orden con "Cargando…"
- Errores de Supabase Auth traducidos y con qué hacer (`lib/authErrors.ts`); registrarse con un correo ya usado avisa "Ya hay una cuenta con ese correo" (Supabase no devuelve error en ese caso)
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
10. `010_lock_rls_auto_enable.sql` — `rls_auto_enable()` (función de Supabase) fuera de `/rest/v1/rpc`
11. `011_order_tests.sql` — `order_tests`: prueba hidráulica por orden; aprobada → `lista`, no aprobada → `en_taller` (o `materiales` si faltan); solo quien puede mover la orden la registra, y solo en *Pruebas*

`setup_completo.sql` concatena 001–011 para instalar en un proyecto vacío.
En `eylefnchunsywabgdzhy`, 005 y 006 se aplicaron desde el SQL Editor: no salen en el historial de migraciones de Supabase (que muestra 9 entradas: 001–004, `order_issues`, `client_portal`, `keep_admin`, `lock_rls_auto_enable`, `order_tests`), pero sus cambios están verificados en la base.

### Datos actuales (20 nov 2026)

3 perfiles (1 admin, 1 trabajador, 1 cliente), 1 cliente, 4 materiales (seed de aceros), 2 órdenes, 2 solicitudes de cliente (ambas aceptadas y convertidas en orden), 2 inconvenientes. Todo son datos de prueba.

---

## Pendiente inmediato

1. **"Confirm email" está DESACTIVADO desde el 9 nov para la demostración** (el registro funciona sin SMTP). Volver a activarlo antes de usar con clientes reales: con él apagado, alguien podría registrarse con el correo de otro cliente y ver sus órdenes.
2. Supabase Auth para el portal de clientes: activar *Allow new users to sign up*, dejar *Confirm email* activado, *Site URL* = `https://ksa-taller.vercel.app` y **configurar SMTP propio** (ver `backend/README.md`). Sin SMTP propio el registro falla para cualquier correo que no sea de un miembro del equipo en Supabase (probado el 9 nov con un correo de Gmail).
3. Crear al resto del equipo desde Authentication (entran como `cliente`) y subirles el rol en la pantalla Usuarios.
4. Activar *Leaked password protection* en Authentication (aviso del advisor).
5. Probar en producción: login (pantalla de carga, sin "Cuenta inactiva"), inconvenientes en tiempo real, registro de cliente y solicitud con fotos. Si se ve la versión vieja, recargar con Ctrl + Shift + R (caché de la PWA).
6. Plan gratuito de Supabase: el proyecto se pausa tras ~1 semana sin uso.

### Calidad del código (20 nov 2026)

- `npm ci` y `npm run build` OK, sin el aviso de 500 kB: cada pantalla es un archivo aparte; el más grande es el de supabase-js y React (~290 kB / 91 kB gzip).
- `npm run lint`: 0 errores, 11 avisos (`set-state-in-effect` en las cargas de datos, memoización del React Compiler). Se corrigió el `exhaustive-deps` de `OrderDetailPage`.
- Avisos de seguridad de Supabase: quedan los helpers de RLS (`is_staff`, `is_manager`… necesarios para `authenticated`) y *Leaked password protection*.
- Sin tests automáticos en el repositorio. Las pruebas de navegador (Playwright con la API simulada) se han hecho fuera del repo; conviene añadirlas a `frontend/`.

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
| #9 | 9 nov | Migración 009 (siempre queda un admin), carga en cada acción, errores de acceso en español |
| #10 | 20 nov | Aviso al registrarse con un correo que ya tiene cuenta |
| #11 | 20 nov | `ESTADO.md`: cuentas y datos actuales, segunda reactivación de Supabase |
| #12 | 20 nov | `ESTADO.md`: revisión general (build, migraciones, datos, tests) |
| #14 | 20 nov | Menús desplegables con la marca KSA (0.3.1) |
| #13 | 20 nov | Migraciones 010–011, calendario, indicadores, prueba hidráulica, bienvenida, menú por rol, carga por partes (0.3.0) |

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
1b. ~~Calendario, indicadores y prueba hidráulica de los mockups~~ — hecho (20 nov).
2. Campos que faltan: fechas de recepción e inicio, unidades y precio de venta en la orden; código, precio unitario y ubicación del material.
3. Panel del CEO: órdenes activas/retrasadas, alertas, ingresos frente a costo de materiales (los indicadores operativos ya están en `/indicadores`; falta la parte de dinero).
4. Control de tiempo: iniciar / pausar / finalizar e historial del trabajador.
5. Reportes PDF/Excel y métricas.
6. Cronograma y proveedores con pedidos.

Decisiones pendientes antes del punto 2: cómo registrar ingresos (solo precio de venta o también abonos/saldo), cómo calcular la mano de obra (horas × tarifa o valor fijo) y si un inconveniente pausa la orden.
