const $=id=>document.getElementById(id);
const DEFAULT_RELAY="wss://scanbridge-relay.fernando-m-gambino.workers.dev";
const DEFAULT_PWA="https://fmgambino.github.io/scanBarCode/pwa/";
const rand=n=>[...crypto.getRandomValues(new Uint8Array(n))].map(x=>x.toString(16).padStart(2,'0')).join('');
let currentLink='';
function link(s){const u=new URL(s.pwa||DEFAULT_PWA);u.searchParams.set('relay',s.relay||DEFAULT_RELAY);u.searchParams.set('room',s.room);u.searchParams.set('key',s.secret);return u.href}
function show(s){currentLink=link(s);$('code').textContent='Sesión '+s.room.slice(0,8).toUpperCase();$('qr').replaceChildren();ScanBridgeQR($('qr'),currentLink)}
async function updateStatus(){const s=await chrome.storage.local.get(['connected','phoneOnline','lastResult','relayState']);$('status').textContent=s.phoneOnline?'● Celular vinculado · listo para escanear':s.connected?'● Servidor conectado · esperando celular':'○ '+(s.relayState||'Conectando al servidor…');$('status').classList.toggle('good',!!s.phoneOnline)}
async function init(){const s=await chrome.storage.local.get(['relay','pwa','room','secret','autoEnter']);$('relay').value=s.relay||DEFAULT_RELAY;$('pwa').value=s.pwa||DEFAULT_PWA;$('enter').checked=!!s.autoEnter;if(s.room&&s.secret)show({...s,relay:s.relay||DEFAULT_RELAY,pwa:s.pwa||DEFAULT_PWA});else await generate();await updateStatus()}
async function generate(){try{const relay=$('relay').value.trim()||DEFAULT_RELAY,pwa=$('pwa').value.trim()||DEFAULT_PWA;if(new URL(relay).protocol!=='wss:')throw Error('El relay debe usar wss://');if(new URL(pwa).protocol!=='https:')throw Error('La PWA debe usar HTTPS');const s={relay,pwa,room:rand(16),secret:rand(32),connected:false,phoneOnline:false};await chrome.storage.local.set(s);show(s);$('status').textContent='QR generado · conectando al servidor…';await chrome.runtime.sendMessage({type:'configure',relay:s.relay,room:s.room,secret:s.secret});}catch(e){$('status').textContent=e.message}}
$('new').onclick=generate;
$('save').onclick=async()=>{await chrome.storage.local.set({relay:$('relay').value.trim(),pwa:$('pwa').value.trim()});await generate();$('save').textContent='Guardado'};
$('copy').onclick=async()=>{if(currentLink){await navigator.clipboard.writeText(currentLink);$('copy').textContent='Enlace copiado'}};
$('enter').onchange=()=>chrome.storage.local.set({autoEnter:$('enter').checked});
chrome.storage.onChanged.addListener(c=>{if(c.connected||c.phoneOnline||c.relayState||c.lastResult)updateStatus()});init();
