import http from 'node:http';
import {readFile,writeFile,rename} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {WebSocketServer,WebSocket} from 'ws';
import {Race,CONFIG} from '../src/game.js';
import {GiftRouter,validateRules,normalizeUsername} from './gifts.js';
import {TikTokBridge} from './tiktok.js';
import {resolveStaticPath} from './paths.js';
import {balancedGiftSelection} from './gift-pairs.js';
import {observedGift,mergeGiftMetadata} from './observed-gifts.js';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=process.env.PLANALTO_CONFIG_PATH?resolve(process.env.PLANALTO_CONFIG_PATH):resolve(root,'.planalto-live.json'),dist=resolve(root,'dist');
let config={username:'soou_jg',rules:[]};
try{const saved=JSON.parse(await readFile(file,'utf8'));config={username:saved.username?normalizeUsername(saved.username):'',rules:validateRules(saved.rules??[])};}catch(error){if(error.code!=='ENOENT')console.warn('Configuração local inválida; configure novamente pelo painel.');}
const port=Number(process.env.PLANALTO_PORT??8080);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PLANALTO_PORT inválida.');
const host='127.0.0.1',race=new Race(),router=new GiftRouter();
let status={state:'offline',message:'Modo de teste local. Nenhuma live conectada.'},catalog=[],observedIds=new Set(),catalogStatus={state:'idle',message:'Conecte à live para carregar o catálogo.'},pending=[],lastGift=null,closing=false;
const wss=new WebSocketServer({noServer:true,maxPayload:8192});
const send=(ws,value)=>{if(ws.readyState===WebSocket.OPEN&&ws.bufferedAmount<1024*1024)ws.send(JSON.stringify(value));};
const broadcast=value=>{for(const ws of wss.clients)send(ws,value);};
function snapshot(){return {round:race.round,time:race.time,ended:race.ended,paused:race.paused,winner:race.winner??null,restartIn:race.restartIn,runners:race.runners,autoRestart:true,duration:CONFIG.duration};}
function info(){return {status,config,catalog,catalogStatus,observedCount:observedIds.size,pending:pending.length,lastGift};}
function publish(){broadcast({type:'connection',...info()});}
function grant(gift){if(race.paused||race.ended){if(pending.length<1000){pending.push(gift);publish();}else{status={...status,message:'Fila de presentes cheia. Pause a conexão para verificar o jogo.'};publish();}return;}race.gift(gift.team,gift.kind,gift.quantity);}
for(const type of ['gift','finish','reset'])race.addEventListener(type,event=>broadcast({type:'event',event:type,detail:event.detail??null}));
const bridge=new TikTokBridge({onStatus:value=>{status=value;publish();},onCatalog:value=>{catalog=mergeGiftMetadata(catalog,value);publish();},onCatalogStatus:value=>{catalogStatus=value;publish();},onGift:data=>{
 const metadata=observedGift(data);if(metadata){observedIds.add(metadata.id);catalog=mergeGiftMetadata(catalog,[metadata]);publish();}
 const gift=router.route(data,config.rules);if(!gift)return;lastGift={name:gift.name,team:gift.team,quantity:gift.quantity,at:Date.now()};grant(gift);publish();
}});
function trustedOrigin(req){if(!req.headers.origin)return true;try{const u=new URL(req.headers.origin);return ['127.0.0.1','localhost'].includes(u.hostname)&&['8080',String(port),'5173'].includes(u.port)&&u.protocol==='http:';}catch{return false;}}
function safeHost(req){return [`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host);}
function json(res,code,data){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
async function body(req){if(!String(req.headers['content-type']).startsWith('application/json'))throw new Error('Use JSON.');let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>8192)throw new Error('Pedido muito grande.');}return JSON.parse(text||'{}');}
const server=http.createServer(async(req,res)=>{
 if(!safeHost(req)||!trustedOrigin(req)){json(res,403,{error:'Acesso permitido somente pelo painel local.'});return;}
 const pathname=new URL(req.url,'http://localhost').pathname;
 try{
  if(req.method==='GET'&&pathname==='/api/state'){json(res,200,{...info(),race:snapshot()});return;}
  if(req.method==='POST'&&pathname.startsWith('/api/')){
   const input=await body(req);
   if(pathname==='/api/config'){
    const username=input.username?normalizeUsername(input.username):'';const rules=validateRules(Array.isArray(input.rules)?input.rules.map(rule=>{const item=catalog.find(g=>g.id===String(rule.id));return item?{...rule,name:item.name,coins:item.coins,imageUrl:item.imageUrl}:rule;}):input.rules);
    if(status.state==='connected'&&username!==config.username)throw new Error('Desconecte antes de trocar o @ da conta.');
    if(status.state==='connecting')throw new Error('Aguarde a conexão antes de salvar.');
    await writeFile(file+'.tmp',JSON.stringify({username,rules},null,2),{mode:0o600});await rename(file+'.tmp',file);config={username,rules};publish();json(res,200,{ok:true});return;
   }
   if(pathname==='/api/auto-gifts'){
    if(!catalog.length)throw new Error('Conecte à live e carregue o catálogo antes de configurar os pares.');
    const rules=balancedGiftSelection(catalog);
    await writeFile(file+'.tmp',JSON.stringify({...config,rules},null,2),{mode:0o600});await rename(file+'.tmp',file);config={...config,rules};publish();json(res,200,{ok:true,config});return;
   }
   if(pathname==='/api/connect'){
    if(status.state==='connecting'||status.state==='connected')throw new Error('Uma conexão já está ativa. Desconecte antes de trocar a conta.');
    if(!config.username)throw new Error('Salve o @ da conta antes de conectar.');
    router.reset();catalog=[];observedIds.clear();void bridge.connect(config.username).catch(()=>{status={state:'error',message:'Não foi possível iniciar o conector.'};publish();});json(res,202,{ok:true});return;
   }
   if(pathname==='/api/disconnect'){await bridge.disconnect();json(res,200,{ok:true});return;}
   if(pathname==='/api/catalog'){await bridge.catalog();json(res,200,{ok:true});return;}
   if(pathname==='/api/control'){
    if(input.action==='reset')race.reset();else if(input.action==='pause')race.toggle();else if(input.action==='gift'){
     if(!['r','g'].includes(input.team)||!Object.hasOwn(CONFIG.gifts,input.kind))throw new Error('Presente inválido.');
     if(race.paused||race.ended)throw new Error('Aguarde a próxima rodada ou continue a corrida.');
     race.gift(input.team,input.kind);
    }else throw new Error('Comando inválido.');
    broadcast({type:'state',race:snapshot()});json(res,200,{ok:true});return;
   }
   json(res,404,{error:'Operação não encontrada.'});return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
  if(pathname==='/favicon.ico'){res.writeHead(204);res.end();return;}
  const relative=pathname==='/'?'index.html':decodeURIComponent(pathname).replace(/^\//,'');
  const target=resolveStaticPath(dist,relative);if(!target){res.writeHead(403);res.end();return;}
  const contents=await readFile(target);const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.glb':'model/gltf-binary'}[extname(target)]??'application/octet-stream';
  res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:contents);
 }catch(error){if(error.code==='ENOENT'){res.writeHead(404);res.end('Arquivo não encontrado. Execute npm run build antes de iniciar.');}else json(res,400,{error:error.message?.slice(0,240)||'Pedido inválido.'});}
});
server.on('upgrade',(req,socket,head)=>{if(!safeHost(req)||!trustedOrigin(req)||req.url!=='/live'){socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>{send(ws,{type:'connection',...info()});send(ws,{type:'state',race:snapshot()});});});
let previous=performance.now(),count=0;
const timer=setInterval(()=>{const now=performance.now(),dt=Math.min(1,(now-previous)/1000);previous=now;race.update(dt);if(!race.ended&&!race.paused&&pending.length){const batch=pending.splice(0,100);for(const gift of batch)grant(gift);publish();}if(++count%2===0)broadcast({type:'state',race:snapshot()});},50);
server.on('error',error=>{clearInterval(timer);console.error(error.code==='EADDRINUSE'?`Porta ${port} ocupada. Feche o outro servidor ou defina PLANALTO_PORT.`:error.message);process.exitCode=1;});
server.listen(port,host,()=>{const url=`http://${host}:${port}`;console.log(`\nCORRIDA DO PLANALTO\nPainel: ${url}\nTransmissão 9:16: ${url}/?live=1\nMantenha esta janela aberta.\n`);if(process.argv.includes('--open')){if(process.platform==='win32')execFile('cmd',['/c','start','',url]);else if(process.platform==='darwin')execFile('open',[url]);else execFile('xdg-open',[url],()=>{});}});
async function close(){if(closing)return;closing=true;clearInterval(timer);await bridge.disconnect();for(const ws of wss.clients)ws.close();wss.close();server.close();}
process.on('SIGINT',close);process.on('SIGTERM',close);
