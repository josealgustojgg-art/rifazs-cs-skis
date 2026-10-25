import {TikTokLiveConnection,WebcastEvent,ControlEvent} from 'tiktok-live-connector';
import {normalizeUsername} from './gifts.js';
import {catalogGift} from './gift-images.js';
import {connectionFailure} from './connection-errors.js';
export class TikTokBridge {
 constructor({onStatus,onGift,onCatalog,factory=(name,options)=>new TikTokLiveConnection(name,options)}){Object.assign(this,{onStatus,onGift,onCatalog,factory});this.client=null;this.version=0;}
 async connect(username){
  username=normalizeUsername(username);await this.disconnect();const version=++this.version;
  const client=this.factory(username,{processInitialData:false,enableExtendedGiftInfo:false,fetchRoomInfoOnConnect:true,authenticateWs:false,useMobile:false,webClientOptions:{timeout:{request:15000},retry:{limit:0}}});
  this.client=client;this.onStatus({state:'connecting',message:`Conectando a @${username}…`,username});
  client.on(WebcastEvent.GIFT,data=>{if(this.client===client)this.onGift(data);});
  client.on(ControlEvent.DISCONNECTED,()=>{if(this.client===client)this.onStatus({state:'offline',message:'Conexão encerrada. Verifique a live e reconecte.',username});});
  client.on(WebcastEvent.STREAM_END,()=>{if(this.client===client)this.onStatus({state:'offline',message:'A live terminou.',username});});
  client.on(ControlEvent.ERROR,error=>{if(this.client===client){const failure=connectionFailure(error);this.onStatus({state:client.isConnecting?'connecting':client.isConnected?'connected':'error',username,...failure});}});
  try {
   const state=await client.connect();if(version!==this.version||this.client!==client){await client.disconnect();return;}
   this.onStatus({state:'connected',message:`Recebendo eventos de @${username}`,username,roomId:String(state.roomId)});
   try{await this.catalog();}catch(error){if(this.client===client)this.onStatus({state:'connected',username,roomId:String(state.roomId),message:'Live conectada, mas o catálogo não carregou. '+error.message});}
  }catch(error){if(version===this.version&&this.client===client){this.client=null;try{await client.disconnect();}catch{}const failure=connectionFailure(error);this.onStatus({state:'error',username,...failure});console.warn('[TikTok]',failure.category,failure.message);for(const detail of failure.diagnostics)console.warn('[TikTok]',detail.route,detail.category,detail.httpStatus??detail.code??'');}}
 }
 async catalog(){if(!this.client)throw new Error('Conecte a uma live primeiro.');const client=this.client;let list;try{list=await client.fetchAvailableGifts();}catch(error){throw new Error(connectionFailure(error).message);}const items=Array.isArray(list)?list:list?.gifts??list?.data?.gifts??[];if(!Array.isArray(items))throw new Error('Catálogo indisponível.');const normalized=items.map(catalogGift).filter(g=>/^\d+$/.test(g.id));if(this.client===client)this.onCatalog(normalized);return normalized;}
 async disconnect(){this.version++;const client=this.client;this.client=null;if(client){try{await client.disconnect();}catch{}}this.onStatus({state:'offline',message:'TikTok desconectado. Modo de teste local.'});}
}
