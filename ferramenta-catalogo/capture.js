(()=>{
 'use strict';
 if(window.__planaltoGiftExporterLoaded)return;window.__planaltoGiftExporterLoaded=true;
 const gifts=new Map();let message,exportButton;
 function isGiftList(input){try{const raw=typeof input==='string'?input:input?.url??input?.href;const url=new URL(raw,location.href);return (url.hostname==='www.tiktok.com'||url.hostname.endsWith('.tiktok.com'))&&/\/gift(?:s)?\/(?:v\d+\/)?list(?:\/|$)/.test(url.pathname);}catch{return false;}}
 function safeImage(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}}
 function capture(payload){
  const list=Array.isArray(payload)?payload:payload?.data?.gifts??payload?.gifts;if(!Array.isArray(list))return;
  for(const raw of list.slice(0,5000)){
   if(!raw||typeof raw!=='object')continue;
   const id=String(raw.id??raw.giftId??''),name=String(raw.name??raw.giftName??raw.describe??'').trim();const value=raw.diamond_count??raw.diamondCount;const coins=Number(value);
   if(!/^\d{1,12}$/.test(id)||Number(id)<1||!name||value==null||!Number.isSafeInteger(coins)||coins<0)continue;
   const urls=raw.image?.url_list??raw.image?.urlList??[];const imageUrl=(Array.isArray(urls)?urls:[]).map(safeImage).find(Boolean)||safeImage(raw.imageUrl)||'';
   if(!gifts.has(id)&&gifts.size>=1000)continue;
   gifts.set(id,{id,name:name.slice(0,80),diamond_count:coins,image:{url_list:imageUrl?[imageUrl]:[]}});
  }
  update();
 }
 function update(){if(message)message.textContent=gifts.size?`${gifts.size} presentes encontrados. Clique para salvar a lista.`:'Abra o painel de presentes nesta aba. Não precisa enviar presentes.';if(exportButton)exportButton.disabled=!gifts.size;}
 const originalFetch=window.fetch;
 if(originalFetch)window.fetch=function(...args){const result=Reflect.apply(originalFetch,this,args);if(isGiftList(args[0]))result.then(response=>{if(response.ok)response.clone().json().then(capture).catch(()=>{});}).catch(()=>{});return result;};
 const originalOpen=XMLHttpRequest.prototype.open,tracking=new WeakMap(),registered=new WeakSet();
 XMLHttpRequest.prototype.open=function(method,url,...args){tracking.set(this,isGiftList(url));if(!registered.has(this)){registered.add(this);this.addEventListener('load',()=>{if(!tracking.get(this)||this.status<200||this.status>=300)return;try{if(this.responseType==='json')capture(this.response);else if(!this.responseType||this.responseType==='text')capture(JSON.parse(this.responseText));}catch{}});}return Reflect.apply(originalOpen,this,[method,url,...args]);};
 function mount(){
  const panel=document.createElement('div');panel.id='planalto-gift-exporter';panel.style.cssText='position:fixed;top:12px;right:12px;z-index:2147483647;width:265px;padding:14px;background:#12232b;color:white;border:1px solid #d8bc79;border-radius:10px;font:12px/1.5 Arial,sans-serif;box-shadow:0 8px 28px #0006;text-align:left';
  const title=document.createElement('strong');title.textContent='Corrida do Planalto · ferramenta local';title.style.cssText='display:block;padding-right:20px;color:#f2d48c;font-size:12px';panel.append(title);
  const close=document.createElement('button');close.textContent='×';close.title='Fechar ferramenta nesta aba';close.style.cssText='position:absolute;right:8px;top:5px;background:transparent;border:0;color:white;font-size:20px;cursor:pointer';close.onclick=()=>panel.remove();panel.append(close);
  message=document.createElement('p');panel.append(message);exportButton=document.createElement('button');exportButton.textContent='SALVAR LISTA DE PRESENTES';exportButton.style.cssText='display:block;width:100%;padding:10px;border:0;border-radius:5px;background:#e6c57e;color:#12232b;font:bold 11px Arial;cursor:pointer';exportButton.onclick=()=>{if(!gifts.size)return;const blob=new Blob([JSON.stringify({gifts:[...gifts.values()]},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='catalogo-presentes-tiktok.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);};panel.append(exportButton);
  const note=document.createElement('small');note.textContent='Somente dados dos presentes. Sem cookies, senhas ou envio para servidores.';note.style.cssText='display:block;color:#b3c7cc;font-size:10px;margin-top:8px';panel.append(note);document.body.append(panel);update();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
