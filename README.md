# ScanBridge 2.0 — PWA + extensión Chrome + relay

Escaneá códigos QR o de barras desde un celular y enviá el valor a un campo de texto en una pestaña de Chrome en tu PC.

## Arquitectura

- `pwa/`: sitio estático apto para **GitHub Pages**; no necesita PHP, compilación ni base de datos.
- `extension/`: extensión Chrome Manifest V3, con documento offscreen que mantiene el WebSocket aunque se cierre el popup.
- `relay/`: Cloudflare Worker con Durable Object para transferir lecturas entre los dos dispositivos. **No se necesita Supabase ni base de datos.**

> **Importante:** GitHub Pages solamente sirve archivos estáticos: no ejecuta servidores WebSocket. Por eso se requiere desplegar el relay por separado. El plan gratuito y los límites de Cloudflare pueden cambiar. Para producción revisar cuotas y costos.

## 1. Publicar PWA en GitHub Pages

1. Crear un repositorio GitHub y subir el contenido completo de este ZIP.
2. En **Settings → Pages → Build and deployment**, seleccionar **GitHub Actions**. El workflow incluido publica la carpeta `pwa/`.
3. Esperar a que el workflow termine. La dirección será `https://USUARIO.github.io/REPOSITORIO/` (o tu dominio personalizado).
4. Abrir la URL HTTPS en el celular.

## 2. Desplegar relay en Cloudflare

Necesitás una cuenta Cloudflare y Node.js 20 o superior en tu PC.

```bash
cd relay
npm install
npx wrangler login
npm run deploy
```

Copiá la dirección resultante, por ejemplo `https://scanbridge-relay.TU-SUBDOMINIO.workers.dev`, y cambiá `https://` por `wss://` al configurarla en la extensión. Probá el endpoint `/health` en el navegador.

## 3. Instalar extensión

1. En Chrome de la PC abrir `chrome://extensions`.
2. Activar **Modo desarrollador** → **Cargar descomprimida** → seleccionar la carpeta `extension/`.
3. Abrir el popup, completar **URL del relay** (`wss://...`) y **URL de la PWA** (`https://...github.io/.../`).
4. Presionar **Generar QR seguro**. Se crea una nueva sesión aleatoria (identificador de 128 bits y secreto de 256 bits).
5. Abrir la PWA en el celular: primero se muestra el diálogo de instalación; después el asistente de vinculación. Escanear el QR de la extensión. También se puede copiar/pegar la URL codificada.
6. En la PC, seleccionar un campo editable en una página `http` o `https` y **mantener esa pestaña activa**. Escanear con el celular: el valor se inserta automáticamente.

## 4. Seguridad y funcionamiento

- Sesión aleatoria generada localmente con `crypto.getRandomValues`; QR generado localmente (sin servicio externo).
- La URL de vinculación **contiene un secreto**: no compartir ni publicar. No queda guardada en el historial de navegación de la PWA (se limpia al leerla).
- Cada dispositivo demuestra conocimiento del secreto mediante HMAC-SHA256; el relay compara las pruebas dentro de la sesión. El secreto original no se envía al relay.
- TLS por `https://` y `wss://`. El relay **no guarda lecturas** ni crea registros de usuarios.
- El relay conserva temporalmente las conexiones en memoria. Reiniciar el Durable Object obliga a reconectar; las sesiones no tienen expiración forzada mientras existan clientes. **Regenerá el QR para invalidar la sesión anterior de la PC**. No usar para información sensible sin endurecer autenticación, expiración, controles de abuso y autorización.
- La inserción depende de un campo editable con foco. Algunos sitios, iframes protegidos, páginas `chrome://`, PDF, aplicaciones de escritorio o interfaces que bloquean eventos sintéticos pueden no admitir inserción.
- La opción **Enter** envía eventos de teclado sintéticos; algunos sitios los ignoran.
- `BarcodeDetector` depende del navegador; se recomienda Chrome actualizado en Android. iOS puede requerir un lector de respaldo (no incluido); siempre está disponible el ingreso manual.
- La PWA requiere internet para enviar códigos; el caché permite abrir la interfaz sin conexión, pero no transmitir.

## Limitaciones conocidas

- La extensión usa permisos amplios de páginas web para insertar texto en el campo activo; revisar antes de distribuir públicamente.
- La PWA **no puede forzar** el diálogo de instalación en todos los navegadores; ofrece instrucciones manuales y permite continuar sin instalar.
- La primera sesión debe ser creada desde la extensión. La PWA se vincula escaneando su QR.
- No se incluye publicación en Chrome Web Store ni APK.

## Estructura

```text
.github/workflows/pages.yml
pwa/                  # HTML, CSS, JS, manifest, iconos, SW
extension/            # Manifest V3, popup, offscreen, worker
relay/                # Worker Cloudflare + Durable Object
```

## Actualización 2.1 — footer e identidad visual

- Footer responsive: © 2026 SCAN-BARCODE® · Todos los derechos reservados - Desarrollado por Electrónica Gambino.
- Enlace externo seguro a la web del desarrollador.
- Íconos PNG integrados a la PWA y a la extensión Chrome, incluido favicon y Apple Touch Icon.
- Cache de Service Worker actualizado para distribuir los nuevos recursos.
- Para actualizar Chrome, ingresar a `chrome://extensions` y pulsar **Actualizar** con modo desarrollador habilitado.
- Para actualizar GitHub Pages, subir los cambios al repositorio; esperar el despliegue de Actions y recargar la PWA.

**Nota:** Para operar entre redes diferentes sigue siendo necesario desplegar y configurar el relay Cloudflare como se explica arriba.
