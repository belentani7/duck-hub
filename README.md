# duck-hub

Centro del ecosistema Duck.

## Qué es

El punto de entrada al universo Duck: agrupa los proyectos, su estado y sus enlaces. Astro
como base, con islas interactivas donde hacen falta.

## Stack

- **Astro** — sitio (`astro.config.mjs`)
- **TypeScript** — tipado
- **Drizzle** — datos (`drizzle.config.ts`)
- **Tailwind + shadcn/ui** — interfaz

## Puesta en marcha

```bash
pnpm install
pnpm dev
```

## Licencia

Código bajo licencia MIT; ver [LICENSE](./LICENSE).


## Entrega web real — GitHub Pages (2026)

La aplicación pública Duck Hub tiene cuatro rutas Astro: misión (`/`), hub operativo (`/hub/`), catálogo (`/catalog/`) y herramientas (`/ferramentas/`). Las páginas conservan idioma múltiple, navegación, consolas y efectos visuales propios. La rama de release corrige el flujo de GitHub Pages para compilar **`dist/public`** con Astro; publicar la raíz de Git no generaba el producto.

En proyecto Pages, los enlaces se resuelven bajo `/duck-hub/`, mientras que un backend propio permanece en `/`. Los recursos antiguos referenciados mediante `/manus-storage/` no estaban en este repositorio; en vez de dejar imágenes rotas, `VisualObject.astro` presenta un recurso DUCK local `public/duck-signal.svg` y preserva el identificador original como metadato. La sustitución no implica recuperar imágenes privadas originales.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm astro:check
GITHUB_ACTIONS=true pnpm exec astro build
node scripts/verify-pages.mjs
```

GitHub Pages aloja únicamente la interfaz estática; no proporciona automáticamente autenticación, almacenamiento SQL, APIs protegidas ni confirmación de pagos. Las funciones de servidor necesitan implementación, variables de entorno y despliegue propio. La publicación real requiere tests verdes y configuración autorizada de GitHub Pages.
