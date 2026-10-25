import {catalogGift} from './gift-images.js';
// Connector 2.5 uses protobuf v3: metadata is in gift, not giftDetails.
export function observedGift(data){
 const id=String(data.giftId??'');if(!/^\d{1,12}$/.test(id)||Number(id)<1)return null;
 const details=data.gift??data.giftDetails??data.extendedGiftInfo??{};
 if(details.id&&String(details.id)!==id)return null;
 return catalogGift({...details,id,name:details.name||details.giftName||`Presente ${id}`,diamondCount:details.diamondCount??details.diamond_count});
}
export function mergeGiftMetadata(previous,incoming){
 const map=new Map(previous.map(g=>[g.id,g]));
 for(const item of incoming){const old=map.get(item.id);map.set(item.id,{...item,name:item.name===`Presente ${item.id}`&&old?old.name:item.name,coins:item.coins??old?.coins??null,imageUrl:item.imageUrl||old?.imageUrl||''});}
 return [...map.values()].slice(-1000);
}
