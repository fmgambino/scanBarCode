# SCAN-BARCODE® v2.2 — GitHub Pages

## Corrección de la pantalla README

El repositorio se estaba publicando con **Deploy from a branch**, por lo que GitHub Pages mostró el README en vez de la PWA: faltaba `index.html` en la raíz. Esta versión incorpora `index.html` raíz que redirige a `pwa/` y mantiene el workflow de publicación directa de `pwa/`.

### Actualización recomendada

1. Subí **el contenido de esta carpeta a la raíz del repositorio** (no la carpeta contenedora, ni el archivo ZIP). No subas `.git` de una copia local.
2. En GitHub → **Settings → Pages → Build and deployment → Source**, elegí **GitHub Actions**.
3. Verificá que se haya ejecutado el workflow **Publicar PWA en GitHub Pages** desde `main` o `dev`. Si no se ejecuta, abrí **Actions** y lanzalo con *Run workflow*.
4. Entrá a `https://fmgambino.github.io/scanBarCode/`. La app debe aparecer, no el README.
5. Si preferís conservar **Deploy from a branch**, elegí la carpeta **/(root)**: el `index.html` raíz redirigirá a `pwa/`. **No** selecciones `/docs` a menos que publiques allí.
6. Si aparece una versión vieja, cerrá las pestañas de la PWA, borrá los datos del sitio y recargá; se actualizó el nombre del caché del Service Worker.

### Componentes

- `pwa/`: aplicación mobile first instalable, iconos, footer institucional, lector QR/barras y asistente de vinculación.
- `extension/`: extensión Chrome MV3; cargar descomprimida desde `chrome://extensions`.
- `relay/`: Cloudflare Worker + Durable Object; necesario para la comunicación real entre móvil y PC.
- `.github/workflows/pages.yml`: despliegue de `pwa/` a GitHub Pages.
- `index.html`: entrada de compatibilidad para publicación desde la raíz del repositorio.

### Relay

```bash
cd relay
npm install
npx wrangler login
npx wrangler deploy
```

Configurá en la extensión el endpoint `wss://` del Worker desplegado y la dirección pública de la PWA. GitHub Pages **no ejecuta WebSockets ni Durable Objects**. No se necesita Supabase para esta arquitectura.

### Limitaciones

La lectura de cámara requiere HTTPS y navegador con `BarcodeDetector`; la extensión inserta en campos editables de páginas web compatibles, no en aplicaciones Windows nativas. La instalación PWA no puede forzarse en todos los navegadores. El sistema no fue validado con un despliegue real del relay ni con dos dispositivos físicos.

© 2026 SCAN-BARCODE® · Todos los derechos reservados — Desarrollado por Electrónica Gambino.
