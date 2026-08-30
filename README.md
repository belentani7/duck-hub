# DUCK HUB — centro de producción Duck Studio

Hub full-stack del ecosistema Duck (consolidado desde `Duck-Omega`, verificado 2026-08-30).

**Stack:** Astro 5 + Vite + Express + tRPC + Drizzle (MySQL) · Node ≥ 20 · pnpm

## Contenido

- Frontend Astro (4 rutas) con UI del catálogo de apps: OMEGA-79, ZION-33, NOVA-7, ODIN-2, REX-20, iDUCK, SIM-22, ALPHA-77, FL STUDIO, STUDIO
- Backend Express + tRPC (`server/`), con módulo OAuth opcional
- Base de datos Drizzle (`drizzle/`, requiere MySQL solo si se usa persistencia)

## Arranque

```bat
pnpm install
pnpm build
pnpm start
```
→ http://localhost:3000 (producción: sirve el frontend compilado).

Desarrollo: `pnpm dev`

## Reparaciones ya aplicadas

- Scripts Windows-compatible (`cross-env`) — antes usaban sintaxis Unix que fallaba en Windows.
- `pnpm.onlyBuiltDependencies` para `esbuild` y `@tailwindcss/oxide`.
- Verificado: build OK y servidor respondiendo 200.

## Notas

- Login OAuth: requiere variable de entorno `OAUTH_SERVER_URL` (opcional; sin ella el sitio funciona igual).
- Sin `.env` comprometido: solo existe `.env.example`.
