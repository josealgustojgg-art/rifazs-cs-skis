import {safeGiftImage,giftCoins} from './gift-images.js';
const KINDS = new Set(['rose','heart','turbo','special']);
export function validateRules(value) {
 if(!Array.isArray(value)||value.length>30)throw new Error('Configure no máximo 30 presentes.');
 const ids=new Set();return value.map(rule=>{
  const id=String(rule.id??'').trim(),name=String(rule.name??'').trim();
  if(!/^\d{1,12}$/.test(id)||Number(id)<1||ids.has(id))throw new Error('Cada presente precisa de um ID numérico único.');
  if(!['r','g'].includes(rule.team)||!KINDS.has(rule.kind))throw new Error('Corredor ou efeito inválido.');
  ids.add(id);return {id,name:name.slice(0,80)||`Presente ${id}`,team:rule.team,kind:rule.kind,imageUrl:safeGiftImage(rule.imageUrl),coins:giftCoins(rule.coins)};
 });
}
export function normalizeUsername(value) {
 const username=String(value??'').trim().replace(/^@/,'');
 if(!/^[A-Za-z0-9_.]{2,32}$/.test(username))throw new Error('Informe apenas o @ público da conta, sem URL ou senha.');
 return username;
}
export class GiftRouter {
 constructor({clock=()=>Date.now()}={}){this.seen=new Map();this.clock=clock;}
 reset(){this.seen.clear();}
 route(data,rules) {
  const now=this.clock();for(const [id,expiry]of this.seen)if(expiry<=now)this.seen.delete(id);
  const id=String(data.giftId??'');const rule=rules.find(r=>r.id===id);if(!rule)return null;
  const type=Number(data.giftDetails?.giftType??data.giftType??data.extendedGiftInfo?.type??0);
  // Streaks contain cumulative counts: award only the final event, once.
  if(type===1&&data.repeatEnd!==true&&data.repeatEnd!==1)return null;
  const quantity=Number(data.repeatCount??1);if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100000)return null;
  const user=String(data.user?.userId??data.user?.uniqueId??data.userId??'');
  const messageId=String(data.common?.msgId??data.msgId??'');
  const group=String(data.groupId??'');
  const key=type===1&&group&&group!=='0'?`s:${user}:${id}:${group}`:messageId&&messageId!=='0'?`m:${messageId}`:null;
  // Without a stable event identity, do not risk crediting duplicates.
  if(!key||this.seen.has(key))return null;
  if(this.seen.size>=20000)this.seen.delete(this.seen.keys().next().value);
  this.seen.set(key,now+30*60*1000);
  return {team:rule.team,kind:rule.kind,quantity,name:rule.name};
 }
}
