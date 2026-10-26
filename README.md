# SCAN-BARCODE® v2.3 — GitHub Pages + Chrome + Cloudflare

## Qué se corrigió

- Extensión preconfigurada con `wss://scanbridge-relay.fernando-m-gambino.workers.dev` y `https://fmgambino.github.io/scanBarCode/pwa/`.
- El QR es un enlace HTTPS completo: **podés escanearlo con la cámara normal del celular**. Al tocar el enlace se abre la PWA y se inicia la vinculación sin necesidad de `BarcodeDetector` para el QR de emparejamiento.
- El lector integrado se mantiene como opción en navegadores compatibles.
- Indicadores independientes de conexión al servidor y de vinculación del teléfono.
- Relay actualizado para notificar a ambos dispositivos cuando se vinculan.
- Se conserva el footer y los íconos.

## Actualizar GitHub Pages

Subí el contenido completo de este ZIP a la raíz del repositorio `scanBarCode`. En GitHub, `Settings > Pages` debe estar configurado en **GitHub Actions**. El workflow incluido publica `pwa/` y el `index.html` raíz redirige a `/pwa/`.

## Actualizar extensión Chrome

En `chrome://extensions`, desactivá/eliminá la extensión antigua si hay duplicados; cargá la carpeta `extension/` con **Cargar descomprimida** y presioná **Actualizar**. Abrí la extensión: la URL y el relay vienen preconfigurados. Se genera un QR automáticamente la primera vez. Para renovar credenciales, presioná **Generar nuevo QR seguro**. El botón **Copiar enlace** permite abrirlo manualmente.

## IMPORTANTE: actualizar el relay que ya desplegaste

Esta versión incluye una corrección necesaria en el relay. Desde PowerShell, dentro de `relay/`:

```powershell
npm.cmd install
npm.cmd run deploy
```

La configuración `wrangler.toml` usa `name = "scanbridge-relay"`, el Worker que ya desplegaste. No hace falta volver a ejecutar `wrangler login` si seguís autenticado. Esperá a que Wrangler confirme el despliegue.

## Probar

1. Abrí la extensión en la PC. Debe indicar **Servidor conectado · esperando celular**.
2. Generá o visualizá el QR.
3. Con la **cámara normal del celular**, escaneá el QR de la pantalla de la PC y tocá el enlace HTTPS que muestra el sistema.
4. La PWA abre el asistente y conecta automáticamente. Ambos equipos deben mostrar la vinculación.
5. En la PC, abrí una página web, hacé clic dentro de un campo de texto, y escaneá un código desde la PWA.

## Límites

- El QR contiene un secreto de sesión. No lo publiques ni compartas; renovalo cuando sea necesario.
- La lectura de códigos de barras desde la PWA utiliza la API `BarcodeDetector`, disponible solo en navegadores compatibles. La vinculación con la **cámara normal** evita esta limitación para el QR inicial.
- La inserción automática está destinada a campos editables de páginas web de Chrome; no escribe en programas nativos de Windows.
- La opción Enter genera eventos sintéticos y puede no activar el envío de algunos formularios.
- No se han realizado pruebas reales de extremo a extremo en dispositivos; se verificó sintaxis y estructura de los archivos.
