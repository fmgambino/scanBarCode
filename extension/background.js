// SCAN-BARCODE 2.5 — WebSocket persistente en service worker (Chrome 116+)
const OFFSCREEN='offscreen.html';

chrome.runtime.onMessage.addListener((m,s,reply)=>{(async()=>{if(m.type==='configure'){await chrome.storage.local.set({relay:m.relay,room:m.room,secret:m.secret});connectRelay();return {ok:true};}if(m.type==='scan'){return await insert(m.value,m.enter);}if(m.type==='status')return {ok:true};return {ok:false};})().then(reply).catch(e=>reply({ok:false,error:e.message}));return true;});
async function insert(value,enter){if(typeof value!=='string'||value.length>4096)return {ok:false,error:'Código inválido'};const {lastTabId,autoEnter=false}=await chrome.storage.local.get(['lastTabId','autoEnter']);let tab;if(lastTabId)try{tab=await chrome.tabs.get(lastTabId)}catch{}if(!tab){const a=await chrome.tabs.query({active:true,lastFocusedWindow:true});tab=a[0];}if(!tab?.id||!/^https?:/.test(tab.url||''))return {ok:false,error:'Abrí una página web y seleccioná un campo'};try{const r=await chrome.scripting.executeScript({target:{tabId:tab.id,allFrames:true},func:(v,doEnter)=>{let el=document.activeElement;if(!el||!(el.matches('input:not([type=hidden]),textarea')||el.isContentEditable))return {ok:false};if(el.matches('input')&&['checkbox','radio','file','submit','button'].includes(el.type))return {ok:false};el.focus();if(el.isContentEditable){document.execCommand('insertText',false,v)}else{const p=el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;const setter=Object.getOwnPropertyDescriptor(p,'value').set;let a=el.selectionStart??el.value.length,b=el.selectionEnd??a;setter.call(el,el.value.slice(0,a)+v+el.value.slice(b));try{el.setSelectionRange(a+v.length,a+v.length)}catch{}el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}if(doEnter){el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));el.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));}return {ok:true};},args:[value,autoEnter]});const ok=r.some(x=>x.result?.ok);await chrome.storage.local.set({lastResult:ok?'Insertado: '+value.slice(0,60):'No se encontró un campo activo',lastAt:Date.now()});return {ok,error:ok?'':'Seleccioná un campo editable en la pestaña de destino'};}catch(e){return {ok:false,error:e.message};}}
chrome.tabs.onActivated.addListener(({tabId})=>chrome.storage.local.set({lastTabId:tabId}));

// Un único socket en el service worker. El ping cada 20 s evita suspensión por inactividad.
let socket=null,retryTimer=null,heartbeat=null,retryMs=1200,generation=0;
const encoder=new TextEncoder();
async function proofFor(secret,room){
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode('scanbridge:'+room)));
 return [...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function connectRelay(){
 const epoch=++generation;clearTimeout(retryTimer);clearInterval(heartbeat);
 if(socket){const old=socket;socket=null;old.onclose=null;old.close();}
 const {relay,room,secret}=await chrome.storage.local.get(['relay','room','secret']);
 if(epoch!==generation)return;
 if(!relay||!room||!secret)return;
 await chrome.storage.local.set({connected:false,phoneOnline:false,relayState:'Conectando…'});
 let ws;
 try{ws=new WebSocket(relay);socket=ws;}catch(e){await chrome.storage.local.set({relayState:'Error: '+e.message});schedule();return;}
 ws.onopen=async()=>{
  if(epoch!==generation)return;
  try{ws.send(JSON.stringify({type:'join',room,role:'pc',proof:await proofFor(secret,room)}));
   heartbeat=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'ping'}));},20000);
  }catch(e){await chrome.storage.local.set({relayState:'Error de autenticación: '+e.message});ws.close();}
 };
 ws.onmessage=async e=>{
  if(epoch!==generation)return;
  let m;try{m=JSON.parse(e.data)}catch{return;}
  if(m.type==='joined'){retryMs=1200;await chrome.storage.local.set({connected:true,relayState:'Servidor conectado'});}
  if(m.type==='peer')await chrome.storage.local.set({phoneOnline:!!m.online});
  if(m.type==='scan'&&typeof m.value==='string'){
   let result;try{result=await insert(m.value)}catch(err){result={ok:false,error:err.message}}
   if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'ack',id:m.id,ok:!!result.ok,error:result.error||''}));
  }
  if(m.type==='error')await chrome.storage.local.set({relayState:'Error: '+m.error,lastResult:m.error});
 };
 ws.onclose=async()=>{if(epoch!==generation)return;clearInterval(heartbeat);await chrome.storage.local.set({connected:false,phoneOnline:false,relayState:'Reconectando…'});schedule();};
 ws.onerror=()=>{if(ws.readyState!==WebSocket.CLOSED)ws.close();};
 function schedule(){retryTimer=setTimeout(()=>{if(epoch===generation)connectRelay();},retryMs);retryMs=Math.min(Math.round(retryMs*1.6),15000);}
}
chrome.runtime.onInstalled.addListener(()=>connectRelay());
chrome.runtime.onStartup.addListener(()=>connectRelay());
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&(changes.relay||changes.room||changes.secret))connectRelay();});
connectRelay();
