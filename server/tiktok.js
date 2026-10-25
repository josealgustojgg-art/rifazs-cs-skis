import {TikTokLiveConnection,WebcastEvent,ControlEvent} from 'tiktok-live-connector';
import {normalizeUsername} from './gifts.js';
import {connectionFailure} from './connection-errors.js';
import {loadGiftCatalog} from './catalog-loader.js';
export class TikTokBridge {
 constructor({onStatus,onGift,onCatalog,onCatalogStatus=()=>{},fetchCatalogOnConnect=()=>true,factory=(name,options)=>new TikTokLiveConnection(name,options)}){Object.assign(this,{onStatus,onGift,onCatalog,onCatalogStatus,fetchCatalogOnConnect,factory});this.client=null;this.version=0;this.catalogRequests=new WeakMap();}
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
   if(this.fetchCatalogOnConnect())try{await this.catalog();}catch{/* Catalog status is separate; keep the established live connection. */}
  }catch(error){if(version===this.version&&this.client===client){this.client=null;try{await client.disconnect();}catch{}const failure=connectionFailure(error);this.onStatus({state:'error',username,...failure});console.warn('[TikTok]',failure.category,failure.message);for(const detail of failure.diagnostics)console.warn('[TikTok]',detail.route,detail.category,detail.httpStatus??detail.code??'');}}
 }
 async catalog(username='soou_jg'){
  const initial=this.client,version=this.version,client=initial??this.factory(normalizeUsername(username),{processInitialData:false,authenticateWs:false,useMobile:false});
  const current=()=>this.version===version&&this.client===initial;
  this.catalogRequests.set(client,(this.catalogRequests.get(client)??0)+1);this.onCatalogStatus({state:'loading',message:initial?'Buscando catálogo de presentes…':'Buscando catálogo de referência, sem iniciar live…'});
  try{
   const {items,source}=await loadGiftCatalog(client,{live:Boolean(initial?.isConnected??initial)});
   if(current()){this.onCatalog(items);this.onCatalogStatus({state:'ready',source,message:source==='reference'?`Catálogo de referência carregado: ${items.length} presentes. A disponibilidade na sua live precisa ser conferida.`:`Catálogo da live carregado: ${items.length} presentes.`});}return items;
  }catch(error){const failure=connectionFailure(error);if(current())this.onCatalogStatus({state:'error',...failure});throw new Error(failure.message);
  }finally{this.catalogRequests.set(client,Math.max(0,(this.catalogRequests.get(client)??1)-1));}
 }
 async disconnect(){this.version++;const client=this.client;this.client=null;this.onCatalogStatus({state:'idle',message:'Conecte à live para carregar o catálogo.'});if(client){try{await client.disconnect();}catch{}}this.onStatus({state:'offline',message:'TikTok desconectado. Modo de teste local.'});}
}
