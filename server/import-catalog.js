import {catalogGift} from './gift-images.js';
export function importGiftCatalog(payload){
 const list=Array.isArray(payload)?payload:payload?.data?.gifts??payload?.gifts;
 if(!Array.isArray(list)||!list.length)throw new Error('Cole a resposta JSON que contém a lista gifts, não cabeçalhos, cookies ou uma chave de API.');
 if(list.length>5000)throw new Error('Lista muito grande. Importe até 5.000 presentes.');
 const found=new Map();for(const raw of list){if(!raw||typeof raw!=='object')continue;const gift=catalogGift(raw);if(!/^\d{1,12}$/.test(gift.id)||Number(gift.id)<1||gift.coins==null||!gift.name.trim())continue;if(!found.has(gift.id))found.set(gift.id,gift);}
 if(!found.size)throw new Error('A lista não contém IDs, nomes e preços válidos. Não foram criados presentes fictícios.');
 return [...found.values()].slice(0,1000);
}
