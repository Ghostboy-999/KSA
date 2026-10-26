# Frontend — KSA Taller

App React + Vite + TypeScript + Tailwind + PWA.

## Setup

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

En `.env.local` (desde Supabase → Project Settings → API):

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build producción + PWA |
| `npm run preview` | Previsualizar `dist` |

## Deploy (Vercel)

- Root Directory: `frontend`
- Build: `npm run build`
- Output: `dist`
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
