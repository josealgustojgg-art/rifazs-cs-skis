import {TikTokLiveConnection,WebcastEvent,ControlEvent} from 'tiktok-live-connector';
import {normalizeUsername} from './gifts.js';
export class TikTokBridge {
 constructor({onStatus,onGift,onCatalog,factory=(name,options)=>new TikTokLiveConnection(name,options)}){Object.assign(this,{onStatus,onGift,onCatalog,factory});this.client=null;this.version=0;}
 async connect(username){
  username=normalizeUsername(username);await this.disconnect();const version=++this.version;
  const client=this.factory(username,{processInitialData:false,enableExtendedGiftInfo:false,fetchRoomInfoOnConnect:true,authenticateWs:false,useMobile:false,webClientOptions:{timeout:{request:15000},retry:{limit:0}}});
  this.client=client;this.onStatus({state:'connecting',message:`Conectando a @${username}…`,username});
  client.on(WebcastEvent.GIFT,data=>{if(this.client===client)this.onGift(data);});
  client.on(ControlEvent.DISCONNECTED,()=>{if(this.client===client)this.onStatus({state:'offline',message:'Conexão encerrada. Verifique a live e reconecte.',username});});
  client.on(WebcastEvent.STREAM_END,()=>{if(this.client===client)this.onStatus({state:'offline',message:'A live terminou.',username});});
  client.on(ControlEvent.ERROR,()=>{if(this.client===client)this.onStatus({state:'error',message:'Erro na conexão TikTok. Verifique a live, a rede e os limites do conector.',username});});
  try {
   const state=await client.connect();if(version!==this.version||this.client!==client){await client.disconnect();return;}
   this.onStatus({state:'connected',message:`Recebendo eventos de @${username}`,username,roomId:String(state.roomId)});
   try{await this.catalog();}catch{/* connection remains usable without the gift catalog */}
  }catch(error){if(version===this.version&&this.client===client){this.client=null;try{await client.disconnect();}catch{}const offline=/offline|not live/i.test(error?.name+' '+error?.message);this.onStatus({state:'error',username,message:offline?'Esta conta não está ao vivo. Inicie a live e tente novamente.':'Não foi possível conectar. Verifique o @, a live, o acesso à rede e os limites do serviço de assinatura. Nenhuma conexão real foi confirmada.'});}}
 }
 async catalog(){if(!this.client)throw new Error('Conecte a uma live primeiro.');const client=this.client;const list=await client.fetchAvailableGifts();const items=Array.isArray(list)?list:list?.gifts??list?.data?.gifts??[];if(!Array.isArray(items))throw new Error('Catálogo indisponível.');const normalized=items.map(g=>({id:String(g.id),name:String(g.name??g.describe??`Presente ${g.id}`),coins:Number(g.diamond_count??g.diamondCount??0)})).filter(g=>/^\d+$/.test(g.id));if(this.client===client)this.onCatalog(normalized);return normalized;}
 async disconnect(){this.version++;const client=this.client;this.client=null;if(client){try{await client.disconnect();}catch{}}this.onStatus({state:'offline',message:'TikTok desconectado. Modo de teste local.'});}
}
