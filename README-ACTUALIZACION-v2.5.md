# SCAN-BARCODE® v2.5 — Vinculación reparada

## Errores detectados en el backup

1. `crypto.subtle.importKey` recibía `'HMAC'` sin `hash: 'SHA-256'` en PWA y extensión, produciendo `HmacImportParams: hash: Missing or not an AlgorithmIdentifier`.
2. El WebSocket se administraba desde un documento offscreen con limitaciones de API. Ahora funciona en el service worker de Chrome (Chrome 116+), con heartbeat y reconexión.
3. GitHub Pages podía publicar la carpeta `pwa` como raíz mientras el QR apuntaba a `/pwa/`. El workflow publica ahora la estructura completa y conserva `/pwa/`.

## Publicar

**GitHub:** reemplazar los archivos del repositorio con este ZIP (no subir `.git` ni `node_modules`). En Settings → Pages seleccionar **GitHub Actions**. Verificar que la URL `https://fmgambino.github.io/scanBarCode/pwa/` muestre la versión nueva. Recargar en el móvil y, si fuera necesario, borrar los datos del sitio para retirar el service worker anterior.

**Extensión:** ir a `chrome://extensions`, quitar la extensión anterior y cargar la carpeta `extension` de este ZIP con **Cargar descomprimida**. El popup tiene preconfigurados el relay y la PWA. Chrome 116 o superior.

**Cloudflare:** NO requiere actualizar el Worker: el protocolo `join` y las pruebas HMAC se mantienen; el problema estaba en los clientes.

**Prueba:** generar QR en Chrome → escanear con cámara del celular → abrir enlace → confirmar «Servidor conectado» y «PC vinculada». Para insertar un código, seleccionar primero un campo editable en una página HTTPS normal (no `chrome://` ni Chrome Web Store). La extensión no puede insertar texto en aplicaciones nativas de Windows.

## Alcance de verificación

Se comprobó sintaxis JavaScript y empaquetado. La conexión extremo a extremo necesita probarse en Chrome y el dispositivo móvil reales. No se verificó el estado del relay público desde este entorno.
