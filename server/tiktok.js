import {TikTokLiveConnection,WebcastEvent,ControlEvent} from 'tiktok-live-connector';
import {normalizeUsername} from './gifts.js';
import {catalogGift} from './gift-images.js';
import {connectionFailure} from './connection-errors.js';
export class TikTokBridge {
 constructor({onStatus,onGift,onCatalog,onCatalogStatus=()=>{},factory=(name,options)=>new TikTokLiveConnection(name,options)}){Object.assign(this,{onStatus,onGift,onCatalog,onCatalogStatus,factory});this.client=null;this.version=0;this.catalogRequests=new WeakMap();}
 async connect(username){
  username=normalizeUsername(username);await this.disconnect();const version=++this.version;
  const client=this.factory(username,{processInitialData:false,enableExtendedGiftInfo:false,fetchRoomInfoOnConnect:true,authenticateWs:false,useMobile:false,webClientOptions:{timeout:{request:15000},retry:{limit:0}}});
  this.client=client;this.onStatus({state:'connecting',message:`Conectando a @${username}…`,username});
  client.on(WebcastEvent.GIFT,data=>{if(this.client===client)this.onGift(data);});
  client.on(ControlEvent.DISCONNECTED,()=>{if(this.client===client)this.onStatus({state:'offline',message:'Conexão encerrada. Verifique a live e reconecte.',username});});
  client.on(WebcastEvent.STREAM_END,()=>{if(this.client===client)this.onStatus({state:'offline',message:'A live terminou.',username});});
  client.on(ControlEvent.ERROR,error=>{if(this.client===client){const failure=connectionFailure(error);if((this.catalogRequests.get(client)??0)>0){this.onCatalogStatus({state:'error',...failure});return;}this.onStatus({state:client.isConnecting?'connecting':client.isConnected?'connected':'error',username,...failure});}});
  try {
   const state=await client.connect();if(version!==this.version||this.client!==client){await client.disconnect();return;}
   this.onStatus({state:'connected',message:`Recebendo eventos de @${username}`,username,roomId:String(state.roomId)});
   try{await this.catalog();}catch{/* Catalog status is separate; keep the established live connection. */}
  }catch(error){if(version===this.version&&this.client===client){this.client=null;try{await client.disconnect();}catch{}const failure=connectionFailure(error);this.onStatus({state:'error',username,...failure});console.warn('[TikTok]',failure.category,failure.message);for(const detail of failure.diagnostics)console.warn('[TikTok]',detail.route,detail.category,detail.httpStatus??detail.code??'');}}
 }
 async catalog(){
  if(!this.client)throw new Error('Conecte a uma live primeiro.');const client=this.client;
  this.catalogRequests.set(client,(this.catalogRequests.get(client)??0)+1);this.onCatalogStatus({state:'loading',message:'Buscando catálogo de presentes…'});
  try{
   const list=await client.fetchAvailableGifts();const items=Array.isArray(list)?list:list?.gifts??list?.data?.gifts;
   if(!Array.isArray(items))throw new Error('Catálogo indisponível.');const normalized=items.map(catalogGift).filter(g=>/^\d+$/.test(g.id));
   if(this.client===client){this.onCatalog(normalized);this.onCatalogStatus({state:'ready',message:`Catálogo carregado: ${normalized.length} presentes.`});}return normalized;
  }catch(error){const failure=connectionFailure(error);if(this.client===client)this.onCatalogStatus({state:'error',...failure});throw new Error(failure.message);
  }finally{this.catalogRequests.set(client,Math.max(0,(this.catalogRequests.get(client)??1)-1));}
 }
 async disconnect(){this.version++;const client=this.client;this.client=null;this.onCatalogStatus({state:'idle',message:'Conecte à live para carregar o catálogo.'});if(client){try{await client.disconnect();}catch{}}this.onStatus({state:'offline',message:'TikTok desconectado. Modo de teste local.'});}
}
